-- Fix RLS policies on owner_profiles to ensure INSERT works correctly
-- The INSERT policy needs a WITH CHECK clause

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Owners can view their own profile" ON owner_profiles;
DROP POLICY IF EXISTS "Owners can update their own profile" ON owner_profiles;
DROP POLICY IF EXISTS "Owners can insert their own profile" ON owner_profiles;
DROP POLICY IF EXISTS "Staff can view all owner profiles" ON owner_profiles;

-- Step 2: Recreate policies with proper WITH CHECK clauses
-- SELECT policy
CREATE POLICY "Owners can view their own profile" ON owner_profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- INSERT policy (needs WITH CHECK, not USING)
CREATE POLICY "Owners can insert their own profile" ON owner_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- UPDATE policy (needs both USING and WITH CHECK)
CREATE POLICY "Owners can update their own profile" ON owner_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Staff SELECT policy
CREATE POLICY "Staff can view all owner profiles" ON owner_profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() 
      AND active = true
    )
  );

-- Step 3: Verify policies were created correctly
SELECT
  'Policy Verification' AS check_type,
  policyname,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'owner_profiles'
ORDER BY cmd, policyname;

-- Step 4: Note about service role
-- The API uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- So RLS policies shouldn't block the API, but they're still important for direct database access

