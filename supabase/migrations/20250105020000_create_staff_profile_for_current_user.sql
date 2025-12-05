-- ============================================================================
-- CREATE STAFF PROFILE FOR CURRENT USER
-- ============================================================================
-- This migration creates a staff profile for the current authenticated user
-- Run this after logging in to grant yourself staff access
-- 
-- INSTRUCTIONS:
-- 1. Get your auth user ID from Supabase Auth dashboard or from your session
-- 2. Replace 'YOUR_AUTH_USER_ID_HERE' with your actual auth.users.id
-- 3. Run this migration
-- ============================================================================

DO $$
DECLARE
  current_user_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get the current authenticated user ID
  -- Note: This will only work if run in a context where auth.uid() is available
  -- For manual execution, you'll need to replace this with your actual user ID
  
  -- Try to get from auth context first
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    -- If auth.uid() is not available, you must manually set the user ID
    -- Replace 'YOUR_AUTH_USER_ID_HERE' with your actual user ID
    RAISE NOTICE 'auth.uid() not available. Please manually set current_user_id in the script.';
    -- Uncomment and set your user ID:
    -- current_user_id := 'YOUR_AUTH_USER_ID_HERE'::UUID;
    RETURN;
  END;

  -- Get user email and name from auth.users
  SELECT email, COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', email) 
  INTO user_email, user_name
  FROM auth.users
  WHERE id = current_user_id
  LIMIT 1;

  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User not found in auth.users. Please ensure you are logged in and the user ID is correct.';
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
-- MANUAL INSTRUCTIONS (if auth.uid() doesn't work)
-- ============================================================================
-- If the above doesn't work, run this SQL manually after replacing YOUR_USER_ID:
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
-- ============================================================================

