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
-- Allow customers to read bookings where:
-- 1. customer_id = auth.uid() (old structure, for Supabase Auth users)
-- 2. user_id = auth.uid() (new structure, for web customers)
-- 3. customer_profile_id matches a profile where customer_auth_id = auth.uid() (web customers with profiles)
CREATE POLICY "bookings_read_own"
ON bookings
FOR SELECT
USING (
  -- Old structure: customer_id = auth.uid()
  customer_id = auth.uid()
  OR
  -- New structure: user_id = auth.uid()
  user_id = auth.uid()
  OR
  -- Web customers with profiles: customer_profile_id matches profile where customer_auth_id = auth.uid()
  EXISTS (
    SELECT 1 FROM customer_profiles cp
    WHERE cp.id = bookings.customer_profile_id
    AND cp.customer_auth_id = auth.uid()
  )
  OR
  -- Fallback: customer_profile_id = auth.uid() (old structure)
  customer_profile_id = auth.uid()
);

-- ============================================
-- Update INSERT policy to allow web customers
-- ============================================
DROP POLICY IF EXISTS "bookings_insert_own" ON bookings;

CREATE POLICY "bookings_insert_own"
ON bookings
FOR INSERT
WITH CHECK (
  -- Old structure: customer_id = auth.uid()
  customer_id = auth.uid()
  OR
  -- New structure: user_id = auth.uid()
  user_id = auth.uid()
  OR
  -- Web customers with profiles: customer_profile_id matches profile where customer_auth_id = auth.uid()
  EXISTS (
    SELECT 1 FROM customer_profiles cp
    WHERE cp.id = bookings.customer_profile_id
    AND cp.customer_auth_id = auth.uid()
  )
  OR
  -- Fallback: customer_profile_id = auth.uid() (old structure)
  customer_profile_id = auth.uid()
  OR
  -- Allow guest bookings (customer_id is NULL, user_id is NULL, customer_profile_id is NULL)
  (customer_id IS NULL AND user_id IS NULL AND customer_profile_id IS NULL)
);

-- ============================================
-- Comments
-- ============================================
COMMENT ON POLICY "bookings_read_own" ON bookings IS 'Allows customers to read their own bookings by customer_id, user_id, or customer_profile_id';
COMMENT ON POLICY "bookings_insert_own" ON bookings IS 'Allows customers to create their own bookings or guest bookings';

