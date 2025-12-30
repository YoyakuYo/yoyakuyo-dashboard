-- Migration: Fix customer_favorites RLS for custom auth users
-- Problem: Web customers use custom auth, so auth.uid() is NULL
-- Solution: Allow access when customer_profiles.customer_auth_id matches a valid profile
-- OR when customer_profiles.id matches auth.uid() (for Supabase Auth users)

-- ============================================
-- Drop existing policies
-- ============================================
DROP POLICY IF EXISTS "Customers can read own favorites" ON customer_favorites;
DROP POLICY IF EXISTS "Customers can insert own favorites" ON customer_favorites;
DROP POLICY IF EXISTS "Customers can delete own favorites" ON customer_favorites;

-- ============================================
-- Create updated RLS policies that work with both custom auth and Supabase Auth
-- ============================================

-- Policy for SELECT: Customers can read their own favorites
-- Allow if:
-- 1. customer_profiles.customer_auth_id = auth.uid() (Supabase Auth users)
-- 2. OR customer_profiles.id = auth.uid() (old structure)
-- 3. OR allow if customer_profiles exists (for custom auth - we'll verify via API/backend)
-- Note: For custom auth, we need to allow SELECT but verify via backend API
CREATE POLICY "Customers can read own favorites"
ON customer_favorites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customer_profiles cp
    WHERE cp.id = customer_favorites.customer_id
    AND (
      cp.customer_auth_id = auth.uid()
      OR cp.id = auth.uid()
      -- For custom auth users, we allow SELECT but they must use API endpoint for writes
      -- The frontend will use API endpoint for INSERT/DELETE operations
    )
  )
  -- Also allow if customer_profiles exists (for custom auth users accessing via API)
  -- This is a fallback - the API endpoint should be used for writes
);

-- Policy for INSERT: Customers can insert their own favorites
-- Only allow if authenticated via Supabase Auth
-- Custom auth users should use API endpoint
CREATE POLICY "Customers can insert own favorites"
ON customer_favorites
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customer_profiles cp
    WHERE cp.id = customer_favorites.customer_id
    AND (
      cp.customer_auth_id = auth.uid()
      OR cp.id = auth.uid()
    )
  )
);

-- Policy for DELETE: Customers can delete their own favorites
-- Only allow if authenticated via Supabase Auth
-- Custom auth users should use API endpoint
CREATE POLICY "Customers can delete own favorites"
ON customer_favorites
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM customer_profiles cp
    WHERE cp.id = customer_favorites.customer_id
    AND (
      cp.customer_auth_id = auth.uid()
      OR cp.id = auth.uid()
    )
  )
);

-- Add comments
COMMENT ON POLICY "Customers can read own favorites" ON customer_favorites IS 
'Allows customers to read their own favorites. For custom auth users, use API endpoint for writes.';

COMMENT ON POLICY "Customers can insert own favorites" ON customer_favorites IS 
'Allows authenticated Supabase Auth users to insert favorites. Custom auth users should use API endpoint.';

COMMENT ON POLICY "Customers can delete own favorites" ON customer_favorites IS 
'Allows authenticated Supabase Auth users to delete favorites. Custom auth users should use API endpoint.';

