-- Test script to verify owner_profiles table works correctly
-- This simulates what the API is trying to do

-- Step 1: Check current user (you'll need to replace with actual user ID)
-- For testing, we'll use a test approach

-- Step 2: Try to insert/upsert an owner profile
-- Replace '00000000-0000-0000-0000-000000000000' with a real user ID from auth.users
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get first user ID for testing (or use a specific one)
  SELECT id INTO test_user_id 
  FROM auth.users 
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No users found in auth.users';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Testing with user ID: %', test_user_id;
  
  -- Try to upsert (this is what the API does)
  INSERT INTO owner_profiles (
    id,
    full_name,
    created_at
  ) VALUES (
    test_user_id,
    '',
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, owner_profiles.full_name),
    updated_at = NOW();
  
  RAISE NOTICE 'SUCCESS: Owner profile upserted successfully';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
    RAISE NOTICE 'Error Code: %', SQLSTATE;
END $$;

-- Step 3: Check RLS policies are working
-- This should show if RLS is blocking the insert
SELECT 
  'RLS Policy Check' AS check_type,
  policyname,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'owner_profiles'
ORDER BY policyname;

-- Step 4: Check if we can select from the table
SELECT 
  'Table Access Test' AS check_type,
  COUNT(*) AS total_profiles,
  COUNT(CASE WHEN full_name IS NULL OR full_name = '' THEN 1 END) AS empty_names
FROM owner_profiles;

-- Step 5: Check foreign key constraint
SELECT 
  'Foreign Key Check' AS check_type,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'owner_profiles'
  AND tc.constraint_type = 'FOREIGN KEY';

