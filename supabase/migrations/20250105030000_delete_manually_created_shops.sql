-- Migration: Delete manually created shops
-- This script helps identify and delete shops created manually by a specific user
-- 
-- INSTRUCTIONS:
-- 1. Replace 'YOUR_USER_EMAIL' with your actual email address
-- 2. Review the shops that will be deleted
-- 3. Run this migration

DO $$
DECLARE
  target_email TEXT := 'YOUR_USER_EMAIL@example.com'; -- <<<<<<< REPLACE WITH YOUR EMAIL
  target_user_id UUID;
  shops_to_delete UUID[];
  shop_record RECORD;
BEGIN
  RAISE NOTICE 'Starting shop deletion process...';
  RAISE NOTICE 'Target email: %', target_email;

  -- Find user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    -- Fallback: try public.users
    SELECT id INTO target_user_id
    FROM public.users
    WHERE email = target_email
    LIMIT 1;
  END IF;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please check the email address.', target_email;
  END IF;

  RAISE NOTICE 'Found user ID: %', target_user_id;

  -- Find all shops owned by this user (manually created shops)
  -- These are shops where owner_user_id matches and claim_status is 'approved'
  SELECT ARRAY_AGG(id) INTO shops_to_delete
  FROM shops
  WHERE owner_user_id = target_user_id
    AND claim_status = 'approved'
    AND (
      -- Shops created recently (within last 7 days) are likely manually created
      created_at > NOW() - INTERVAL '7 days'
      OR
      -- Or shops with claimed_at set (manually claimed/created)
      claimed_at IS NOT NULL
    );

  IF shops_to_delete IS NULL OR array_length(shops_to_delete, 1) IS NULL THEN
    RAISE NOTICE 'No shops found to delete for user: %', target_email;
    RETURN;
  END IF;

  RAISE NOTICE 'Found % shops to delete:', array_length(shops_to_delete, 1);

  -- Show which shops will be deleted
  FOR shop_record IN
    SELECT id, name, address, created_at, claim_status
    FROM shops
    WHERE id = ANY(shops_to_delete)
    ORDER BY created_at DESC
  LOOP
    RAISE NOTICE '  - % (ID: %, Created: %)', shop_record.name, shop_record.id, shop_record.created_at;
  END LOOP;

  -- Delete related data first
  RAISE NOTICE 'Deleting related data...';
  
  -- Delete services
  DELETE FROM services WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS shop_record = ROW_COUNT;
  RAISE NOTICE '  Deleted % services', shop_record;

  -- Delete bookings
  DELETE FROM bookings WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS shop_record = ROW_COUNT;
  RAISE NOTICE '  Deleted % bookings', shop_record;

  -- Delete shop settings
  DELETE FROM shop_settings WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS shop_record = ROW_COUNT;
  RAISE NOTICE '  Deleted % shop settings', shop_record;

  -- Delete owner profiles
  DELETE FROM owner_profiles WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS shop_record = ROW_COUNT;
  RAISE NOTICE '  Deleted % owner profiles', shop_record;

  -- Delete waitlist notifications
  DELETE FROM waitlist_notifications WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS shop_record = ROW_COUNT;
  RAISE NOTICE '  Deleted % waitlist notifications', shop_record;

  -- Delete shop claim requests
  DELETE FROM shop_claim_requests WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS shop_record = ROW_COUNT;
  RAISE NOTICE '  Deleted % shop claim requests', shop_record;

  -- Finally, delete the shops
  RAISE NOTICE 'Deleting shops...';
  DELETE FROM shops WHERE id = ANY(shops_to_delete);
  GET DIAGNOSTICS shop_record = ROW_COUNT;
  RAISE NOTICE '✅ Successfully deleted % shops', shop_record;

  RAISE NOTICE '';
  RAISE NOTICE '=== DELETION COMPLETE ===';
  RAISE NOTICE 'You can now create a new shop.';

END $$;

