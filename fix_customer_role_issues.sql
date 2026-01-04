-- Fix Customer Role Issues
-- This script fixes users with incorrect role='customer' assignments

-- ============================================
-- PART 1: Identify users with incorrect role='customer'
-- ============================================
SELECT 
  'USERS WITH INCORRECT CUSTOMER ROLE' as check_type,
  u.id,
  u.email,
  u.role,
  u.full_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM customers c WHERE c.email = u.email AND c.role = 'guest') THEN '❌ Guest customer (should NOT have role=customer)'
    WHEN EXISTS (SELECT 1 FROM owners o WHERE o.id = u.id OR o.email = u.email) THEN '❌ Owner (should have role=owner)'
    WHEN NOT EXISTS (
      SELECT 1 FROM customers c 
      WHERE (c.id = u.id OR c.auth_user_id = u.id OR c.email = u.email) 
      AND c.role IN ('web', 'line')
    ) AND NOT EXISTS (SELECT 1 FROM owners o WHERE o.id = u.id OR o.email = u.email) THEN '❌ Orphaned user (not in customers or owners)'
    WHEN EXISTS (SELECT 1 FROM customers c WHERE c.id = u.id AND c.role = 'web') THEN '✅ Valid web customer'
    WHEN EXISTS (SELECT 1 FROM customers c WHERE c.auth_user_id = u.id AND c.role = 'web') THEN '✅ Valid web customer (via auth_user_id)'
    WHEN EXISTS (SELECT 1 FROM customers c WHERE c.id = u.id AND c.role = 'line') THEN '✅ Valid LINE customer'
    ELSE '⚠️ Unknown status'
  END as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM customers c WHERE c.email = u.email AND c.role = 'guest') THEN 'SET role = NULL'
    WHEN EXISTS (SELECT 1 FROM owners o WHERE o.id = u.id OR o.email = u.email) THEN 'SET role = ''owner'''
    WHEN NOT EXISTS (
      SELECT 1 FROM customers c 
      WHERE (c.id = u.id OR c.auth_user_id = u.id OR c.email = u.email) 
      AND c.role IN ('web', 'line')
    ) AND NOT EXISTS (SELECT 1 FROM owners o WHERE o.id = u.id OR o.email = u.email) THEN 'SET role = NULL'
    ELSE 'KEEP role = ''customer'''
  END as recommended_action
FROM users u
WHERE u.role = 'customer'
ORDER BY u.email;

-- ============================================
-- PART 2: Fix guest customers with role='customer'
-- ============================================
-- UNCOMMENT TO EXECUTE:
/*
UPDATE users u
SET role = NULL
FROM customers c
WHERE c.email = u.email 
  AND c.role = 'guest'
  AND u.role = 'customer';
*/

-- ============================================
-- PART 3: Fix owners with role='customer'
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
-- PART 4: Fix orphaned users (not in customers or owners)
-- ============================================
-- UNCOMMENT TO EXECUTE:
/*
UPDATE users u
SET role = NULL
WHERE u.role = 'customer'
  AND NOT EXISTS (
    SELECT 1 FROM customers c 
    WHERE (c.id = u.id OR c.auth_user_id = u.id OR c.email = u.email) 
    AND c.role IN ('web', 'line')
  )
  AND NOT EXISTS (
    SELECT 1 FROM owners o 
    WHERE o.id = u.id OR o.email = u.email
  );
*/

-- ============================================
-- PART 5: VERIFICATION AFTER FIXES
-- ============================================
SELECT 
  'VERIFICATION AFTER FIXES' as check_type,
  (SELECT COUNT(*) FROM users WHERE role = 'customer') as users_with_customer_role,
  (SELECT COUNT(*) FROM users WHERE role = 'owner') as users_with_owner_role,
  (SELECT COUNT(*) FROM users WHERE role IS NULL) as users_without_role,
  (SELECT COUNT(*) FROM customers WHERE role = 'web') as web_customers,
  (SELECT COUNT(*) FROM customers WHERE role = 'line') as line_customers,
  (SELECT COUNT(*) FROM customers WHERE role = 'guest') as guest_customers,
  (SELECT COUNT(*) FROM owners) as total_owners;

