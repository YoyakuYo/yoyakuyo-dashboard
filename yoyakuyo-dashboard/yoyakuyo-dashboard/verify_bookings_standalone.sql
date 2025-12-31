-- ============================================
-- STANDALONE VERIFICATION QUERIES
-- ============================================
-- Use these queries if the verification view doesn't exist yet
-- ============================================

-- Query 1: Inspect booking-customer links (replaces the view)
SELECT 
  b.id as booking_id,
  b.customer_id,
  b.source,
  b.status,
  b.created_at as booking_created_at,
  c.role as customer_role,
  c.created_at as customer_created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) THEN 'LINE'
    WHEN c.role = 'customer' AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id) THEN 'WEB'
    WHEN c.role = 'guest' THEN 'GUEST'
    ELSE 'UNKNOWN'
  END as customer_type,
  la.line_user_id,
  au.email as web_customer_email
FROM bookings b
JOIN customers c ON c.id = b.customer_id
LEFT JOIN line_accounts la ON la.customer_id = c.id
LEFT JOIN auth.users au ON au.id = c.id
ORDER BY b.created_at DESC
LIMIT 50;

-- Query 2: Count bookings by customer type
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) THEN 'LINE'
    WHEN c.role = 'customer' AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id) THEN 'WEB'
    WHEN c.role = 'guest' THEN 'GUEST'
    ELSE 'UNKNOWN'
  END as customer_type,
  COUNT(*) as count
FROM bookings b
JOIN customers c ON c.id = b.customer_id
LEFT JOIN line_accounts la ON la.customer_id = c.id
LEFT JOIN auth.users au ON au.id = c.id
GROUP BY customer_type
ORDER BY count DESC;

-- Query 3: Check for NULL customer_id
SELECT 
  'Bookings with NULL customer_id' as check_name,
  COUNT(*) as count
FROM bookings
WHERE customer_id IS NULL;

-- Query 4: Check for invalid customer_id references
SELECT 
  'Bookings with invalid customer_id' as check_name,
  COUNT(*) as count
FROM bookings b
WHERE b.customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = b.customer_id
  );

-- Query 5: Sample of recent bookings with customer info
SELECT 
  b.id,
  b.customer_id,
  b.source,
  b.status,
  c.role,
  CASE 
    WHEN EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) THEN 'LINE'
    WHEN c.role = 'customer' THEN 'WEB'
    WHEN c.role = 'guest' THEN 'GUEST'
    ELSE 'UNKNOWN'
  END as customer_type
FROM bookings b
JOIN customers c ON c.id = b.customer_id
ORDER BY b.created_at DESC
LIMIT 10;

