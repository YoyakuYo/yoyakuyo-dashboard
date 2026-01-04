-- Diagnose and Fix User Roles
-- This script identifies and fixes role mismatches in the users table

-- ============================================
-- PART 1: Identify all users with role='customer'
-- ============================================
SELECT 
  'USERS WITH CUSTOMER ROLE' as check_type,
  u.id,
  u.email,
  u.role,
  u.full_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM customers c WHERE c.id = u.id AND c.role = 'web') THEN '✅ Web customer'
    WHEN EXISTS (SELECT 1 FROM customers c WHERE c.id = u.id AND c.role = 'line') THEN '✅ LINE customer'
    WHEN EXISTS (SELECT 1 FROM customers c WHERE c.auth_user_id = u.id AND c.role = 'web') THEN '✅ Web customer (via auth_user_id)'
    WHEN EXISTS (SELECT 1 FROM customers c WHERE c.email = u.email AND c.role = 'web') THEN '✅ Web customer (via email)'
    WHEN EXISTS (SELECT 1 FROM customers c WHERE c.email = u.email AND c.role = 'line') THEN '✅ LINE customer (via email)'
    WHEN EXISTS (SELECT 1 FROM customers c WHERE c.email = u.email AND c.role = 'guest') THEN '❌ Guest customer (should NOT have role=customer)'
    WHEN EXISTS (SELECT 1 FROM owners o WHERE o.id = u.id OR o.email = u.email) THEN '❌ Owner (should have role=owner)'
    ELSE '❌ Orphaned user (no matching customer/owner)'
  END as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM customers c WHERE c.email = u.email AND c.role = 'guest') THEN 'SET role = NULL (guest customer)'
    WHEN EXISTS (SELECT 1 FROM owners o WHERE o.id = u.id OR o.email = u.email) THEN 'SET role = ''owner'' (owner account)'
    WHEN NOT EXISTS (
      SELECT 1 FROM customers c 
      WHERE (c.id = u.id OR c.auth_user_id = u.id OR c.email = u.email) 
      AND c.role IN ('web', 'line')
    ) AND NOT EXISTS (SELECT 1 FROM owners o WHERE o.id = u.id OR o.email = u.email) THEN 'SET role = NULL (orphaned)'
    ELSE 'KEEP role = ''customer'' (valid customer)'
  END as recommended_action
FROM users u
WHERE u.role = 'customer'
ORDER BY u.email;

-- ============================================
-- PART 2: Identify web customers
-- ============================================
SELECT 
  'WEB CUSTOMERS' as check_type,
  c.id as customer_id,
  c.email as customer_email,
  c.name as customer_name,
  c.role as customer_role,
  c.auth_user_id,
  u.id as user_id,
  u.email as user_email,
  u.role as user_role,
  CASE 
    WHEN u.id IS NULL THEN '❌ No user record'
    WHEN u.role != 'customer' THEN '⚠️ User role is ' || COALESCE(u.role::text, 'NULL') || ' (should be customer)'
    WHEN c.auth_user_id IS NULL OR c.auth_user_id != u.id THEN '⚠️ auth_user_id mismatch'
    ELSE '✅ Correctly configured'
  END as status
FROM customers c
LEFT JOIN users u ON u.id = c.id OR u.id = c.auth_user_id OR u.email = c.email
WHERE c.role = 'web'
ORDER BY c.email;

-- ============================================
-- PART 3: Identify LINE customers
-- ============================================
SELECT 
  'LINE CUSTOMERS' as check_type,
  c.id as customer_id,
  c.email as customer_email,
  c.name as customer_name,
  c.role as customer_role,
  c.line_user_id,
  cp.id as profile_id,
  cp.line_display_name,
  CASE 
    WHEN c.line_user_id IS NULL THEN '❌ Missing line_user_id'
    WHEN cp.id IS NULL THEN '⚠️ No customer_profiles record'
    ELSE '✅ Correctly configured'
  END as status
FROM customers c
LEFT JOIN customer_profiles cp ON cp.line_user_id = c.line_user_id
WHERE c.role = 'line'
ORDER BY c.email;

-- ============================================
-- PART 4: Identify guest customers with role='customer' in users table
-- ============================================
SELECT 
  'GUEST CUSTOMERS WITH CUSTOMER ROLE' as check_type,
  u.id,
  u.email,
  u.role,
  c.id as customer_id,
  c.role as customer_role,
  '❌ Guest customer should NOT have role=customer in users table' as status,
  'SET role = NULL' as recommended_action
FROM users u
INNER JOIN customers c ON c.email = u.email AND c.role = 'guest'
WHERE u.role = 'customer';

-- ============================================
-- PART 5: Identify owners with wrong role
-- ============================================
SELECT 
  'OWNERS WITH WRONG ROLE' as check_type,
  u.id,
  u.email,
  u.role as current_role,
  o.id as owner_id,
  o.email as owner_email,
  CASE 
    WHEN u.role != 'owner' THEN '❌ Should have role=owner'
    ELSE '✅ Correct role'
  END as status,
  CASE 
    WHEN u.role != 'owner' THEN 'SET role = ''owner'''
    ELSE 'KEEP role = ''owner'''
  END as recommended_action
FROM owners o
LEFT JOIN users u ON u.id = o.id OR u.email = o.email
WHERE u.id IS NOT NULL AND u.role != 'owner'
ORDER BY o.email;

-- ============================================
-- PART 6: Identify users with staff role
-- ============================================
SELECT 
  'USERS WITH STAFF ROLE' as check_type,
  u.id,
  u.email,
  u.role,
  u.full_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM owners o WHERE o.id = u.id OR o.email = u.email) THEN '❌ Staff role but is owner'
    WHEN EXISTS (SELECT 1 FROM customers c WHERE c.id = u.id OR c.auth_user_id = u.id) THEN '❌ Staff role but is customer'
    ELSE '⚠️ Staff role (verify if correct)'
  END as status
FROM users u
WHERE u.role = 'staff'
ORDER BY u.email;

-- ============================================
-- PART 7: FIX SCRIPT - Update roles based on findings
-- ============================================
-- UNCOMMENT THE FOLLOWING TO EXECUTE FIXES:

-- Fix 1: Set role=NULL for guest customers
/*
UPDATE users u
SET role = NULL
FROM customers c
WHERE c.email = u.email 
  AND c.role = 'guest'
  AND u.role = 'customer';
*/

-- Fix 2: Set role='owner' for owners
/*
UPDATE users u
SET role = 'owner'
FROM owners o
WHERE (o.id = u.id OR o.email = u.email)
  AND u.role != 'owner';
*/

-- Fix 3: Set role=NULL for orphaned users (not in customers or owners)
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
-- PART 8: VERIFICATION AFTER FIXES
-- ============================================
-- Run this after applying fixes to verify:
SELECT 
  'VERIFICATION AFTER FIXES' as check_type,
  (SELECT COUNT(*) FROM users WHERE role = 'owner') as users_with_owner_role,
  (SELECT COUNT(*) FROM owners) as owners_in_owners_table,
  (SELECT COUNT(*) FROM users WHERE role = 'customer') as users_with_customer_role,
  (SELECT COUNT(*) FROM customers WHERE role = 'web') as web_customers,
  (SELECT COUNT(*) FROM customers WHERE role = 'line') as line_customers,
  (SELECT COUNT(*) FROM customers WHERE role = 'guest') as guest_customers,
  (SELECT COUNT(*) FROM users WHERE role = 'super_admin') as users_with_super_admin_role,
  (SELECT COUNT(*) FROM users WHERE role = 'staff') as users_with_staff_role,
  (SELECT COUNT(*) FROM users WHERE role IS NULL) as users_without_role;

