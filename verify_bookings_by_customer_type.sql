-- SQL Query to Verify Bookings by Customer Type
-- This helps understand how bookings are linked to different customer types (LINE vs Web)

-- ============================================
-- PART 1: Check customers table structure
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- ============================================
-- PART 2: Check bookings table structure and customer-related fields
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name IN ('customer_id', 'user_id', 'customer_profile_id', 'source', 'booking_type')
ORDER BY column_name;

-- ============================================
-- PART 3: Count bookings by customer type/field
-- ============================================
SELECT 
  'Total bookings' as metric,
  COUNT(*) as count
FROM bookings
UNION ALL
SELECT 
  'Bookings with customer_id (old field)',
  COUNT(*)
FROM bookings
WHERE customer_id IS NOT NULL
UNION ALL
SELECT 
  'Bookings with user_id (web customers)',
  COUNT(*)
FROM bookings
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
  'Bookings with customer_profile_id (web customers)',
  COUNT(*)
FROM bookings
WHERE customer_profile_id IS NOT NULL
UNION ALL
SELECT 
  'Bookings with source = line (LINE customers)',
  COUNT(*)
FROM bookings
WHERE source = 'line'
UNION ALL
SELECT 
  'Bookings with source = web (Web customers)',
  COUNT(*)
FROM bookings
WHERE source = 'web'
UNION ALL
SELECT 
  'Bookings with NULL for all customer fields',
  COUNT(*)
FROM bookings
WHERE customer_id IS NULL 
  AND user_id IS NULL 
  AND customer_profile_id IS NULL;

-- ============================================
-- PART 4: Show sample bookings with all customer-related fields
-- ============================================
SELECT 
  id,
  customer_id,
  user_id,
  customer_profile_id,
  source,
  customer_name,
  customer_email,
  shop_id,
  status,
  created_at,
  -- Determine customer type based on fields
  CASE 
    WHEN source = 'line' THEN 'LINE'
    WHEN user_id IS NOT NULL OR customer_profile_id IS NOT NULL THEN 'WEB'
    WHEN customer_id IS NOT NULL AND (source IS NULL OR source != 'line') THEN 'LEGACY'
    ELSE 'GUEST'
  END as customer_type
FROM bookings
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- PART 5: Verify customer_profiles table structure
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customer_profiles'
ORDER BY ordinal_position;

-- ============================================
-- PART 6: Check how customer_profiles link to customers
-- ============================================
SELECT 
  cp.id as profile_id,
  cp.customer_auth_id,
  cp.email as profile_email,
  cp.name as profile_name,
  c.id as customer_id,
  c.role as customer_role,
  -- Check if this profile has bookings
  (SELECT COUNT(*) FROM bookings b WHERE b.customer_profile_id = cp.id) as bookings_count,
  -- Check if this customer has bookings via customer_id
  (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) as bookings_via_customer_id
FROM customer_profiles cp
LEFT JOIN customers c ON c.id = cp.customer_auth_id OR c.id = cp.id
LIMIT 10;

-- ============================================
-- PART 7: Group bookings by customer type
-- ============================================
SELECT 
  CASE 
    WHEN source = 'line' THEN 'LINE Customer'
    WHEN user_id IS NOT NULL OR customer_profile_id IS NOT NULL THEN 'Web Customer'
    WHEN customer_id IS NOT NULL AND (source IS NULL OR source != 'line') THEN 'Legacy Customer (customer_id)'
    ELSE 'Guest Booking'
  END as customer_type,
  COUNT(*) as booking_count,
  COUNT(DISTINCT COALESCE(user_id::text, customer_id::text, customer_profile_id::text)) as unique_customers
FROM bookings
GROUP BY 
  CASE 
    WHEN source = 'line' THEN 'LINE Customer'
    WHEN user_id IS NOT NULL OR customer_profile_id IS NOT NULL THEN 'Web Customer'
    WHEN customer_id IS NOT NULL AND (source IS NULL OR source != 'line') THEN 'Legacy Customer (customer_id)'
    ELSE 'Guest Booking'
  END
ORDER BY booking_count DESC;

-- ============================================
-- PART 8: Show bookings for a specific customer type (example: web customers)
-- ============================================
-- Web customers (have user_id or customer_profile_id)
SELECT 
  'Web Customer Bookings' as category,
  b.id,
  b.customer_id,
  b.user_id,
  b.customer_profile_id,
  b.customer_name,
  b.shop_id,
  b.status,
  b.created_at,
  cp.customer_auth_id as profile_auth_id,
  cp.email as profile_email
FROM bookings b
LEFT JOIN customer_profiles cp ON cp.id = b.customer_profile_id
WHERE b.user_id IS NOT NULL OR b.customer_profile_id IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 10;

-- ============================================
-- PART 9: Show bookings for LINE customers (source = 'line')
-- ============================================
-- LINE customers (have source = 'line')
SELECT 
  'LINE Customer Bookings' as category,
  b.id,
  b.customer_id,
  b.source,
  b.customer_name,
  b.shop_id,
  b.status,
  b.created_at,
  -- Get line_user_id from line_accounts if available
  la.line_user_id
FROM bookings b
LEFT JOIN line_accounts la ON la.customer_id = b.customer_id
WHERE b.source = 'line'
ORDER BY b.created_at DESC
LIMIT 10;

-- ============================================
-- PART 10: Check if there's a line_bookings table (separate table for LINE)
-- ============================================
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%line%booking%'
ORDER BY table_name;

