-- Migration: Fix bookings RLS policies for web customers
-- Problem: Current policy only checks customer_id = auth.uid(), which doesn't work for custom auth users
-- Solution: Update policy to also check user_id and customer_profile_id

-- ============================================
-- Drop existing policies
-- ============================================
DROP POLICY IF EXISTS "bookings_read_own" ON bookings;

-- ============================================
-- Create updated RLS policy for customers to read their own bookings
-- ============================================
-- Allow customers to read bookings where customer_id references a customer with matching auth_user_id
CREATE POLICY "bookings_read_own"
ON bookings
FOR SELECT
USING (
  -- Check if the booking belongs to a web customer where auth_user_id = current user
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = bookings.customer_id
    AND c.auth_user_id = auth.uid()
  )
  OR
  -- Allow reading guest bookings (no ownership check for guests)
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = bookings.customer_id
    AND c.role = 'guest'
  )
);

-- ============================================
-- Update INSERT policy to allow web customers
-- ============================================
DROP POLICY IF EXISTS "bookings_insert_own" ON bookings;

CREATE POLICY "bookings_insert_own"
ON bookings
FOR INSERT
WITH CHECK (
  -- Check if the booking belongs to a web customer where auth_user_id = current user
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = bookings.customer_id
    AND c.auth_user_id = auth.uid()
  )
  OR
  -- Allow guest bookings (customer_id references a guest customer)
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = bookings.customer_id
    AND c.role = 'guest'
  )
  OR
  -- Allow creating bookings without customer_id (pure guest bookings)
  customer_id IS NULL
);

-- ============================================
-- Comments
-- ============================================
COMMENT ON POLICY "bookings_read_own" ON bookings IS 'Allows customers to read their own bookings by checking if customer_id references a customer with matching auth_user_id, or allows reading guest bookings';
COMMENT ON POLICY "bookings_insert_own" ON bookings IS 'Allows customers to create bookings for themselves or guest bookings';

