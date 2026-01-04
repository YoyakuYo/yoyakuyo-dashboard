-- Identify and Cleanup Dummy/Test Users
-- This script identifies suspicious users that should be removed

-- ============================================
-- PART 1: Identify suspicious web customers
-- ============================================
SELECT 
  'SUSPICIOUS WEB CUSTOMERS' as check_type,
  c.id as customer_id,
  c.email as customer_email,
  c.name as customer_name,
  c.role,
  c.auth_user_id,
  c.created_at,
  u.id as user_id,
  u.email as user_email,
  u.full_name as user_full_name,
  u.role as user_role,
  CASE 
    WHEN u.email LIKE '%@user.local' THEN '❌ Dummy/test user (email pattern: @user.local)'
    WHEN u.email LIKE 'web_%' THEN '❌ Suspicious email pattern (web_ prefix)'
    WHEN u.email LIKE 'line_%' THEN '❌ Suspicious email pattern (line_ prefix)'
    WHEN c.email IS NULL AND u.email IS NULL THEN '❌ No email in either table'
    WHEN u.email IS NULL THEN '⚠️ No email in users table'
    ELSE '✅ Looks legitimate'
  END as status,
  CASE 
    WHEN u.email LIKE '%@user.local' THEN 'DELETE (dummy/test user)'
    WHEN u.email LIKE 'web_%' OR u.email LIKE 'line_%' THEN 'REVIEW (suspicious pattern)'
    ELSE 'KEEP'
  END as recommended_action
FROM customers c
LEFT JOIN users u ON u.id = c.id OR u.id = c.auth_user_id OR u.email = c.email
WHERE c.role = 'web'
ORDER BY c.created_at DESC;

-- ============================================
-- PART 2: Check for bookings associated with suspicious users
-- ============================================
SELECT 
  'BOOKINGS FOR SUSPICIOUS USERS' as check_type,
  c.id as customer_id,
  u.email as user_email,
  COUNT(b.id) as booking_count,
  STRING_AGG(b.id::text, ', ') as booking_ids,
  MIN(b.created_at) as first_booking,
  MAX(b.created_at) as last_booking
FROM customers c
INNER JOIN users u ON u.id = c.id OR u.id = c.auth_user_id
LEFT JOIN bookings b ON b.customer_id = c.id
WHERE c.role = 'web'
  AND (u.email LIKE '%@user.local' OR u.email LIKE 'web_%' OR u.email LIKE 'line_%')
GROUP BY c.id, u.email
ORDER BY booking_count DESC;

-- ============================================
-- PART 3: Check for conversations/messages from suspicious users
-- ============================================
SELECT 
  'MESSAGES FROM SUSPICIOUS USERS' as check_type,
  c.id as customer_id,
  u.email as user_email,
  COUNT(DISTINCT conv.id) as conversation_count,
  COUNT(DISTINCT msg.id) as message_count
FROM customers c
INNER JOIN users u ON u.id = c.id OR u.id = c.auth_user_id
LEFT JOIN conversations conv ON conv.customer_ref = c.id::text OR conv.customer_ref = u.id::text
LEFT JOIN messages msg ON msg.conversation_id = conv.id
WHERE c.role = 'web'
  AND (u.email LIKE '%@user.local' OR u.email LIKE 'web_%' OR u.email LIKE 'line_%')
GROUP BY c.id, u.email;

-- ============================================
-- PART 4: Detailed view of the specific suspicious user
-- ============================================
SELECT 
  'DETAILED VIEW: 78fea290-ef9a-43c8-96d6-90460c04efe5' as check_type,
  'customer' as table_name,
  c.id::text as id,
  COALESCE(c.email, '')::text as email,
  COALESCE(c.name, '')::text as name,
  c.role::text as role,
  COALESCE(c.auth_user_id::text, '')::text as auth_user_id,
  COALESCE(c.line_user_id, '')::text as line_user_id,
  c.created_at::text as created_at
FROM customers c
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5'

UNION ALL

SELECT 
  'DETAILED VIEW: 78fea290-ef9a-43c8-96d6-90460c04efe5' as check_type,
  'users' as table_name,
  u.id::text as id,
  COALESCE(u.email, '')::text as email,
  COALESCE(u.full_name, '')::text as name,
  COALESCE(u.role::text, '')::text as role,
  ''::text as auth_user_id,
  ''::text as line_user_id,
  u.created_at::text as created_at
FROM users u
WHERE u.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- ============================================
-- PART 5: FIX SCRIPT - Remove dummy/test users
-- ============================================
-- UNCOMMENT TO EXECUTE:

-- Step 1: Delete bookings from suspicious users (if any)
/*
DELETE FROM bookings
WHERE customer_id IN (
  SELECT c.id
  FROM customers c
  INNER JOIN users u ON u.id = c.id OR u.id = c.auth_user_id
  WHERE c.role = 'web'
    AND (u.email LIKE '%@user.local' OR u.email LIKE 'web_%' OR u.email LIKE 'line_%')
);
*/

-- Step 2: Delete messages/conversations from suspicious users (if any)
/*
DELETE FROM messages
WHERE conversation_id IN (
  SELECT id FROM conversations
  WHERE customer_ref IN (
    SELECT c.id::text
    FROM customers c
    INNER JOIN users u ON u.id = c.id OR u.id = c.auth_user_id
    WHERE c.role = 'web'
      AND (u.email LIKE '%@user.local' OR u.email LIKE 'web_%' OR u.email LIKE 'line_%')
  )
);

DELETE FROM conversations
WHERE customer_ref IN (
  SELECT c.id::text
  FROM customers c
  INNER JOIN users u ON u.id = c.id OR u.id = c.auth_user_id
  WHERE c.role = 'web'
    AND (u.email LIKE '%@user.local' OR u.email LIKE 'web_%' OR u.email LIKE 'line_%')
);
*/

-- Step 3: Delete customer records
/*
DELETE FROM customers
WHERE id IN (
  SELECT c.id
  FROM customers c
  INNER JOIN users u ON u.id = c.id OR u.id = c.auth_user_id
  WHERE c.role = 'web'
    AND (u.email LIKE '%@user.local' OR u.email LIKE 'web_%' OR u.email LIKE 'line_%')
);
*/

-- Step 4: Delete user records (if not used elsewhere)
/*
DELETE FROM users
WHERE id IN (
  SELECT u.id
  FROM users u
  WHERE u.email LIKE '%@user.local' 
     OR u.email LIKE 'web_%'
     OR u.email LIKE 'line_%'
)
AND NOT EXISTS (
  SELECT 1 FROM customers c WHERE c.id = users.id OR c.auth_user_id = users.id
)
AND NOT EXISTS (
  SELECT 1 FROM owners o WHERE o.id = users.id
);
*/

-- ============================================
-- PART 6: VERIFICATION AFTER CLEANUP
-- ============================================
-- Run this after cleanup:
SELECT 
  'VERIFICATION AFTER CLEANUP' as check_type,
  (SELECT COUNT(*) FROM customers WHERE role = 'web') as web_customers_remaining,
  (SELECT COUNT(*) FROM users WHERE role = 'customer') as users_with_customer_role,
  (SELECT COUNT(*) FROM users WHERE email LIKE '%@user.local') as dummy_users_remaining,
  (SELECT COUNT(*) FROM users WHERE email LIKE 'web_%' OR email LIKE 'line_%') as suspicious_users_remaining;

