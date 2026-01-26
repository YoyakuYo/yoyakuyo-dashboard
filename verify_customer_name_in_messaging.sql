-- Verify customer name display in owner messaging section
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5

-- Check current customer name in customers table
SELECT
  c.id,
  c.name,
  c.role,
  c.line_user_id,
  c.created_at
FROM customers c
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Check shop_threads for this customer (join with customers to get name)
SELECT
  st.id as thread_id,
  st.booking_id,
  st.customer_id,
  c.name as customer_name,
  c.line_user_id,
  st.customer_email,
  st.last_message_preview,
  st.last_message_from,
  st.created_at
FROM shop_threads st
LEFT JOIN customers c ON c.id = st.customer_id
WHERE st.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
ORDER BY st.created_at DESC;

-- Check conversations for this customer
SELECT
  conv.id as conversation_id,
  conv.customer_type,
  conv.customer_ref,
  c.name as customer_name,
  conv.created_at as conversation_created_at
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Verify booking display includes customer name
SELECT
  b.id as booking_id,
  b.date,
  b.start_time,
  b.status,
  c.name as customer_name,
  c.line_user_id,
  s.name as shop_name,
  b.created_at
FROM bookings b
JOIN customers c ON c.id = b.customer_id
JOIN shops s ON s.id = b.shop_id
WHERE b.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
ORDER BY b.created_at DESC
LIMIT 5;