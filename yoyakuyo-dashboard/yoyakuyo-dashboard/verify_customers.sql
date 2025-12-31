-- ============================================
-- VERIFY EXISTING CUSTOMERS IN SUPABASE
-- ============================================

-- PART 1: Count customers by role
SELECT 
  'Total customers' as metric,
  COUNT(*) as count
FROM customers
UNION ALL
SELECT 
  'Customers with role = customer' as metric,
  COUNT(*) as count
FROM customers
WHERE role = 'customer'
UNION ALL
SELECT 
  'Customers with role = guest' as metric,
  COUNT(*) as count
FROM customers
WHERE role = 'guest'
UNION ALL
SELECT 
  'Customers with role = owner' as metric,
  COUNT(*) as count
FROM customers
WHERE role = 'owner';

-- PART 2: Sample customers (first 20)
SELECT 
  id,
  role,
  created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) THEN 'LINE'
    WHEN EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id) THEN 'WEB'
    WHEN role = 'guest' THEN 'GUEST'
    ELSE 'UNKNOWN'
  END as customer_type,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as booking_count
FROM customers c
ORDER BY created_at DESC
LIMIT 20;

-- PART 3: Check for specific user (if you want to check a specific ID)
-- Replace 'YOUR_USER_ID' with the actual user ID
SELECT 
  'Customer lookup for e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f' as check_type,
  c.id,
  c.role,
  c.created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) THEN 'LINE'
    WHEN EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id) THEN 'WEB'
    WHEN role = 'guest' THEN 'GUEST'
    ELSE 'UNKNOWN'
  END as customer_type,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as booking_count,
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id) as has_auth_user
FROM customers c
WHERE c.id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

-- PART 4: Check auth.users that don't have customers record
SELECT 
  'Auth users without customers record' as metric,
  COUNT(*) as count
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM customers c WHERE c.id = au.id
)
AND au.email IS NOT NULL; -- Only check users with emails (likely web customers)

-- PART 5: Sample auth.users without customers (first 10)
SELECT 
  au.id,
  au.email,
  au.created_at,
  'Missing customer record' as status
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM customers c WHERE c.id = au.id
)
AND au.email IS NOT NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- PART 6: Customers with bookings
SELECT 
  'Customers with bookings' as metric,
  COUNT(DISTINCT customer_id) as count
FROM bookings
WHERE customer_id IS NOT NULL;

-- PART 7: Customers without bookings
SELECT 
  'Customers without bookings' as metric,
  COUNT(*) as count
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM bookings b WHERE b.customer_id = c.id
)
AND c.role != 'owner'; -- Owners don't need bookings

-- PART 8: Customer type distribution (CORRECTED - LINE takes priority)
-- NOTE: LINE customers are checked FIRST, so customers with both LINE and auth.users are correctly classified as LINE
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) THEN 'LINE'
    WHEN EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id 
                 AND (au.email NOT LIKE '%@line.user' OR au.email IS NULL)) THEN 'WEB'
    WHEN role = 'guest' THEN 'GUEST'
    WHEN role = 'owner' THEN 'OWNER'
    ELSE 'UNKNOWN'
  END as customer_type,
  COUNT(*) as count
FROM customers c
GROUP BY 
  CASE 
    WHEN EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) THEN 'LINE'
    WHEN EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id 
                 AND (au.email NOT LIKE '%@line.user' OR au.email IS NULL)) THEN 'WEB'
    WHEN role = 'guest' THEN 'GUEST'
    WHEN role = 'owner' THEN 'OWNER'
    ELSE 'UNKNOWN'
  END
ORDER BY count DESC;

-- PART 9: DETAILED CUSTOMER LIST - Shows all customers with full details
SELECT 
  c.id,
  c.role,
  c.created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) THEN 'LINE'
    WHEN EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id 
                 AND (au.email NOT LIKE '%@line.user' OR au.email IS NULL)) THEN 'WEB'
    WHEN role = 'guest' THEN 'GUEST'
    WHEN role = 'owner' THEN 'OWNER'
    ELSE 'UNKNOWN'
  END as customer_type,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as booking_count,
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id) as has_auth_user,
  EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) as has_line_account,
  (SELECT line_user_id FROM line_accounts la WHERE la.customer_id = c.id LIMIT 1) as line_user_id,
  (SELECT email FROM auth.users au WHERE au.id = c.id) as auth_email
FROM customers c
ORDER BY c.created_at DESC;

-- PART 10: Check for duplicate customer IDs or overlapping types
SELECT 
  'Potential duplicates or overlaps' as check_type,
  c.id,
  c.role,
  CASE 
    WHEN EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) THEN 'LINE'
    WHEN EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id 
                 AND (au.email NOT LIKE '%@line.user' OR au.email IS NULL)) THEN 'WEB'
    WHEN role = 'guest' THEN 'GUEST'
    WHEN role = 'owner' THEN 'OWNER'
    ELSE 'UNKNOWN'
  END as customer_type,
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id) as has_auth_user,
  EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) as has_line_account,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as booking_count
FROM customers c
WHERE 
  -- Check if customer has both auth.user AND line_account (shouldn't happen)
  (EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id) 
   AND EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id))
  OR
  -- Check if customer has neither (orphaned)
  (NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id) 
   AND NOT EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id)
   AND c.role != 'guest' AND c.role != 'owner')
ORDER BY c.created_at DESC;

