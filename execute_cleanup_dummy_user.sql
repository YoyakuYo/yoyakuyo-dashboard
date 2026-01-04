-- Execute Cleanup for Dummy User
-- This script removes the dummy/test user and fixes role issues

-- ============================================
-- PART 1: Identify the dummy user to remove
-- ============================================
SELECT 
  'DUMMY USER TO REMOVE' as check_type,
  c.id as customer_id,
  u.id as user_id,
  u.email as user_email,
  c.role as customer_role,
  u.role as user_role,
  COUNT(b.id) as booking_count,
  COUNT(DISTINCT conv.id) as conversation_count
FROM customers c
INNER JOIN users u ON u.id = c.id OR u.id = c.auth_user_id
LEFT JOIN bookings b ON b.customer_id = c.id
LEFT JOIN conversations conv ON conv.customer_ref = c.id::text OR conv.customer_ref = u.id::text
WHERE c.role = 'web'
  AND (u.email LIKE '%@user.local' OR u.email LIKE 'web_%' OR u.email LIKE 'line_%')
GROUP BY c.id, u.id, u.email, c.role, u.role;

-- ============================================
-- PART 2: Delete bookings from dummy user
-- ============================================
-- UNCOMMENT TO EXECUTE:
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

-- ============================================
-- PART 3: Delete messages from dummy user conversations
-- ============================================
-- UNCOMMENT TO EXECUTE:
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
*/

-- ============================================
-- PART 4: Delete conversations from dummy user
-- ============================================
-- UNCOMMENT TO EXECUTE:
/*
DELETE FROM conversations
WHERE customer_ref IN (
  SELECT c.id::text
  FROM customers c
  INNER JOIN users u ON u.id = c.id OR u.id = c.auth_user_id
  WHERE c.role = 'web'
    AND (u.email LIKE '%@user.local' OR u.email LIKE 'web_%' OR u.email LIKE 'line_%')
);
*/

-- ============================================
-- PART 5: Delete customer record for dummy user
-- ============================================
-- UNCOMMENT TO EXECUTE:
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

-- ============================================
-- PART 6: Delete user record for dummy user (if not used elsewhere)
-- ============================================
-- UNCOMMENT TO EXECUTE:
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
-- PART 7: Fix guest customers with role='customer' in users table
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
-- PART 8: Fix orphaned users (not in customers or owners)
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
-- PART 9: VERIFICATION AFTER CLEANUP
-- ============================================
SELECT 
  'VERIFICATION AFTER CLEANUP' as check_type,
  (SELECT COUNT(*) FROM customers WHERE role = 'web') as web_customers_remaining,
  (SELECT COUNT(*) FROM users WHERE role = 'customer') as users_with_customer_role,
  (SELECT COUNT(*) FROM users WHERE email LIKE '%@user.local') as dummy_users_remaining,
  (SELECT COUNT(*) FROM users WHERE email LIKE 'web_%' OR email LIKE 'line_%') as suspicious_users_remaining,
  (SELECT COUNT(*) FROM customers WHERE role = 'line') as line_customers,
  (SELECT COUNT(*) FROM customers WHERE role = 'guest') as guest_customers,
  (SELECT COUNT(*) FROM users WHERE role = 'owner') as users_with_owner_role;

