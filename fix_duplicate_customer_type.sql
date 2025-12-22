-- ============================================
-- FIX CUSTOMER WITH BOTH AUTH.USERS AND LINE_ACCOUNTS
-- ============================================
-- This customer has both auth.users entry AND line_accounts entry
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5
-- This is a data inconsistency that needs to be resolved
-- ============================================

-- STEP 1: Check what this customer actually is
SELECT 
  'Customer Details' as check_type,
  c.id,
  c.role,
  c.created_at,
  au.id as auth_user_id,
  au.email as auth_email,
  au.created_at as auth_created_at,
  la.line_user_id,
  la.created_at as line_account_created_at,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as booking_count
FROM customers c
LEFT JOIN auth.users au ON au.id = c.id
LEFT JOIN line_accounts la ON la.customer_id = c.id
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- STEP 2: Check bookings for this customer
SELECT 
  'Bookings for this customer' as check_type,
  b.id,
  b.source,
  b.status,
  b.created_at,
  b.customer_id
FROM bookings b
WHERE b.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
ORDER BY b.created_at DESC
LIMIT 10;

-- STEP 3: Determine which is correct (LINE or WEB)
-- If bookings have source = 'line', this is a LINE customer
-- If bookings have source = 'web', this is a WEB customer
SELECT 
  'Booking source distribution' as check_type,
  b.source,
  COUNT(*) as count
FROM bookings b
WHERE b.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
GROUP BY b.source;

-- ============================================
-- DECISION: Based on booking source
-- ============================================
-- If most bookings are source = 'line' → This is a LINE customer
--   ACTION: Keep line_accounts, but the auth.users entry might be legitimate
--           (LINE users can also have auth.users entries for other purposes)
--
-- If most bookings are source = 'web' → This is a WEB customer  
--   ACTION: Remove line_accounts entry (if it's incorrect)
--
-- If mixed → Need to investigate further
-- ============================================

-- STEP 4: Check if auth.users entry is actually used
-- (Some systems create auth.users entries for LINE users for other features)
SELECT 
  'Auth user usage check' as check_type,
  au.id,
  au.email,
  au.created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM bookings b WHERE b.customer_id = au.id AND b.source = 'web') THEN 'Has WEB bookings'
    ELSE 'No WEB bookings'
  END as has_web_bookings
FROM auth.users au
WHERE au.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- ============================================
-- RECOMMENDATION
-- ============================================
-- Based on the booking count (28 bookings), this customer is very active.
-- The fact that it has both entries suggests:
-- 1. This might be a legitimate LINE user who also has an auth.users entry
-- 2. OR this is a data migration issue where a customer was created twice
--
-- Since it's classified as LINE (has line_accounts), and has 28 bookings,
-- it's likely a LINE customer. The auth.users entry might be:
-- - A duplicate/error
-- - Or legitimate (some systems allow LINE users to have auth accounts)
--
-- TO FIX: If this should be LINE only, you can either:
-- 1. Leave it as-is (it's correctly classified as LINE)
-- 2. Remove the auth.users entry if it's not needed (CAREFUL - might break things)
-- 3. Remove the line_accounts entry if it's actually a WEB customer (CAREFUL - check bookings first)
-- ============================================

