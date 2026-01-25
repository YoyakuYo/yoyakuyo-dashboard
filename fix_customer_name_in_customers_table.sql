-- FIX: Update LINE customer name in customers table
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5

-- Update the customer name in the customers table
UPDATE customers
SET name = 'LINE Customer Uf57413'
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  AND (name IS NULL OR name = '' OR name = 'LINE Customer');

-- Verify the fix worked
SELECT
  c.id,
  c.name,
  c.role,
  c.line_user_id,
  c.created_at
FROM customers c
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Show how bookings should display with customer names (join example)
SELECT
  b.id as booking_id,
  b.date,
  b.start_time,
  b.status,
  c.name as customer_name,
  c.line_user_id,
  s.name as shop_name
FROM bookings b
JOIN customers c ON c.id = b.customer_id
JOIN shops s ON s.id = b.shop_id
WHERE b.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
ORDER BY b.created_at DESC
LIMIT 5;