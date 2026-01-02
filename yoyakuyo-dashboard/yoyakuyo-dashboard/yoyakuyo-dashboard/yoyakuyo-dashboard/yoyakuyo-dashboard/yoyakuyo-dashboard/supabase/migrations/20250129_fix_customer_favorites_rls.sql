-- Migration: Fix customer_favorites RLS policy
-- The current RLS policy checks auth.uid() = customer_id
-- But customer_id references customer_profiles.id
-- For web customers, we need to check if customer_profiles.customer_auth_id = auth.uid()
-- OR if customer_profiles.id = auth.uid() (old structure)

-- ============================================
-- Drop existing policies
-- ============================================
DROP POLICY IF EXISTS "Customers can read own favorites" ON customer_favorites;
DROP POLICY IF EXISTS "Customers can insert own favorites" ON customer_favorites;
DROP POLICY IF EXISTS "Customers can delete own favorites" ON customer_favorites;

-- ============================================
-- Create updated RLS policies
-- ============================================

-- Policy for SELECT: Customers can read their own favorites
-- Check if customer_profiles.customer_auth_id = auth.uid() OR customer_profiles.id = auth.uid()
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
    )
  )
);

-- Policy for INSERT: Customers can insert their own favorites
-- Check if customer_profiles.customer_auth_id = auth.uid() OR customer_profiles.id = auth.uid()
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
-- Check if customer_profiles.customer_auth_id = auth.uid() OR customer_profiles.id = auth.uid()
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

-- Add comment
COMMENT ON POLICY "Customers can read own favorites" ON customer_favorites IS 
'Allows customers to read their own favorites by checking if customer_profiles.customer_auth_id or customer_profiles.id matches auth.uid()';

COMMENT ON POLICY "Customers can insert own favorites" ON customer_favorites IS 
'Allows authenticated customers to insert favorites for their own profile';

COMMENT ON POLICY "Customers can delete own favorites" ON customer_favorites IS 
'Allows customers to delete their own favorites by checking if customer_profiles.customer_auth_id or customer_profiles.id matches auth.uid()';

