-- Migration: Fix customer_profiles RLS policies
-- The current RLS policy checks auth.uid() = id, but we're using customer_auth_id
-- Since customers use custom auth (not Supabase Auth), auth.uid() is NULL
-- This migration updates the policies to allow profile creation via service role or function

-- ============================================
-- 1. Drop existing policies
-- ============================================
DROP POLICY IF EXISTS "Customers can read own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Customers can insert own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Customers can update own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Service role can manage customer profiles" ON customer_profiles;

-- ============================================
-- 2. Create a function to create customer profiles (bypasses RLS)
-- ============================================
-- This function uses SECURITY DEFINER to run with elevated privileges
CREATE OR REPLACE FUNCTION create_customer_profile(
  p_customer_auth_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Generate a new UUID for the profile
  v_profile_id := gen_random_uuid();
  
  -- Insert the profile (bypasses RLS because of SECURITY DEFINER)
  INSERT INTO customer_profiles (id, customer_auth_id, email, name, phone)
  VALUES (v_profile_id, p_customer_auth_id, p_email, p_name, p_phone)
  ON CONFLICT (email) DO UPDATE
  SET customer_auth_id = EXCLUDED.customer_auth_id,
      name = EXCLUDED.name,
      phone = COALESCE(EXCLUDED.phone, customer_profiles.phone)
  RETURNING id INTO v_profile_id;
  
  RETURN v_profile_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_customer_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_customer_profile TO anon;

-- ============================================
-- 3. Create updated RLS policies
-- ============================================

-- SELECT policy: Allow reading profile if customer_auth_id matches auth.uid()
-- OR if id matches auth.uid() (for backward compatibility with Supabase Auth users)
CREATE POLICY "Customers can read own profile"
ON customer_profiles
FOR SELECT
USING (
  (customer_auth_id IS NOT NULL AND customer_auth_id = auth.uid()) OR
  (id = auth.uid())
);

-- INSERT policy: Allow inserting profile if id matches auth.uid()
-- (For Supabase Auth users only - custom auth users should use the function)
CREATE POLICY "Customers can insert own profile"
ON customer_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- UPDATE policy: Allow updating profile if customer_auth_id matches auth.uid()
-- OR if id matches auth.uid() (for backward compatibility)
CREATE POLICY "Customers can update own profile"
ON customer_profiles
FOR UPDATE
USING (
  (customer_auth_id IS NOT NULL AND customer_auth_id = auth.uid()) OR
  (id = auth.uid())
)
WITH CHECK (
  (customer_auth_id IS NOT NULL AND customer_auth_id = auth.uid()) OR
  (id = auth.uid())
);

-- ============================================
-- 4. Add service role policy for backend operations
-- ============================================
-- This allows the API (using service role key) to manage customer profiles
CREATE POLICY "Service role can manage customer profiles"
ON customer_profiles
FOR ALL
USING (true)
WITH CHECK (true);

-- Add comments
COMMENT ON TABLE customer_profiles IS 'Customer account profiles. Use create_customer_profile() function for custom auth users.';
COMMENT ON FUNCTION create_customer_profile IS 'Creates a customer profile bypassing RLS. Use this for custom auth users.';

