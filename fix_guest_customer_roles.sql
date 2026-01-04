-- Fix Guest Customer Roles
-- Guest customers should NOT have role='customer' in users table
-- They should have role=NULL since they're not authenticated users

-- ============================================
-- PART 1: Identify guest customers with incorrect role='customer'
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
  '❌ Guest customer should NOT have role=customer in users table' as status
FROM users u
INNER JOIN customers c ON c.email = u.email AND c.role = 'guest'
WHERE u.role = 'customer'
ORDER BY u.email;

-- ============================================
-- PART 2: Count how many will be fixed
-- ============================================
SELECT 
  'COUNT TO BE FIXED' as check_type,
  COUNT(*) as guest_customers_with_customer_role
FROM users u
INNER JOIN customers c ON c.email = u.email AND c.role = 'guest'
WHERE u.role = 'customer';

-- ============================================
-- PART 3: Fix guest customers - Set role=NULL
-- ============================================
UPDATE users u
SET role = NULL
FROM customers c
WHERE c.email = u.email 
  AND c.role = 'guest'
  AND u.role = 'customer';

-- ============================================
-- PART 4: VERIFICATION AFTER FIX
-- ============================================
SELECT 
  'VERIFICATION AFTER FIX' as check_type,
  (SELECT COUNT(*) FROM users u
   INNER JOIN customers c ON c.email = u.email AND c.role = 'guest'
   WHERE u.role = 'customer') as guest_customers_still_with_customer_role,
  (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_users_with_customer_role,
  (SELECT COUNT(*) FROM customers WHERE role = 'web') as web_customers,
  (SELECT COUNT(*) FROM customers WHERE role = 'line') as line_customers,
  (SELECT COUNT(*) FROM customers WHERE role = 'guest') as guest_customers,
  (SELECT COUNT(*) FROM users WHERE role IS NULL) as users_without_role;

