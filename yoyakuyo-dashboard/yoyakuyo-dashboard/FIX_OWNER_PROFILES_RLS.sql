-- Fix RLS policies on owner_profiles to ensure inserts work correctly
-- The issue might be that RLS policies are too restrictive

-- Step 1: Disable RLS temporarily to check if that's the issue
-- (We'll re-enable it after fixing policies)
ALTER TABLE owner_profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Owners can view their own profile" ON owner_profiles;
DROP POLICY IF EXISTS "Owners can update their own profile" ON owner_profiles;
DROP POLICY IF EXISTS "Owners can insert their own profile" ON owner_profiles;
DROP POLICY IF EXISTS "Staff can view all owner profiles" ON owner_profiles;

-- Step 3: Re-enable RLS
ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create more permissive policies that definitely work
-- Policy 1: Owners can view their own profile
CREATE POLICY "Owners can view their own profile" ON owner_profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: Owners can insert their own profile
-- This is critical - make sure it allows inserts
CREATE POLICY "Owners can insert their own profile" ON owner_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Policy 3: Owners can update their own profile
CREATE POLICY "Owners can update their own profile" ON owner_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Staff can view all profiles
CREATE POLICY "Staff can view all owner profiles" ON owner_profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() 
      AND active = true
    )
  );

-- Step 5: Verify policies were created
SELECT 
  'Policy Verification' AS check_type,
  policyname,
  cmd AS operation,
  CASE 
    WHEN cmd = 'INSERT' THEN 'CRITICAL - Must allow inserts'
    ELSE 'OK'
  END AS importance
FROM pg_policies
WHERE tablename = 'owner_profiles'
ORDER BY cmd, policyname;

-- Step 6: Test if we can see the table structure
SELECT 
  'Table Structure' AS check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'owner_profiles'
ORDER BY ordinal_position;

-- Step 7: Refresh PostgREST cache
SELECT pg_notify('pgrst', 'reload schema');

