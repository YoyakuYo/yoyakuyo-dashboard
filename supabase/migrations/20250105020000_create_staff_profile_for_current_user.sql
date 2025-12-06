-- ============================================================================
-- CREATE STAFF PROFILE FOR CURRENT USER
-- ============================================================================
-- This migration creates a staff profile for a user
-- 
-- INSTRUCTIONS:
-- 1. Get your auth user ID from Supabase Auth dashboard or from your session
-- 2. Replace 'YOUR_AUTH_USER_ID_HERE' with your actual auth.users.id
-- 3. Run this migration
-- ============================================================================

-- ============================================================================
-- METHOD 1: Create staff profile for a specific user by email
-- ============================================================================
-- Replace 'your-email@example.com' with your actual email address
DO $$
DECLARE
  target_email TEXT := 'sowoumar45@gmail.com';  -- CHANGE THIS TO YOUR EMAIL
  current_user_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Find user by email in auth.users
  SELECT id, email, COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', email) 
  INTO current_user_id, user_email, user_name
  FROM auth.users
  WHERE email = target_email
  LIMIT 1;

  IF current_user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found in auth.users. Trying public.users...', target_email;
    
    -- Try to find in public.users
    SELECT id, email, name
    INTO current_user_id, user_email, user_name
    FROM public.users
    WHERE email = target_email
    LIMIT 1;
    
    IF current_user_id IS NULL THEN
      RAISE EXCEPTION 'User with email % not found. Please check your email address or use METHOD 2 below.', target_email;
    END IF;
  END IF;

  -- Check if staff profile already exists
  IF EXISTS (SELECT 1 FROM staff_profiles WHERE auth_user_id = current_user_id) THEN
    RAISE NOTICE 'Staff profile already exists for user: %', user_email;
    
    -- Update to ensure it's active and super admin
    UPDATE staff_profiles
    SET 
      is_super_admin = TRUE,
      active = TRUE,
      updated_at = NOW()
    WHERE auth_user_id = current_user_id;
    
    RAISE NOTICE '✅ Updated existing staff profile to super admin and active';
  ELSE
    -- Create new staff profile
    INSERT INTO staff_profiles (
      auth_user_id,
      full_name,
      email,
      is_super_admin,
      active
    ) VALUES (
      current_user_id,
      COALESCE(user_name, user_email),
      user_email,
      TRUE,  -- Super admin
      TRUE   -- Active
    );
    
    RAISE NOTICE '✅ Created staff profile for user: % (ID: %)', user_email, current_user_id;
    RAISE NOTICE '✅ Granted super admin access';
  END IF;

END $$;

-- ============================================================================
-- METHOD 2: Create staff profile by user ID (if you know your UUID)
-- ============================================================================
-- Uncomment and replace 'YOUR_USER_ID_HERE' with your actual user ID:
--
-- INSERT INTO staff_profiles (auth_user_id, full_name, email, is_super_admin, active)
-- SELECT 
--   id as auth_user_id,
--   COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', email) as full_name,
--   email,
--   TRUE as is_super_admin,
--   TRUE as active
-- FROM auth.users
-- WHERE id = 'YOUR_USER_ID_HERE'::UUID
-- ON CONFLICT (auth_user_id) DO UPDATE SET
--   is_super_admin = TRUE,
--   active = TRUE,
--   updated_at = NOW();
--
-- If user is not in auth.users, try public.users:
--
-- INSERT INTO staff_profiles (auth_user_id, full_name, email, is_super_admin, active)
-- SELECT 
--   id as auth_user_id,
--   COALESCE(name, email) as full_name,
--   email,
--   TRUE as is_super_admin,
--   TRUE as active
-- FROM public.users
-- WHERE id = 'YOUR_USER_ID_HERE'::UUID
-- ON CONFLICT (auth_user_id) DO UPDATE SET
--   is_super_admin = TRUE,
--   active = TRUE,
--   updated_at = NOW();
-- ============================================================================

