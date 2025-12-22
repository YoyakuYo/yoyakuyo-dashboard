-- ============================================
-- CHECK FOR DUPLICATE CUSTOMERS BY EMAIL
-- ============================================
-- Find if the same email has multiple customer records
-- ============================================

-- PART 1: Find emails with multiple customer records
SELECT 
  'Emails with multiple customers' as check_type,
  au.email,
  COUNT(DISTINCT c.id) as customer_count,
  STRING_AGG(DISTINCT c.id::text, ', ') as customer_ids,
  STRING_AGG(DISTINCT c.role, ', ') as roles,
  STRING_AGG(DISTINCT c.created_at::text, ', ') as created_dates
FROM auth.users au
INNER JOIN customers c ON c.id = au.id
WHERE au.email NOT LIKE '%@line.user'
GROUP BY au.email
HAVING COUNT(DISTINCT c.id) > 1;

-- PART 2: Show all customer records for a specific email (if duplicates found)
-- Replace 'YOUR_EMAIL@example.com' with the actual email
SELECT 
  'All customer records for email' as check_type,
  au.email,
  c.id as customer_id,
  c.role,
  c.created_at as customer_created_at,
  au.id as auth_user_id,
  au.created_at as auth_created_at,
  EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) as has_line_account,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as booking_count
FROM auth.users au
INNER JOIN customers c ON c.id = au.id
WHERE au.email NOT LIKE '%@line.user'
ORDER BY au.email, c.created_at;

-- PART 3: Check if same auth.users.id has multiple customers records (shouldn't happen)
SELECT 
  'Same auth.users.id with multiple customers' as check_type,
  au.id as auth_user_id,
  au.email,
  COUNT(*) as customer_count,
  STRING_AGG(c.id::text, ', ') as customer_ids
FROM auth.users au
INNER JOIN customers c ON c.id = au.id
WHERE au.email NOT LIKE '%@line.user'
GROUP BY au.id, au.email
HAVING COUNT(*) > 1;

-- PART 4: Check for customers with same email but different IDs (data inconsistency)
SELECT 
  'Potential data inconsistency' as check_type,
  au1.email,
  au1.id as auth_user_id_1,
  c1.id as customer_id_1,
  c1.created_at as created_1,
  au2.id as auth_user_id_2,
  c2.id as customer_id_2,
  c2.created_at as created_2
FROM auth.users au1
INNER JOIN customers c1 ON c1.id = au1.id
INNER JOIN auth.users au2 ON au2.email = au1.email AND au2.id != au1.id
INNER JOIN customers c2 ON c2.id = au2.id
WHERE au1.email NOT LIKE '%@line.user'
ORDER BY au1.email;

-- PART 5: Show all WEB customers with their details
SELECT 
  'All WEB customers' as check_type,
  c.id as customer_id,
  c.role,
  c.created_at,
  au.id as auth_user_id,
  au.email,
  au.created_at as auth_created_at,
  EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) as has_line_account,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as booking_count,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id AND source = 'web') as web_bookings
FROM customers c
INNER JOIN auth.users au ON au.id = c.id
WHERE 
  au.email NOT LIKE '%@line.user'
  AND NOT EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id)
  AND c.role = 'customer'
ORDER BY c.created_at DESC;

