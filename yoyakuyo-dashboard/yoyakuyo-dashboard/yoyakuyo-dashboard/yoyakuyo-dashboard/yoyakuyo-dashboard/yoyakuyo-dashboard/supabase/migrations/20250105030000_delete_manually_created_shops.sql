-- Migration: Delete manually created shops
-- This script helps identify and delete shops created manually by specific users
-- 
-- Configured emails:
-- - sowoumar45@gmail.com
-- - omarsowbarca45@gmail.com
--
-- INSTRUCTIONS:
-- 1. Review the shops that will be deleted (shown in the output)
-- 2. Run this migration in Supabase SQL Editor

DO $$
DECLARE
  target_emails TEXT[] := ARRAY['sowoumar45@gmail.com', 'omarsowbarca45@gmail.com'];
  target_user_ids UUID[];
  current_email TEXT;
  current_user_id UUID;
  shops_to_delete UUID[];
  shop_record RECORD;
  user_count INTEGER := 0;
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE 'Starting shop deletion process...';
  RAISE NOTICE 'Target emails: %', array_to_string(target_emails, ', ');

  -- Find user IDs for all emails
  FOREACH current_email IN ARRAY target_emails
  LOOP
    -- Find user ID from email
    SELECT id INTO current_user_id
    FROM auth.users
    WHERE email = current_email
    LIMIT 1;

    IF current_user_id IS NULL THEN
      -- Fallback: try public.users
      SELECT id INTO current_user_id
      FROM public.users
      WHERE email = current_email
      LIMIT 1;
    END IF;

    IF current_user_id IS NOT NULL THEN
      target_user_ids := array_append(target_user_ids, current_user_id);
      user_count := user_count + 1;
      RAISE NOTICE 'Found user ID for %: %', current_email, current_user_id;
    ELSE
      RAISE WARNING 'User with email % not found. Skipping...', current_email;
    END IF;
  END LOOP;

  IF array_length(target_user_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'No users found for the provided emails. Please check the email addresses.';
  END IF;

  RAISE NOTICE 'Found % user(s) out of % email(s)', user_count, array_length(target_emails, 1);

  -- Find all shops owned by these users (manually created shops)
  -- These are shops where owner_user_id matches and claim_status is 'approved'
  SELECT ARRAY_AGG(id) INTO shops_to_delete
  FROM shops
  WHERE owner_user_id = ANY(target_user_ids)
    AND claim_status = 'approved'
    AND (
      -- Shops created recently (within last 30 days) are likely manually created
      created_at > NOW() - INTERVAL '30 days'
      OR
      -- Or shops with claimed_at set (manually claimed/created)
      claimed_at IS NOT NULL
    );

  IF shops_to_delete IS NULL OR array_length(shops_to_delete, 1) IS NULL THEN
    RAISE NOTICE 'No shops found to delete for the provided emails: %', array_to_string(target_emails, ', ');
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

  -- Delete related data first (order matters due to foreign key constraints)
  RAISE NOTICE 'Deleting related data...';
  
  -- Delete bookings first (they reference services, so must be deleted before services)
  DELETE FROM bookings WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % bookings', deleted_count;

  -- Delete services (now safe since bookings are deleted)
  DELETE FROM services WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % services', deleted_count;

  -- Delete shop settings
  DELETE FROM shop_settings WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % shop settings', deleted_count;

  -- Delete owner profiles
  DELETE FROM owner_profiles WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % owner profiles', deleted_count;

  -- Delete waitlist notifications
  DELETE FROM waitlist_notifications WHERE shop_id = ANY(shops_to_delete);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % waitlist notifications', deleted_count;

  -- Delete shop claim requests (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shop_claim_requests') THEN
    DELETE FROM shop_claim_requests WHERE shop_id = ANY(shops_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  Deleted % shop claim requests', deleted_count;
  ELSE
    RAISE NOTICE '  shop_claim_requests table does not exist, skipping...';
  END IF;

  -- Finally, delete the shops
  RAISE NOTICE 'Deleting shops...';
  DELETE FROM shops WHERE id = ANY(shops_to_delete);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Successfully deleted % shops', deleted_count;

  RAISE NOTICE '';
  RAISE NOTICE '=== DELETION COMPLETE ===';
  RAISE NOTICE 'You can now create a new shop.';

END $$;

