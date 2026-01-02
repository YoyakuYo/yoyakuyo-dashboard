-- ============================================
-- FIX OWNER ROLE
-- ============================================
-- Customer with email omarsowbarca45@gmail.com should be role = 'owner'
-- Currently it's role = 'customer' which is incorrect
-- ============================================

-- STEP 1: Check current role
SELECT 
  'Current status' as check_type,
  c.id,
  c.role,
  au.email,
  c.created_at
FROM customers c
INNER JOIN auth.users au ON au.id = c.id
WHERE au.email = 'omarsowbarca45@gmail.com';

-- STEP 2: Update role to 'owner' (if it's currently 'customer')
UPDATE customers
SET role = 'owner'
WHERE id IN (
  SELECT c.id 
  FROM customers c
  INNER JOIN auth.users au ON au.id = c.id
  WHERE au.email = 'omarsowbarca45@gmail.com'
  AND c.role = 'customer'
);

-- STEP 3: Verify the update
SELECT 
  'After update' as check_type,
  c.id,
  c.role,
  au.email,
  c.created_at
FROM customers c
INNER JOIN auth.users au ON au.id = c.id
WHERE au.email = 'omarsowbarca45@gmail.com';

-- ============================================
-- NOTE: After running this, the WEB customer count should be 1
-- ============================================

