-- Migration: Delete user accounts
-- This script deletes user accounts for the specified emails
-- 
-- Configured emails:
-- - sowoumar45@gmail.com
-- - omarsowbarca45@gmail.com
--
-- INSTRUCTIONS:
-- 1. Review the users that will be deleted (shown in the output)
-- 2. Run this migration in Supabase SQL Editor

DO $$
DECLARE
  target_emails TEXT[] := ARRAY['sowoumar45@gmail.com', 'omarsowbarca45@gmail.com'];
  target_user_ids UUID[];
  current_email TEXT;
  current_user_id UUID;
  user_count INTEGER := 0;
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE 'Starting user account deletion process...';
  RAISE NOTICE 'Target emails: %', array_to_string(target_emails, ', ');

  -- Find user IDs for all emails
  FOREACH current_email IN ARRAY target_emails
  LOOP
    -- Find user ID from auth.users first
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
    RAISE NOTICE 'No users found for the provided emails.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found % user(s) out of % email(s)', user_count, array_length(target_emails, 1);

  -- Show which users will be deleted
  RAISE NOTICE '';
  RAISE NOTICE 'Users to be deleted:';
  FOR current_user_id IN SELECT unnest(target_user_ids)
  LOOP
    DECLARE
      user_name TEXT;
      user_email TEXT;
    BEGIN
      SELECT name, email INTO user_name, user_email
      FROM public.users
      WHERE id = current_user_id
      LIMIT 1;
      
      IF user_name IS NULL THEN
        SELECT COALESCE(raw_user_meta_data->>'name', email) INTO user_name
        FROM auth.users
        WHERE id = current_user_id
        LIMIT 1;
        SELECT email INTO user_email
        FROM auth.users
        WHERE id = current_user_id
        LIMIT 1;
      END IF;
      
      RAISE NOTICE '  - % (%)', COALESCE(user_name, 'Unknown'), COALESCE(user_email, 'No email');
    END;
  END LOOP;

  -- Delete related data first (order matters due to foreign key constraints)
  RAISE NOTICE '';
  RAISE NOTICE 'Deleting related data...';

  -- Delete bookings
  DELETE FROM bookings WHERE customer_profile_id IN (
    SELECT id FROM customer_profiles WHERE customer_auth_id = ANY(target_user_ids)
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % bookings', deleted_count;

  -- Delete customer favorites
  DELETE FROM customer_favorites WHERE customer_id IN (
    SELECT id FROM customer_profiles WHERE customer_auth_id = ANY(target_user_ids)
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % customer favorites', deleted_count;

  -- Delete customer profiles
  DELETE FROM customer_profiles WHERE customer_auth_id = ANY(target_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % customer profiles', deleted_count;

  -- Delete owner profiles
  DELETE FROM owner_profiles WHERE owner_user_id = ANY(target_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % owner profiles', deleted_count;

  -- Delete staff profiles (if any)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_profiles') THEN
    DELETE FROM staff_profiles WHERE auth_user_id = ANY(target_user_ids);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  Deleted % staff profiles', deleted_count;
  END IF;

  -- Delete waitlist notifications
  DELETE FROM waitlist_notifications WHERE customer_id IN (
    SELECT id FROM customer_profiles WHERE customer_auth_id = ANY(target_user_ids)
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % waitlist notifications', deleted_count;

  -- Delete notifications
  DELETE FROM notifications WHERE 
    (recipient_type = 'customer' AND recipient_id::uuid = ANY(target_user_ids))
    OR (recipient_type = 'owner' AND recipient_id::uuid = ANY(target_user_ids));
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % notifications', deleted_count;

  -- Delete messages (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    DELETE FROM messages WHERE sender_id = ANY(target_user_ids) OR recipient_id = ANY(target_user_ids);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  Deleted % messages', deleted_count;
  END IF;

  -- Delete from public.users
  RAISE NOTICE '';
  RAISE NOTICE 'Deleting from public.users...';
  DELETE FROM public.users WHERE id = ANY(target_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % users from public.users', deleted_count;

  -- Delete from auth.users (this will cascade to most related data)
  RAISE NOTICE 'Deleting from auth.users...';
  DELETE FROM auth.users WHERE id = ANY(target_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % users from auth.users', deleted_count;

  RAISE NOTICE '';
  RAISE NOTICE '=== DELETION COMPLETE ===';
  RAISE NOTICE 'User accounts deleted successfully.';

END $$;

