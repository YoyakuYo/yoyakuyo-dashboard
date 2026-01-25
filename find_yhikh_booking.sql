-- Find the specific booking for Yhikh at barberSOW
SELECT
  b.id as booking_id,
  b.date,
  b.start_time,
  b.status,
  b.customer_name,
  b.customer_email,
  s.name as shop_name,
  s.owner_user_id,
  b.created_at
FROM bookings b
JOIN shops s ON s.id = b.shop_id
WHERE b.customer_email = 'yoyakuyodemo@gmail.com'
  AND s.name = 'barberSOW'
  AND b.date = '2026-01-27'
  AND b.start_time = '09:16:00'
ORDER BY b.created_at DESC;

-- Also check if this customer has an account
SELECT
  c.id,
  c.name,
  c.email,
  c.role,
  c.line_user_id,
  c.created_at
FROM customers c
WHERE c.email = 'yoyakuyodemo@gmail.com';