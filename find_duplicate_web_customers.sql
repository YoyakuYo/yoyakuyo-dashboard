-- Find Duplicate Web Customers
-- This script identifies duplicate or incorrectly created web customer records

-- ============================================
-- PART 1: List all web customers with details
-- ============================================
SELECT 
  'ALL WEB CUSTOMERS' as check_type,
  c.id as customer_id,
  c.email as customer_email,
  c.name as customer_name,
  c.role,
  c.auth_user_id,
  c.line_user_id,
  c.created_at,
  u.id as user_id,
  u.email as user_email,
  u.role as user_role,
  u.full_name as user_full_name,
  CASE 
    WHEN c.auth_user_id IS NULL THEN '❌ Missing auth_user_id'
    WHEN c.auth_user_id != c.id AND c.auth_user_id != u.id THEN '⚠️ auth_user_id mismatch'
    WHEN u.id IS NULL THEN '❌ No user record'
    WHEN u.role != 'customer' THEN '⚠️ User role is ' || COALESCE(u.role::text, 'NULL')
    WHEN c.line_user_id IS NOT NULL THEN '❌ Web customer has line_user_id (should be NULL)'
    WHEN c.email IS NOT NULL AND c.email LIKE '%@line.user' THEN '❌ Web customer has LINE email pattern'
    ELSE '✅ Looks correct'
  END as status
FROM customers c
LEFT JOIN users u ON u.id = c.id OR u.id = c.auth_user_id OR u.email = c.email
WHERE c.role = 'web'
ORDER BY c.created_at DESC;

-- ============================================
-- PART 2: Find duplicate web customers by email
-- ============================================
SELECT 
  'DUPLICATE WEB CUSTOMERS BY EMAIL' as check_type,
  c.email,
  COUNT(*) as duplicate_count,
  STRING_AGG(c.id::text, ', ') as customer_ids,
  STRING_AGG(COALESCE(c.name, 'NULL'), ', ') as names,
  STRING_AGG(COALESCE(c.auth_user_id::text, 'NULL'), ', ') as auth_user_ids
FROM customers c
WHERE c.role = 'web' AND c.email IS NOT NULL
GROUP BY c.email
HAVING COUNT(*) > 1;

-- ============================================
-- PART 3: Find duplicate web customers by auth_user_id
-- ============================================
SELECT 
  'DUPLICATE WEB CUSTOMERS BY AUTH_USER_ID' as check_type,
  c.auth_user_id,
  COUNT(*) as duplicate_count,
  STRING_AGG(c.id::text, ', ') as customer_ids,
  STRING_AGG(COALESCE(c.email, 'NULL'), ', ') as emails,
  STRING_AGG(COALESCE(c.name, 'NULL'), ', ') as names
FROM customers c
WHERE c.role = 'web' AND c.auth_user_id IS NOT NULL
GROUP BY c.auth_user_id
HAVING COUNT(*) > 1;

-- ============================================
-- PART 4: Find web customers that might be misclassified LINE customers
-- ============================================
SELECT 
  'MISCLASSIFIED LINE CUSTOMERS' as check_type,
  c.id as customer_id,
  c.email,
  c.name,
  c.role,
  c.auth_user_id,
  c.line_user_id,
  cp.id as profile_id,
  cp.line_user_id as profile_line_user_id,
  cp.line_display_name,
  CASE 
    WHEN cp.id IS NOT NULL AND c.role = 'web' THEN '❌ Has customer_profiles but role is web (should be line)'
    WHEN c.email LIKE '%@line.user' AND c.role = 'web' THEN '❌ Has LINE email pattern but role is web'
    WHEN c.line_user_id IS NOT NULL AND c.role = 'web' THEN '❌ Has line_user_id but role is web'
    ELSE '✅ Not misclassified'
  END as status
FROM customers c
LEFT JOIN customer_profiles cp ON cp.line_user_id = c.line_user_id OR cp.customer_auth_id = c.id
WHERE c.role = 'web'
  AND (
    cp.id IS NOT NULL 
    OR c.email LIKE '%@line.user'
    OR c.line_user_id IS NOT NULL
  );

-- ============================================
-- PART 5: Find web customers with same ID as user but different auth_user_id
-- ============================================
SELECT 
  'WEB CUSTOMERS WITH ID MISMATCH' as check_type,
  c.id as customer_id,
  c.email as customer_email,
  c.auth_user_id,
  u.id as user_id,
  u.email as user_email,
  CASE 
    WHEN c.id = u.id AND c.auth_user_id != u.id THEN '❌ Customer id matches user id but auth_user_id is different'
    WHEN c.id != u.id AND c.auth_user_id = u.id THEN '⚠️ Customer id different from user id but auth_user_id matches'
    ELSE '✅ ID relationship looks correct'
  END as status
FROM customers c
INNER JOIN users u ON u.id = c.id OR u.id = c.auth_user_id OR u.email = c.email
WHERE c.role = 'web';

