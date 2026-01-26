-- SIMPLE FIX: Update LINE customer name in existing bookings
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5

-- Update all existing bookings for this customer with a better placeholder name
UPDATE bookings
SET customer_name = 'LINE Customer Uf57413'
WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  AND (customer_name IS NULL OR customer_name = '' OR customer_name = 'LINE Customer');

-- Verify the fix worked
SELECT
  b.id as booking_id,
  b.customer_name,
  b.created_at as booking_date,
  b.status
FROM bookings b
WHERE b.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
ORDER BY b.created_at DESC
LIMIT 5;

-- Check customer details
SELECT
  c.id,
  c.role,
  la.line_user_id,
  c.created_at
FROM customers c
LEFT JOIN line_accounts la ON la.customer_id = c.id
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';