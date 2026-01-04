-- Verify User Roles and Credentials
-- This script checks users across users, owners, customers tables
-- and verifies role consistency

-- ============================================
-- PART 1: Check users table (main auth table)
-- ============================================
SELECT 
  'USERS TABLE' as source,
  id,
  email,
  role,
  full_name,
  account_status,
  created_at
FROM users
ORDER BY role, email;

-- ============================================
-- PART 2: Check owners table
-- ============================================
SELECT 
  'OWNERS TABLE' as source,
  id,
  email,
  name as full_name,
  created_at
FROM owners
ORDER BY email;

-- ============================================
-- PART 3: Check customers table
-- ============================================
SELECT 
  'CUSTOMERS TABLE' as source,
  id,
  email,
  name,
  role,
  auth_user_id,
  line_user_id,
  created_at
FROM customers
ORDER BY role, email;

-- ============================================
-- PART 4: Cross-reference - Owners
-- ============================================
-- Check if owners exist in users table with correct role
SELECT 
  'OWNER VERIFICATION' as check_type,
  o.id as owner_id,
  o.email as owner_email,
  o.name as owner_name,
  u.id as user_id,
  u.role as user_role,
  u.email as user_email,
  CASE 
    WHEN u.id IS NULL THEN '❌ Owner NOT in users table'
    WHEN u.role != 'owner' THEN '❌ Owner in users table but role is ' || u.role
    WHEN u.email != o.email THEN '⚠️ Email mismatch'
    ELSE '✅ Owner correctly in users table with role=owner'
  END as status
FROM owners o
LEFT JOIN users u ON u.id = o.id OR u.email = o.email
ORDER BY o.email;

-- ============================================
-- PART 5: Cross-reference - Customers
-- ============================================
-- Check if customers exist in users table
SELECT 
  'CUSTOMER VERIFICATION' as check_type,
  c.id as customer_id,
  c.email as customer_email,
  c.name as customer_name,
  c.role as customer_role,
  c.auth_user_id,
  u.id as user_id,
  u.role as user_role,
  u.email as user_email,
  CASE 
    WHEN c.role = 'web' AND c.auth_user_id IS NOT NULL THEN
      CASE 
        WHEN u.id IS NULL THEN '❌ Web customer NOT in users table'
        WHEN u.role = 'owner' THEN '❌ Web customer has owner role in users table'
        WHEN u.role = 'admin' THEN '❌ Web customer has admin role in users table'
        WHEN u.role IS NULL OR u.role = 'customer' THEN '✅ Web customer correctly configured'
        ELSE '⚠️ Web customer has unexpected role: ' || u.role
      END
    WHEN c.role = 'line' THEN
      CASE 
        WHEN c.line_user_id IS NULL THEN '❌ LINE customer missing line_user_id'
        ELSE '✅ LINE customer configured'
      END
    WHEN c.role = 'guest' THEN
      CASE 
        WHEN c.email IS NULL THEN '❌ Guest customer missing email'
        WHEN c.auth_user_id IS NOT NULL THEN '❌ Guest customer should not have auth_user_id'
        WHEN c.line_user_id IS NOT NULL THEN '❌ Guest customer should not have line_user_id'
        ELSE '✅ Guest customer correctly configured'
      END
    ELSE '⚠️ Unknown customer role: ' || c.role
  END as status
FROM customers c
LEFT JOIN users u ON u.id = c.auth_user_id OR (c.role = 'web' AND u.id = c.id)
ORDER BY c.role, c.email;

-- ============================================
-- PART 6: Find users with conflicting roles
-- ============================================
-- Users who are in multiple role tables or have conflicting roles
SELECT 
  'ROLE CONFLICTS' as check_type,
  u.id,
  u.email,
  u.role as users_role,
  CASE WHEN o.id IS NOT NULL THEN 'YES' ELSE 'NO' END as in_owners_table,
  CASE WHEN c.id IS NOT NULL THEN c.role ELSE NULL END as in_customers_table_role,
  CASE 
    WHEN u.role = 'owner' AND o.id IS NULL THEN '❌ Has owner role but NOT in owners table'
    WHEN u.role = 'owner' AND c.id IS NOT NULL THEN '❌ Has owner role but ALSO in customers table'
    WHEN u.role = 'customer' AND o.id IS NOT NULL THEN '❌ Has customer role but ALSO in owners table'
    WHEN u.role = 'admin' AND o.id IS NOT NULL THEN '❌ Has admin role but ALSO in owners table'
    WHEN u.role = 'admin' AND c.id IS NOT NULL THEN '❌ Has admin role but ALSO in customers table'
    WHEN u.role IS NULL AND o.id IS NOT NULL THEN '⚠️ In owners table but no role in users table'
    WHEN u.role IS NULL AND c.id IS NOT NULL THEN '⚠️ In customers table but no role in users table'
    ELSE '✅ No conflicts'
  END as status
FROM users u
LEFT JOIN owners o ON o.id = u.id OR o.email = u.email
LEFT JOIN customers c ON c.id = u.id OR (c.auth_user_id = u.id AND c.role = 'web') OR c.email = u.email
WHERE 
  (u.role = 'owner' AND o.id IS NULL) OR
  (u.role = 'owner' AND c.id IS NOT NULL) OR
  (u.role = 'customer' AND o.id IS NOT NULL) OR
  (u.role = 'admin' AND o.id IS NOT NULL) OR
  (u.role = 'admin' AND c.id IS NOT NULL) OR
  (u.role IS NULL AND (o.id IS NOT NULL OR c.id IS NOT NULL))
ORDER BY u.email;

-- ============================================
-- PART 7: Summary Statistics
-- ============================================
SELECT 
  'SUMMARY' as report_type,
  (SELECT COUNT(*) FROM users WHERE role = 'owner') as users_with_owner_role,
  (SELECT COUNT(*) FROM owners) as owners_in_owners_table,
  (SELECT COUNT(*) FROM users WHERE role = 'customer') as users_with_customer_role,
  (SELECT COUNT(*) FROM customers WHERE role = 'web') as web_customers,
  (SELECT COUNT(*) FROM customers WHERE role = 'line') as line_customers,
  (SELECT COUNT(*) FROM customers WHERE role = 'guest') as guest_customers,
  (SELECT COUNT(*) FROM users WHERE role = 'admin') as users_with_admin_role,
  (SELECT COUNT(*) FROM users WHERE role IS NULL) as users_without_role;

