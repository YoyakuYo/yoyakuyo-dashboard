-- ============================================
-- MIGRATE EXISTING BOOKINGS DATA
-- ============================================
-- This script migrates existing bookings to the new canonical structure

-- ============================================
-- STEP 1 — CREATE CUSTOMERS FROM EXISTING AUTH USERS
-- ============================================

-- Create customers for all existing auth.users
INSERT INTO customers (id, role, created_at)
SELECT 
  u.id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM shops WHERE owner_id = u.id) THEN 'owner'
    ELSE 'customer'
  END as role,
  u.created_at
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- ============================================
-- STEP 2 — CREATE LINE_ACCOUNTS FROM EXISTING DATA
-- ============================================

-- Migrate from user_identities if it still exists
DO $$
DECLARE
  identity_record RECORD;
  customer_id_val UUID;
BEGIN
  -- Check if user_identities table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_identities'
  ) THEN
    FOR identity_record IN
      SELECT ui.user_id, ui.provider_user_id
      FROM user_identities ui
      WHERE ui.provider = 'line'
    LOOP
      -- Ensure customer exists
      INSERT INTO customers (id, role)
      VALUES (identity_record.user_id, 'customer')
      ON CONFLICT (id) DO NOTHING;

      -- Create line_accounts mapping
      INSERT INTO line_accounts (customer_id, line_user_id, created_at)
      VALUES (identity_record.user_id, identity_record.provider_user_id, now())
      ON CONFLICT (line_user_id) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- Migrate from bookings_backup (if we have line_user_id)
DO $$
DECLARE
  booking_record RECORD;
  customer_id_val UUID;
  auth_user_id_val UUID;
BEGIN
  FOR booking_record IN
    SELECT DISTINCT old_line_user_id
    FROM bookings_backup
    WHERE old_line_user_id IS NOT NULL
  LOOP
    -- Get or create customer for this LINE user
    SELECT get_or_create_customer_from_line(booking_record.old_line_user_id) INTO customer_id_val;
    
    RAISE NOTICE 'Migrated LINE user: % -> customer_id: %', booking_record.old_line_user_id, customer_id_val;
  END LOOP;
END $$;

-- ============================================
-- STEP 3 — MIGRATE BOOKINGS TO NEW STRUCTURE
-- ============================================

-- Migrate bookings from backup
DO $$
DECLARE
  booking_record RECORD;
  customer_id_val UUID;
  source_val TEXT;
BEGIN
  FOR booking_record IN
    SELECT * FROM bookings_backup
  LOOP
    -- Determine customer_id based on old booking_type
    IF booking_record.old_booking_type = 'line' AND booking_record.old_line_user_id IS NOT NULL THEN
      -- Get customer_id from line_accounts
      SELECT la.customer_id INTO customer_id_val
      FROM line_accounts la
      WHERE la.line_user_id = booking_record.old_line_user_id
      LIMIT 1;
      
      source_val := 'line';
      
      -- If not found, create it
      IF customer_id_val IS NULL THEN
        SELECT get_or_create_customer_from_line(booking_record.old_line_user_id) INTO customer_id_val;
      END IF;
      
    ELSIF booking_record.old_booking_type = 'user' AND booking_record.old_user_id IS NOT NULL THEN
      -- Check if user exists in auth.users
      IF EXISTS (SELECT 1 FROM auth.users WHERE id = booking_record.old_user_id) THEN
        -- Use existing user_id as customer_id
        customer_id_val := booking_record.old_user_id;
        source_val := 'web';
        
        -- Ensure customer exists
        INSERT INTO customers (id, role)
        VALUES (customer_id_val, 'customer')
        ON CONFLICT (id) DO NOTHING;
      ELSE
        -- User doesn't exist in auth.users - skip this booking
        RAISE WARNING 'Skipping booking % - user_id % does not exist in auth.users', booking_record.id, booking_record.old_user_id;
        CONTINUE;
      END IF;
      
    ELSIF booking_record.old_booking_type = 'guest' AND booking_record.old_guest_id IS NOT NULL THEN
      -- For guests, we need to create a customer
      -- Use guest_id as a seed for generating a deterministic UUID or create new
      -- For now, create a new customer for each guest booking
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
      )
      VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'guest_' || booking_record.old_guest_id || '@guest.user',
        '',
        now(),
        booking_record.created_at,
        now(),
        '{"provider":"guest","providers":["guest"]}'::jsonb,
        jsonb_build_object('guest_id', booking_record.old_guest_id),
        false,
        'authenticated'
      )
      RETURNING id INTO customer_id_val;

      INSERT INTO customers (id, role)
      VALUES (customer_id_val, 'guest')
      ON CONFLICT (id) DO NOTHING;
      
      source_val := 'guest';
    ELSE
      -- Fallback: try to use old_user_id if available
      IF booking_record.old_user_id IS NOT NULL THEN
        -- Check if user exists in auth.users
        IF EXISTS (SELECT 1 FROM auth.users WHERE id = booking_record.old_user_id) THEN
          customer_id_val := booking_record.old_user_id;
          source_val := 'web';
          
          INSERT INTO customers (id, role)
          VALUES (customer_id_val, 'customer')
          ON CONFLICT (id) DO NOTHING;
        ELSE
          -- User doesn't exist - skip this booking
          RAISE WARNING 'Skipping booking % - user_id % does not exist in auth.users', booking_record.id, booking_record.old_user_id;
          CONTINUE;
        END IF;
      ELSE
        -- Skip this booking if we can't determine customer
        RAISE WARNING 'Skipping booking % - cannot determine customer_id', booking_record.id;
        CONTINUE;
      END IF;
    END IF;

    -- Insert booking with new structure
    INSERT INTO bookings (
      id,
      customer_id,
      shop_id,
      service_id,
      source,
      status,
      booked_for,
      start_time,
      end_time,
      customer_name,
      customer_email,
      customer_phone,
      notes,
      created_at,
      updated_at
    )
    VALUES (
      booking_record.id,
      customer_id_val,
      booking_record.shop_id,
      booking_record.service_id,
      source_val,
      COALESCE(booking_record.status, 'pending'),
      COALESCE(booking_record.start_time, booking_record.date::timestamptz, now()),
      booking_record.start_time,
      booking_record.end_time,
      booking_record.customer_name,
      booking_record.customer_email,
      booking_record.customer_phone,
      booking_record.notes,
      booking_record.created_at,
      booking_record.updated_at
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Migrated booking: % -> customer_id: %, source: %', booking_record.id, customer_id_val, source_val;
  END LOOP;
END $$;

-- ============================================
-- STEP 4 — VERIFY MIGRATION
-- ============================================

DO $$
DECLARE
  backup_count INTEGER;
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM bookings_backup;
  SELECT COUNT(*) INTO migrated_count FROM bookings;
  
  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  Backup bookings: %', backup_count;
  RAISE NOTICE '  Migrated bookings: %', migrated_count;
  
  IF migrated_count < backup_count THEN
    RAISE WARNING 'Some bookings were not migrated. Check logs above.';
  END IF;
END $$;

-- ============================================
-- STEP 5 — CLEANUP (OPTIONAL - COMMENTED OUT FOR SAFETY)
-- ============================================

-- Uncomment after verifying migration is successful
-- DROP TABLE IF EXISTS bookings_backup;

