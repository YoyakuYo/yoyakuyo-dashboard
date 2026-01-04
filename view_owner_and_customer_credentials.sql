-- View Owner and Customer Credentials
-- This script displays all owner and customer credentials with their associated data

-- ============================================
-- PART 1: Owner Credentials
-- ============================================
SELECT 
  'OWNER CREDENTIALS' as check_type,
  o.id as owner_id,
  o.email as owner_email,
  o.name as owner_name,
  o.created_at as owner_created_at,
  u.id as user_id,
  u.email as user_email,
  u.full_name as user_full_name,
  u.role as user_role,
  u.created_at as user_created_at,
  CASE 
    WHEN u.id IS NULL THEN '❌ No user record'
    WHEN u.role != 'owner' THEN '⚠️ User role is ' || COALESCE(u.role::text, 'NULL') || ' (should be owner)'
    WHEN u.email != o.email THEN '⚠️ Email mismatch'
    ELSE '✅ Correctly configured'
  END as status
FROM owners o
LEFT JOIN users u ON u.id = o.id OR u.email = o.email
ORDER BY o.created_at DESC;

-- ============================================
-- PART 2: Web Customer Credentials
-- ============================================
SELECT 
  'WEB CUSTOMER CREDENTIALS' as check_type,
  c.id as customer_id,
  c.email as customer_email,
  c.name as customer_name,
  c.role as customer_role,
  c.auth_user_id,
  c.created_at as customer_created_at,
  u.id as user_id,
  u.email as user_email,
  u.full_name as user_full_name,
  u.role as user_role,
  u.created_at as user_created_at,
  CASE 
    WHEN u.id IS NULL THEN '❌ No user record'
    WHEN u.role != 'customer' THEN '⚠️ User role is ' || COALESCE(u.role::text, 'NULL') || ' (should be customer)'
    WHEN c.auth_user_id IS NULL THEN '❌ Missing auth_user_id'
    WHEN c.auth_user_id != u.id THEN '⚠️ auth_user_id mismatch'
    ELSE '✅ Correctly configured'
  END as status
FROM customers c
LEFT JOIN users u ON u.id = c.id OR u.id = c.auth_user_id OR u.email = c.email
WHERE c.role = 'web'
ORDER BY c.created_at DESC;

-- ============================================
-- PART 3: LINE Customer Credentials
-- ============================================
SELECT 
  'LINE CUSTOMER CREDENTIALS' as check_type,
  c.id as customer_id,
  c.email as customer_email,
  c.name as customer_name,
  c.role as customer_role,
  c.line_user_id,
  c.created_at as customer_created_at,
  cp.id as profile_id,
  cp.line_display_name,
  cp.email as profile_email,
  cp.full_name as profile_full_name,
  cp.created_at as profile_created_at,
  CASE 
    WHEN c.line_user_id IS NULL THEN '❌ Missing line_user_id'
    WHEN cp.id IS NULL THEN '⚠️ No customer_profiles record'
    ELSE '✅ Correctly configured'
  END as status
FROM customers c
LEFT JOIN customer_profiles cp ON cp.line_user_id = c.line_user_id
WHERE c.role = 'line'
ORDER BY c.created_at DESC;

-- ============================================
-- PART 4: Guest Customer Credentials
-- ============================================
SELECT 
  'GUEST CUSTOMER CREDENTIALS' as check_type,
  c.id as customer_id,
  c.email as customer_email,
  c.name as customer_name,
  c.role as customer_role,
  c.auth_user_id,
  c.line_user_id,
  c.created_at as customer_created_at,
  CASE 
    WHEN c.email IS NULL THEN '❌ Missing email'
    WHEN c.auth_user_id IS NOT NULL THEN '❌ Should not have auth_user_id'
    WHEN c.line_user_id IS NOT NULL THEN '❌ Should not have line_user_id'
    ELSE '✅ Correctly configured'
  END as status
FROM customers c
WHERE c.role = 'guest'
ORDER BY c.created_at DESC
LIMIT 20; -- Limit to first 20 guest customers

-- ============================================
-- PART 5: Summary Counts
-- ============================================
SELECT 
  'SUMMARY' as check_type,
  (SELECT COUNT(*) FROM owners) as total_owners,
  (SELECT COUNT(*) FROM customers WHERE role = 'web') as total_web_customers,
  (SELECT COUNT(*) FROM customers WHERE role = 'line') as total_line_customers,
  (SELECT COUNT(*) FROM customers WHERE role = 'guest') as total_guest_customers,
  (SELECT COUNT(*) FROM users WHERE role = 'owner') as users_with_owner_role,
  (SELECT COUNT(*) FROM users WHERE role = 'customer') as users_with_customer_role,
  (SELECT COUNT(*) FROM customer_profiles) as total_customer_profiles;

