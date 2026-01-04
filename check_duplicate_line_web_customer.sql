-- Check for duplicate/misclassified customers
-- The WEB customer has LINE email pattern - need to find the correct customer

-- Check the WEB customer
SELECT 
  'WEB CUSTOMER' as type,
  c.id as customer_id,
  c.role,
  c.email,
  c.name,
  c.auth_user_id,
  c.line_user_id,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as booking_count
FROM customers c
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Check the LINE customer with same line_user_id
SELECT 
  'LINE CUSTOMER' as type,
  c.id as customer_id,
  c.role,
  c.email,
  c.name,
  c.auth_user_id,
  c.line_user_id,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as booking_count
FROM customers c
WHERE c.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- Check auth.users for the WEB customer's auth_user_id
SELECT 
  'AUTH.USERS' as type,
  id,
  email,
  raw_user_meta_data->>'name' as metadata_name,
  raw_user_meta_data->>'full_name' as metadata_full_name,
  raw_user_meta_data
FROM auth.users
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Check which customer has bookings
SELECT 
  b.id as booking_id,
  b.customer_id,
  b.source,
  c.role as customer_role,
  c.email as customer_email
FROM bookings b
JOIN customers c ON b.customer_id = c.id
WHERE b.customer_id IN ('78fea290-ef9a-43c8-96d6-90460c04efe5', '9bc12391-4116-4e4e-941b-e4606d8dfb16')
ORDER BY b.created_at DESC;

