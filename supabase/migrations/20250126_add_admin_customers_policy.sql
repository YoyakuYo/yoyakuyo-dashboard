-- Add admin policy for customers table to allow admins to see all customers
-- This fixes the analytics page not showing LINE customers

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "customers_read_self" ON customers;

-- Customers can see themselves
CREATE POLICY "customers_read_self"
ON customers
FOR SELECT
USING (id = auth.uid());

-- Admins can see all customers
CREATE POLICY "admins_read_all_customers"
ON customers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = auth.uid()
      AND c.is_admin = true
  )
);