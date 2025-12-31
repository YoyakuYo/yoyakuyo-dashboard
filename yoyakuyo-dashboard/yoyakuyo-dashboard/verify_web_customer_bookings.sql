-- ============================================
-- VERIFY WEB CUSTOMER BOOKINGS FOR DASHBOARD
-- ============================================
-- Check if WEB customer bookings are correctly linked
-- Customer: e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f (yayakuyodemo@gmail.com)
-- ============================================

-- PART 1: Verify customer exists and is correctly classified
SELECT 
  'WEB Customer Verification' as check_type,
  c.id as customer_id,
  c.role,
  au.email,
  EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id) as has_line_account,
  'Should be WEB customer' as expected
FROM customers c
INNER JOIN auth.users au ON au.id = c.id
WHERE c.id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

-- PART 2: Check all bookings for this WEB customer
SELECT 
  'WEB Customer Bookings' as check_type,
  b.id as booking_id,
  b.customer_id,
  b.source,
  b.status,
  b.start_time,
  b.created_at,
  s.name as shop_name,
  srv.name as service_name,
  -- Verify booking is correctly linked
  CASE 
    WHEN b.customer_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f' THEN '✅ Correctly linked'
    ELSE '❌ Wrong customer_id'
  END as linkage_status
FROM bookings b
LEFT JOIN shops s ON s.id = b.shop_id
LEFT JOIN services srv ON srv.id = b.service_id
WHERE b.customer_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
ORDER BY b.created_at DESC;

-- PART 3: Booking count summary
SELECT 
  'Booking Summary' as check_type,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN source = 'web' THEN 1 END) as web_bookings,
  COUNT(CASE WHEN source = 'line' THEN 1 END) as line_bookings,
  COUNT(CASE WHEN source = 'guest' THEN 1 END) as guest_bookings,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings
FROM bookings
WHERE customer_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

-- PART 4: Verify bookings will appear in dashboard (check all required fields)
SELECT 
  'Dashboard Readiness Check' as check_type,
  b.id as booking_id,
  b.customer_id IS NOT NULL as has_customer_id,
  b.customer_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f' as correct_customer_id,
  b.source = 'web' as correct_source,
  b.shop_id IS NOT NULL as has_shop_id,
  s.name IS NOT NULL as has_shop_name,
  b.service_id IS NOT NULL as has_service_id,
  srv.name IS NOT NULL as has_service_name,
  b.start_time IS NOT NULL as has_start_time,
  b.status IS NOT NULL as has_status,
  -- All fields required for dashboard display
  CASE 
    WHEN b.customer_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f' 
     AND b.shop_id IS NOT NULL 
     AND b.service_id IS NOT NULL
     AND b.start_time IS NOT NULL
     AND b.status IS NOT NULL
    THEN '✅ Ready for dashboard'
    ELSE '❌ Missing required fields'
  END as dashboard_status
FROM bookings b
LEFT JOIN shops s ON s.id = b.shop_id
LEFT JOIN services srv ON srv.id = b.service_id
WHERE b.customer_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
ORDER BY b.created_at DESC;

-- PART 5: Final verification - what the API endpoint should return
SELECT 
  'API Endpoint Simulation' as check_type,
  b.id,
  b.customer_id,
  b.source,
  b.status,
  b.start_time,
  b.created_at,
  jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'address', s.address,
    'phone', s.phone
  ) as shops,
  jsonb_build_object(
    'id', srv.id,
    'name', srv.name,
    'price', srv.price
  ) as services
FROM bookings b
LEFT JOIN shops s ON s.id = b.shop_id
LEFT JOIN services srv ON srv.id = b.service_id
WHERE b.customer_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
ORDER BY b.created_at DESC;

