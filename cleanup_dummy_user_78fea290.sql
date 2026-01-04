-- Cleanup Dummy User: 78fea290-ef9a-43c8-96d6-90460c04efe5
-- This script removes the specific dummy/test user and all associated data

-- ============================================
-- PART 1: Check what will be deleted
-- ============================================
SELECT 
  'DATA TO BE DELETED' as check_type,
  'bookings' as table_name,
  COUNT(*) as record_count
FROM bookings
WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'

UNION ALL

SELECT 
  'DATA TO BE DELETED' as check_type,
  'conversations' as table_name,
  COUNT(*) as record_count
FROM conversations
WHERE customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5'

UNION ALL

SELECT 
  'DATA TO BE DELETED' as check_type,
  'messages' as table_name,
  COUNT(*) as record_count
FROM messages
WHERE conversation_id IN (
  SELECT id FROM conversations
  WHERE customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5'
)

UNION ALL

SELECT 
  'DATA TO BE DELETED' as check_type,
  'customer' as table_name,
  COUNT(*) as record_count
FROM customers
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'

UNION ALL

SELECT 
  'DATA TO BE DELETED' as check_type,
  'user' as table_name,
  COUNT(*) as record_count
FROM users
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- ============================================
-- PART 2: Delete bookings
-- ============================================
DELETE FROM bookings
WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- ============================================
-- PART 3: Delete messages from conversations
-- ============================================
DELETE FROM messages
WHERE conversation_id IN (
  SELECT id FROM conversations
  WHERE customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5'
);

-- ============================================
-- PART 4: Delete conversations
-- ============================================
DELETE FROM conversations
WHERE customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- ============================================
-- PART 5: Delete customer record
-- ============================================
DELETE FROM customers
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- ============================================
-- PART 6: Delete user record (if not used elsewhere)
-- ============================================
DELETE FROM users
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  AND NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5' OR c.auth_user_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  )
  AND NOT EXISTS (
    SELECT 1 FROM owners o WHERE o.id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  );

-- ============================================
-- PART 7: VERIFICATION AFTER CLEANUP
-- ============================================
SELECT 
  'VERIFICATION AFTER CLEANUP' as check_type,
  (SELECT COUNT(*) FROM customers WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5') as customer_still_exists,
  (SELECT COUNT(*) FROM users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5') as user_still_exists,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5') as bookings_remaining,
  (SELECT COUNT(*) FROM conversations WHERE customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5') as conversations_remaining,
  (SELECT COUNT(*) FROM customers WHERE role = 'web') as total_web_customers,
  (SELECT COUNT(*) FROM users WHERE email LIKE '%@user.local') as dummy_users_remaining;

