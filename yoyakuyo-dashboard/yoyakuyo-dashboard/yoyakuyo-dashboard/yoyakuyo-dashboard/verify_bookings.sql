-- SQL Query to Verify Bookings in Database
-- This will help identify why bookings aren't showing up for the customer

-- ============================================
-- PART 1: Check all recent bookings (last 20)
-- ============================================
SELECT 
  id,
  customer_id,
  user_id,
  customer_profile_id,
  customer_name,
  customer_email,
  shop_id,
  service_id,
  status,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- PART 2: Check bookings for specific user
-- ============================================
-- User ID: e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f
-- Customer Profile ID: 35f87d4d-b5c1-4e11-8684-c9c0be9cd433

-- Check by user_id
SELECT 
  'By user_id' as query_type,
  id,
  customer_id,
  user_id,
  customer_profile_id,
  customer_name,
  shop_id,
  status,
  created_at
FROM bookings
WHERE user_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
ORDER BY created_at DESC;

-- Check by customer_profile_id
SELECT 
  'By customer_profile_id' as query_type,
  id,
  customer_id,
  user_id,
  customer_profile_id,
  customer_name,
  shop_id,
  status,
  created_at
FROM bookings
WHERE customer_profile_id = '35f87d4d-b5c1-4e11-8684-c9c0be9cd433'
ORDER BY created_at DESC;

-- Check by customer_id (old field)
SELECT 
  'By customer_id' as query_type,
  id,
  customer_id,
  user_id,
  customer_profile_id,
  customer_name,
  shop_id,
  status,
  created_at
FROM bookings
WHERE customer_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
ORDER BY created_at DESC;

-- ============================================
-- PART 3: Check customer profile exists
-- ============================================
SELECT 
  id,
  customer_auth_id,
  email,
  name,
  created_at
FROM customer_profiles
WHERE id = '35f87d4d-b5c1-4e11-8684-c9c0be9cd433'
   OR customer_auth_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

-- ============================================
-- PART 4: Check if columns exist in bookings table
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name IN ('customer_id', 'user_id', 'customer_profile_id')
ORDER BY column_name;

-- ============================================
-- PART 5: Count bookings by each field
-- ============================================
SELECT 
  'Total bookings' as metric,
  COUNT(*) as count
FROM bookings
UNION ALL
SELECT 
  'Bookings with user_id = e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f',
  COUNT(*)
FROM bookings
WHERE user_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
UNION ALL
SELECT 
  'Bookings with customer_profile_id = 35f87d4d-b5c1-4e11-8684-c9c0be9cd433',
  COUNT(*)
FROM bookings
WHERE customer_profile_id = '35f87d4d-b5c1-4e11-8684-c9c0be9cd433'
UNION ALL
SELECT 
  'Bookings with customer_id = e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f',
  COUNT(*)
FROM bookings
WHERE customer_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
UNION ALL
SELECT 
  'Bookings with NULL user_id',
  COUNT(*)
FROM bookings
WHERE user_id IS NULL
UNION ALL
SELECT 
  'Bookings with NULL customer_profile_id',
  COUNT(*)
FROM bookings
WHERE customer_profile_id IS NULL;

