-- ============================================
-- CHECK WEB CUSTOMER COUNT
-- ============================================
-- Simple query to verify how many WEB customers exist
-- ============================================

-- PART 1: Count WEB customers
SELECT 
  'WEB Customer Count' as check_type,
  COUNT(*) as count
FROM customers c
INNER JOIN auth.users au ON au.id = c.id
WHERE 
  au.email NOT LIKE '%@line.user'
  AND NOT EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id)
  AND c.role = 'customer'
  AND c.role != 'owner';

-- PART 2: List all WEB customers with details
SELECT 
  'WEB Customer Details' as check_type,
  c.id as customer_id,
  c.role,
  c.created_at,
  au.email,
  au.created_at as auth_created_at,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id AND source = 'web') as web_bookings,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id AND source = 'line') as line_bookings
FROM customers c
INNER JOIN auth.users au ON au.id = c.id
WHERE 
  au.email NOT LIKE '%@line.user'
  AND NOT EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id)
  AND c.role = 'customer'
  AND c.role != 'owner'
ORDER BY c.created_at DESC;

-- PART 3: Double-check - show all customers with auth.users (for debugging)
SELECT 
  'All customers with auth.users (for debugging)' as check_type,
  c.id as customer_id,
  c.role,
  au.email,
  EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) as has_line_account,
  CASE 
    WHEN au.email LIKE '%@line.user' THEN 'LINE placeholder email'
    WHEN EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) THEN 'Has LINE account'
    WHEN c.role = 'owner' THEN 'OWNER (excluded)'
    WHEN c.role = 'customer' THEN 'WEB customer'
    ELSE 'Other'
  END as classification
FROM customers c
INNER JOIN auth.users au ON au.id = c.id
WHERE c.role IN ('customer', 'owner')
ORDER BY c.role, c.created_at DESC;

