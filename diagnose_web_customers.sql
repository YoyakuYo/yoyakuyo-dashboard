-- ============================================
-- DIAGNOSE WHY THERE ARE 2 WEB CUSTOMERS
-- ============================================
-- Find all customers that match WEB criteria
-- ============================================

-- PART 1: All customers with auth.users entry (potential WEB customers)
SELECT 
  'All customers with auth.users' as check_type,
  c.id as customer_id,
  c.role,
  c.created_at as customer_created_at,
  au.id as auth_user_id,
  au.email as auth_email,
  au.created_at as auth_created_at,
  EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) as has_line_account,
  (SELECT line_user_id FROM line_accounts la WHERE la.customer_id = c.id LIMIT 1) as line_user_id,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as booking_count,
  CASE 
    WHEN au.email LIKE '%@line.user' THEN 'LINE placeholder email'
    WHEN EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) THEN 'Has LINE account (should be LINE)'
    ELSE 'Potential WEB customer'
  END as classification
FROM customers c
INNER JOIN auth.users au ON au.id = c.id
WHERE c.role = 'customer'
ORDER BY c.created_at DESC;

-- PART 2: Customers matching WEB criteria (what the count query finds)
SELECT 
  'WEB criteria match' as check_type,
  c.id as customer_id,
  c.role,
  c.created_at,
  au.email,
  EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) as has_line_account,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as booking_count,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id AND source = 'web') as web_bookings,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id AND source = 'line') as line_bookings
FROM customers c
INNER JOIN auth.users au ON au.id = c.id
WHERE 
  au.email NOT LIKE '%@line.user'
  AND NOT EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id)
  AND c.role = 'customer'
ORDER BY c.created_at DESC;

-- PART 3: Check if any customer has bookings with wrong source
SELECT 
  'Booking source check' as check_type,
  c.id as customer_id,
  au.email,
  b.id as booking_id,
  b.source as booking_source,
  b.created_at as booking_created_at
FROM customers c
INNER JOIN auth.users au ON au.id = c.id
INNER JOIN bookings b ON b.customer_id = c.id
WHERE 
  au.email NOT LIKE '%@line.user'
  AND NOT EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id)
  AND c.role = 'customer'
ORDER BY c.id, b.created_at DESC
LIMIT 20;

-- PART 4: Check for duplicate customer IDs or multiple auth.users entries
SELECT 
  'Duplicate check' as check_type,
  c.id as customer_id,
  COUNT(DISTINCT au.id) as auth_user_count,
  COUNT(DISTINCT la.customer_id) as line_account_count,
  STRING_AGG(DISTINCT au.email, ', ') as emails
FROM customers c
LEFT JOIN auth.users au ON au.id = c.id
LEFT JOIN line_accounts la ON la.customer_id = c.id
WHERE c.role = 'customer'
GROUP BY c.id
HAVING COUNT(DISTINCT au.id) > 1 OR COUNT(DISTINCT la.customer_id) > 1;

