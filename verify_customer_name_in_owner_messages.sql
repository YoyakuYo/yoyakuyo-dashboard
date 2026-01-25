-- Verify customer name display in owner messages section
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

-- Check conversations and messages for this customer
SELECT
  conv.id as conversation_id,
  conv.customer_type,
  conv.customer_ref,
  conv.created_at as conversation_created_at,
  COUNT(m.id) as total_messages,
  MAX(m.created_at) as last_message_at
FROM conversations conv
LEFT JOIN messages m ON m.conversation_id = conv.id
WHERE conv.customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5'
GROUP BY conv.id, conv.customer_type, conv.customer_ref, conv.created_at;

-- Check if customer name appears in shop_threads (messaging system)
SELECT
  st.id as thread_id,
  st.booking_id,
  st.customer_id,
  st.customer_name,
  st.line_user_id,
  st.created_at
FROM shop_threads st
WHERE st.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
ORDER BY st.created_at DESC;

-- Check recent messages to see customer identification
SELECT
  m.id as message_id,
  m.conversation_id,
  m.sender_type,
  m.sender_id,
  LEFT(m.content, 100) as content_preview,
  m.created_at
FROM messages m
WHERE m.conversation_id IN (
  SELECT id FROM conversations
  WHERE customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5'
)
ORDER BY m.created_at DESC
LIMIT 10;

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