-- Fix Guest Customer Roles
-- NOTE: Guest customers ARE customers and SHOULD have role='customer' in users table
-- This script only identifies issues, does NOT remove customer role from guests

-- ============================================
-- PART 1: Identify guest customers with role='customer' (this is CORRECT)
-- ============================================
SELECT 
  'GUEST CUSTOMERS WITH CUSTOMER ROLE' as check_type,
  u.id as user_id,
  u.email as user_email,
  u.role as user_role,
  u.full_name as user_full_name,
  c.id as customer_id,
  c.email as customer_email,
  c.name as customer_name,
  c.role as customer_role,
  '✅ Guest customer correctly has role=customer in users table' as status
FROM users u
INNER JOIN customers c ON c.email = u.email AND c.role = 'guest'
WHERE u.role = 'customer'
ORDER BY u.email;

-- ============================================
-- PART 2: Count guest customers with customer role (this is expected)
-- ============================================
SELECT 
  'GUEST CUSTOMERS COUNT' as check_type,
  COUNT(*) as guest_customers_with_customer_role
FROM users u
INNER JOIN customers c ON c.email = u.email AND c.role = 'guest'
WHERE u.role = 'customer';

-- ============================================
-- PART 3: Find users with role='customer' that are NOT in customers table
-- ============================================
SELECT 
  'USERS WITH CUSTOMER ROLE BUT NOT IN CUSTOMERS' as check_type,
  u.id as user_id,
  u.email as user_email,
  u.role as user_role,
  u.full_name as user_full_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM owners o WHERE o.id = u.id OR o.email = u.email) THEN '❌ Owner (should have role=owner)'
    ELSE '❌ Orphaned user (not in customers or owners)'
  END as status
FROM users u
WHERE u.role = 'customer'
  AND NOT EXISTS (
    SELECT 1 FROM customers c 
    WHERE (c.id = u.id OR c.auth_user_id = u.id OR c.email = u.email)
  )
  AND NOT EXISTS (
    SELECT 1 FROM owners o 
    WHERE o.id = u.id OR o.email = u.email
  )
ORDER BY u.email;

-- ============================================
-- PART 4: Fix owners with role='customer'
-- ============================================
-- UNCOMMENT TO EXECUTE:
/*
UPDATE users u
SET role = 'owner'
FROM owners o
WHERE (o.id = u.id OR o.email = u.email)
  AND u.role = 'customer';
*/

-- ============================================
-- PART 5: Fix orphaned users (not in customers or owners)
-- ============================================
-- UNCOMMENT TO EXECUTE:
/*
UPDATE users u
SET role = NULL
WHERE u.role = 'customer'
  AND NOT EXISTS (
    SELECT 1 FROM customers c 
    WHERE (c.id = u.id OR c.auth_user_id = u.id OR c.email = u.email)
  )
  AND NOT EXISTS (
    SELECT 1 FROM owners o 
    WHERE o.id = u.id OR o.email = u.email
  );
*/

-- ============================================
-- PART 6: VERIFICATION
-- ============================================
SELECT 
  'VERIFICATION' as check_type,
  (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_users_with_customer_role,
  (SELECT COUNT(*) FROM customers WHERE role = 'web') as web_customers,
  (SELECT COUNT(*) FROM customers WHERE role = 'line') as line_customers,
  (SELECT COUNT(*) FROM customers WHERE role = 'guest') as guest_customers,
  (SELECT COUNT(*) FROM users u
   INNER JOIN customers c ON c.email = u.email AND c.role = 'guest'
   WHERE u.role = 'customer') as guest_customers_with_customer_role,
  (SELECT COUNT(*) FROM users WHERE role = 'owner') as users_with_owner_role,
  (SELECT COUNT(*) FROM owners) as total_owners;

