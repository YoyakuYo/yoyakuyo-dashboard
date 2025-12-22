-- ============================================
-- CHECK IF LINE CUSTOMER'S AUTH.USERS ENTRY IS USED
-- ============================================
-- Customer: 78fea290-ef9a-43c8-96d6-90460c04efe5
-- This customer has both line_accounts and auth.users entries
-- We need to check if the auth.users entry is actually used anywhere
-- ============================================

-- STEP 1: Check if auth.users entry is referenced anywhere
SELECT 
  'Auth user references' as check_type,
  'bookings.user_id' as reference_type,
  COUNT(*) as count
FROM bookings
WHERE user_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
UNION ALL
SELECT 
  'Auth user references' as check_type,
  'bookings.customer_profile_id' as reference_type,
  COUNT(*) as count
FROM bookings b
JOIN customer_profiles cp ON cp.id = b.customer_profile_id
WHERE cp.customer_auth_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
UNION ALL
SELECT 
  'Auth user references' as check_type,
  'customer_profiles.customer_auth_id' as reference_type,
  COUNT(*) as count
FROM customer_profiles
WHERE customer_auth_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
UNION ALL
SELECT 
  'Auth user references' as check_type,
  'reviews.user_id' as reference_type,
  COUNT(*) as count
FROM reviews
WHERE user_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- STEP 2: Check what the auth.users entry looks like
SELECT 
  'Auth user details' as check_type,
  au.id,
  au.email,
  au.created_at,
  au.last_sign_in_at,
  au.user_metadata,
  'This is a LINE placeholder email' as note
FROM auth.users au
WHERE au.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- STEP 3: Check line_accounts entry
SELECT 
  'Line account details' as check_type,
  la.customer_id,
  la.line_user_id,
  la.created_at
FROM line_accounts la
WHERE la.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- STEP 4: Summary - Is auth.users entry needed?
SELECT 
  'Summary' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM bookings 
      WHERE user_id = '78fea290-ef9a-43c8-96d6-90460c04efe5' 
      AND source = 'web'
    ) THEN 'Auth.users entry IS used (has WEB bookings)'
    WHEN EXISTS (
      SELECT 1 FROM customer_profiles 
      WHERE customer_auth_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
    ) THEN 'Auth.users entry IS used (has customer_profile)'
    WHEN EXISTS (
      SELECT 1 FROM reviews 
      WHERE user_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
    ) THEN 'Auth.users entry IS used (has reviews)'
    ELSE 'Auth.users entry appears UNUSED (can be ignored)'
  END as recommendation;

-- ============================================
-- RECOMMENDATION
-- ============================================
-- If the auth.users entry is NOT used anywhere:
--   → It's safe to ignore (it's just a legacy/placeholder entry)
--   → The customer is correctly classified as LINE
--   → No action needed
--
-- If the auth.users entry IS used:
--   → Keep it (it might be needed for other features)
--   → The customer is still correctly classified as LINE
--   → No action needed
--
-- The important thing is: The customer type detection is now fixed,
-- so this won't cause incorrect classification anymore.
-- ============================================

