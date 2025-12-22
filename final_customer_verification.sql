-- ============================================
-- FINAL CUSTOMER VERIFICATION
-- ============================================
-- Verify exactly 1 WEB customer and 1 LINE customer
-- Show full details for each
-- ============================================

-- PART 1: Final count by type
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
WHERE role IN ('customer', 'guest') -- Exclude owners
GROUP BY 
  CASE 
    WHEN EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) THEN 'LINE'
    WHEN EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id 
                 AND (au.email NOT LIKE '%@line.user' OR au.email IS NULL)) THEN 'WEB'
    WHEN role = 'guest' THEN 'GUEST'
    WHEN role = 'owner' THEN 'OWNER'
    ELSE 'UNKNOWN'
  END
ORDER BY customer_type;

-- PART 2: WEB Customer Details
SELECT 
  'WEB CUSTOMER' as customer_type,
  c.id as customer_id,
  c.role,
  c.created_at as customer_created_at,
  au.id as auth_user_id,
  au.email as auth_email,
  au.created_at as auth_created_at,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id AND source = 'web') as web_bookings,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id AND source = 'line') as line_bookings,
  EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) as has_line_account,
  (SELECT line_user_id FROM line_accounts la WHERE la.customer_id = c.id LIMIT 1) as line_user_id
FROM customers c
INNER JOIN auth.users au ON au.id = c.id
WHERE 
  -- WEB customer: has auth.users with real email (not @line.user)
  au.email NOT LIKE '%@line.user'
  -- And does NOT have line_accounts (pure WEB customer)
  AND NOT EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id)
  AND c.role = 'customer';

-- PART 3: LINE Customer Details
SELECT 
  'LINE CUSTOMER' as customer_type,
  c.id as customer_id,
  c.role,
  c.created_at as customer_created_at,
  la.line_user_id,
  la.created_at as line_account_created_at,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id AND source = 'web') as web_bookings,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id AND source = 'line') as line_bookings,
  EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id) as has_auth_user,
  (SELECT email FROM auth.users au WHERE au.id = c.id) as auth_email
FROM customers c
INNER JOIN line_accounts la ON la.customer_id = c.id
WHERE c.role = 'customer';

-- PART 4: Summary - Expected vs Actual
SELECT 
  'VERIFICATION SUMMARY' as check_type,
  (SELECT COUNT(*) FROM customers c
   INNER JOIN auth.users au ON au.id = c.id
   WHERE au.email NOT LIKE '%@line.user'
   AND NOT EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id)
   AND c.role = 'customer') as web_customer_count,
  (SELECT COUNT(*) FROM customers c
   INNER JOIN line_accounts la ON la.customer_id = c.id
   WHERE c.role = 'customer') as line_customer_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM customers c
          INNER JOIN auth.users au ON au.id = c.id
          WHERE au.email NOT LIKE '%@line.user'
          AND NOT EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id)
          AND c.role = 'customer') = 1
     AND (SELECT COUNT(*) FROM customers c
          INNER JOIN line_accounts la ON la.customer_id = c.id
          WHERE c.role = 'customer') = 1
    THEN '✅ CORRECT: 1 WEB, 1 LINE'
    ELSE '❌ MISMATCH: Check details above'
  END as verification_status;

