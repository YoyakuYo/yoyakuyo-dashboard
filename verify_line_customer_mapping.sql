-- Verify LINE customer mapping to profile
-- Check if the customer has the correct line_user_id

-- Check the LINE customer record
SELECT 
  'LINE CUSTOMER' as type,
  c.id as customer_id,
  c.role,
  c.line_user_id,
  c.email,
  c.name,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as booking_count
FROM customers c
WHERE c.id = '9bc12391-4116-4e4e-941b-e4606d8dfb16';

-- Check if the profile exists for this line_user_id
SELECT 
  'CUSTOMER_PROFILE' as type,
  cp.line_user_id,
  cp.line_display_name,
  cp.name,
  cp.full_name,
  cp.email
FROM customer_profiles cp
WHERE cp.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- Verify the mapping works
SELECT 
  'MAPPING VERIFICATION' as type,
  c.id as customer_id,
  c.line_user_id,
  cp.line_display_name as should_display_as,
  CASE 
    WHEN cp.line_display_name IS NOT NULL THEN '✅ Mapping works'
    ELSE '❌ Mapping broken'
  END as status
FROM customers c
LEFT JOIN customer_profiles cp ON c.line_user_id = cp.line_user_id
WHERE c.id = '9bc12391-4116-4e4e-941b-e4606d8dfb16';

-- Check bookings for this customer
SELECT 
  'BOOKINGS' as type,
  b.id as booking_id,
  b.customer_id,
  b.source,
  c.role as customer_role,
  c.line_user_id
FROM bookings b
JOIN customers c ON b.customer_id = c.id
WHERE b.customer_id = '9bc12391-4116-4e4e-941b-e4606d8dfb16'
ORDER BY b.created_at DESC
LIMIT 5;

