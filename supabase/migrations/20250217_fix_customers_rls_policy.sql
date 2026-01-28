-- ====================================================================
-- FIX: Customers RLS Policy
-- ====================================================================
-- The current policy "Users can read own customer data" uses:
--   USING (auth.uid() = id)
-- 
-- This is WRONG because:
-- 1. Guests don't have auth.uid() - their id is a random UUID
-- 2. LINE customers don't have auth.uid() - their id is a random UUID
-- 3. The policy should check auth_user_id, not id
--
-- Since all customers are guests or LINE (no web authenticated customers),
-- and the API uses service role to manage them, we should either:
-- - Remove this policy (service role handles everything)
-- - Fix it to check auth_user_id for future web customers
-- ====================================================================

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can read own customer data" ON customers;

-- Create a fixed policy that checks auth_user_id instead of id
-- This will work for future web authenticated customers (if any)
-- Guests and LINE customers are handled by service role (bypasses RLS)
CREATE POLICY "Users can read own customer data"
ON customers
FOR SELECT
USING (
  -- For web authenticated customers (if they exist in future)
  auth_user_id IS NOT NULL AND auth_user_id = auth.uid()
);

-- Note: Guests and LINE customers don't have auth.uid(), so they can't use this policy
-- The API uses service role key to bypass RLS for guest/LINE operations
-- This is correct behavior - guests don't need to read their own customer record directly

COMMENT ON POLICY "Users can read own customer data" ON customers IS 
  'Allows authenticated users to read their own customer record by matching auth_user_id. Guests and LINE customers are handled by service role.';
