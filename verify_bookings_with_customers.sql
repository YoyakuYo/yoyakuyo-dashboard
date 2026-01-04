-- Verify bookings table with customer relationships
-- This script checks:
-- 1. All bookings and their customer data
-- 2. Customer names from different sources (LINE, WEB, GUEST)
-- 3. Missing or invalid customer relationships

SELECT 
  'BOOKING_CUSTOMER_VERIFICATION' as check_type,
  b.id as booking_id,
  b.source,
  b.status,
  b.date,
  b.start_time,
  b.customer_id,
  c.role as customer_role,
  c.email as customer_email,
  c.name as customer_name,
  c.auth_user_id,
  c.line_user_id,
  -- LINE customer name
  CASE 
    WHEN c.role = 'line' AND c.line_user_id IS NOT NULL THEN
      (SELECT line_display_name FROM customer_profiles WHERE line_user_id = c.line_user_id LIMIT 1)
    ELSE NULL
  END as line_display_name,
  -- WEB customer name
  CASE 
    WHEN c.role = 'web' AND c.auth_user_id IS NOT NULL THEN
      (SELECT full_name FROM users WHERE id = c.auth_user_id LIMIT 1)
    ELSE NULL
  END as web_user_full_name,
  -- Shop and service info
  s.name as shop_name,
  sv.name as service_name,
  -- Verification status
  CASE
    WHEN b.customer_id IS NULL THEN '❌ NO CUSTOMER_ID'
    WHEN c.id IS NULL THEN '❌ CUSTOMER NOT FOUND'
    WHEN c.role = 'line' AND c.line_user_id IS NULL THEN '❌ LINE CUSTOMER MISSING line_user_id'
    WHEN c.role = 'web' AND c.auth_user_id IS NULL THEN '❌ WEB CUSTOMER MISSING auth_user_id'
    WHEN c.role = 'guest' AND c.email IS NULL THEN '❌ GUEST CUSTOMER MISSING email'
    WHEN c.role = 'line' AND NOT EXISTS (
      SELECT 1 FROM customer_profiles WHERE line_user_id = c.line_user_id
    ) THEN '⚠️ LINE CUSTOMER NO PROFILE'
    WHEN c.role = 'web' AND NOT EXISTS (
      SELECT 1 FROM users WHERE id = c.auth_user_id
    ) THEN '⚠️ WEB CUSTOMER NO USER ENTRY'
    ELSE '✅ VALID'
  END as verification_status
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN shops s ON b.shop_id = s.id
LEFT JOIN services sv ON b.service_id = sv.id
ORDER BY b.created_at DESC;

-- Summary statistics
SELECT 
  'SUMMARY_STATISTICS' as check_type,
  COUNT(*) as total_bookings,
  COUNT(DISTINCT b.customer_id) as unique_customers,
  COUNT(CASE WHEN b.source = 'line' THEN 1 END) as line_bookings,
  COUNT(CASE WHEN b.source = 'web' THEN 1 END) as web_bookings,
  COUNT(CASE WHEN b.source = 'guest' THEN 1 END) as guest_bookings,
  COUNT(CASE WHEN b.customer_id IS NULL THEN 1 END) as bookings_without_customer,
  COUNT(CASE WHEN b.customer_id IS NOT NULL AND c.id IS NULL THEN 1 END) as orphaned_bookings,
  COUNT(CASE WHEN c.role = 'line' AND c.line_user_id IS NULL THEN 1 END) as line_customers_missing_id,
  COUNT(CASE WHEN c.role = 'web' AND c.auth_user_id IS NULL THEN 1 END) as web_customers_missing_id,
  COUNT(CASE WHEN c.role = 'guest' AND c.email IS NULL THEN 1 END) as guest_customers_missing_email
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id;

-- Check for bookings with customer_id but customer doesn't exist
SELECT 
  'ORPHANED_BOOKINGS' as check_type,
  b.id as booking_id,
  b.customer_id,
  b.source,
  b.status,
  b.date,
  s.name as shop_name
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN shops s ON b.shop_id = s.id
WHERE b.customer_id IS NOT NULL AND c.id IS NULL
ORDER BY b.created_at DESC;

