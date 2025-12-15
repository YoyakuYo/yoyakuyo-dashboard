-- Migration: Enforce bookings.user_id NOT NULL constraint
-- This ensures ALL bookings have a valid user_id for proper ownership tracking

-- ============================================
-- 1. Backfill any NULL user_ids from line_bookings
-- ============================================
-- First, try to backfill from line_bookings via user_identities
UPDATE bookings b
SET user_id = ui.user_id
FROM line_bookings lb
JOIN user_identities ui ON lb.line_user_id = ui.provider_user_id AND ui.provider = 'line'
WHERE b.id = lb.booking_id
  AND b.user_id IS NULL
  AND ui.user_id IS NOT NULL;

-- ============================================
-- 2. Backfill from customer_profiles if still NULL
-- ============================================
UPDATE bookings b
SET user_id = cp.customer_auth_id
FROM customer_profiles cp
WHERE b.customer_profile_id = cp.id
  AND b.user_id IS NULL
  AND cp.customer_auth_id IS NOT NULL;

-- ============================================
-- 3. For any remaining NULL user_ids, create orphaned user records
-- ============================================
-- This should not happen, but as a safety measure, create placeholder users
-- Check which name column exists (name or full_name)
DO $$
DECLARE
    booking_record RECORD;
    orphaned_user_id UUID;
    name_column TEXT;
    has_name_column BOOLEAN;
    has_full_name_column BOOLEAN;
BEGIN
    -- Check which name column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'name'
    ) INTO has_name_column;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'full_name'
    ) INTO has_full_name_column;
    
    -- Determine which column to use
    IF has_name_column THEN
        name_column := 'name';
    ELSIF has_full_name_column THEN
        name_column := 'full_name';
    ELSE
        -- No name column exists, use email only
        name_column := NULL;
    END IF;
    
    FOR booking_record IN 
        SELECT id, customer_name, customer_email, created_at
        FROM bookings
        WHERE user_id IS NULL
    LOOP
        -- Create orphaned user record
        -- Use dynamic SQL to handle different table schemas
        IF name_column IS NOT NULL THEN
            -- Table has name or full_name column
            EXECUTE format(
                'INSERT INTO public.users (%I, email, created_at, updated_at) VALUES ($1, $2, $3, $4) RETURNING id',
                name_column
            )
            USING 
                COALESCE(booking_record.customer_name, 'Orphaned User'),
                COALESCE(booking_record.customer_email, 'orphaned_' || REPLACE(booking_record.id::TEXT, '-', '') || '@yoyakuyo.com'),
                COALESCE(booking_record.created_at, NOW()),
                COALESCE(booking_record.created_at, NOW())
            INTO orphaned_user_id;
        ELSE
            -- No name column, use email only (check if email is required)
            BEGIN
                INSERT INTO public.users (email, created_at, updated_at)
                VALUES (
                    COALESCE(booking_record.customer_email, 'orphaned_' || REPLACE(booking_record.id::TEXT, '-', '') || '@yoyakuyo.com'),
                    COALESCE(booking_record.created_at, NOW()),
                    COALESCE(booking_record.created_at, NOW())
                )
                RETURNING id INTO orphaned_user_id;
            EXCEPTION WHEN OTHERS THEN
                -- If email is required and we have it, try again with just email
                -- Otherwise, this booking cannot be fixed automatically
                RAISE WARNING 'Could not create orphaned user for booking %: %', booking_record.id, SQLERRM;
                CONTINUE;
            END;
        END IF;
        
        -- Update booking with orphaned user_id
        UPDATE bookings
        SET user_id = orphaned_user_id
        WHERE id = booking_record.id;
        
        RAISE NOTICE 'Created orphaned user % for booking %', orphaned_user_id, booking_record.id;
    END LOOP;
END $$;

-- ============================================
-- 4. Add NOT NULL constraint
-- ============================================
-- First, drop the existing foreign key constraint if it allows NULL
DO $$
BEGIN
    -- Check if constraint exists and allows NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'user_id'
        AND is_nullable = 'YES'
    ) THEN
        -- Make column NOT NULL
        ALTER TABLE bookings 
        ALTER COLUMN user_id SET NOT NULL;
        
        RAISE NOTICE 'Set bookings.user_id to NOT NULL';
    END IF;
END $$;

-- ============================================
-- 5. Update foreign key constraint to CASCADE (not SET NULL)
-- ============================================
DO $$
BEGIN
    -- Drop existing foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'bookings_user_id_fkey'
        AND conrelid = 'public.bookings'::regclass
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_user_id_fkey;
    END IF;
    
    -- Add new foreign key with CASCADE
    ALTER TABLE bookings
    ADD CONSTRAINT bookings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Updated bookings.user_id foreign key to CASCADE';
END $$;

-- ============================================
-- 6. Add check constraint to ensure user_id is never NULL
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'bookings_user_id_not_null'
        AND conrelid = 'public.bookings'::regclass
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_user_id_not_null
        CHECK (user_id IS NOT NULL);
        
        RAISE NOTICE 'Added bookings.user_id NOT NULL check constraint';
    END IF;
END $$;

-- ============================================
-- 7. Update index to remove WHERE clause (no longer needed)
-- ============================================
DROP INDEX IF EXISTS bookings_user_id_idx;
CREATE INDEX bookings_user_id_idx ON bookings(user_id);

COMMENT ON COLUMN bookings.user_id IS 'MANDATORY: Canonical user ID from public.users table. All bookings MUST have a user_id for proper ownership tracking.';

