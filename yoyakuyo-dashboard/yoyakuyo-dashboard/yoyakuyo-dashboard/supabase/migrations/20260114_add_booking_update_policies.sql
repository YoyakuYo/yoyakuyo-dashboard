-- Migration: Add UPDATE policies for bookings table
-- Allows authenticated users to update their own bookings
-- Matches the existing SELECT and INSERT policies

-- ============================================
-- UPDATE policy for customers to update their own bookings
-- ============================================
DROP POLICY IF EXISTS "bookings_update_own" ON bookings;

CREATE POLICY "bookings_update_own"
ON bookings
FOR UPDATE
USING (
  -- Check if the booking belongs to a web customer where auth_user_id = current user
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = bookings.customer_id
    AND c.auth_user_id = auth.uid()
  )
  OR
  -- Allow updates to guest bookings (no ownership check for guests)
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = bookings.customer_id
    AND c.role = 'guest'
  )
)
WITH CHECK (
  -- Same conditions for the new row after update
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = bookings.customer_id
    AND c.auth_user_id = auth.uid()
  )
  OR
  -- Allow updates to guest bookings (no ownership check for guests)
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = bookings.customer_id
    AND c.role = 'guest'
  )
);

-- ============================================
-- Service role can update all bookings (bypasses RLS)
-- ============================================
DROP POLICY IF EXISTS "bookings_update_service_role" ON bookings;

CREATE POLICY "bookings_update_service_role"
ON bookings
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- Comments
-- ============================================
COMMENT ON POLICY "bookings_update_own" ON bookings IS 'Allows customers to update their own bookings by checking if customer_id references a customer with matching auth_user_id, or allows guest booking updates';
COMMENT ON POLICY "bookings_update_service_role" ON bookings IS 'Allows service role to update all bookings (bypasses RLS)';

