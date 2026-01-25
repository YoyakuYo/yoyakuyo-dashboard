-- Check what sender_id values are used for owner messages specifically
SELECT DISTINCT
  sender_type,
  sender_id,
  COUNT(*) as message_count
FROM messages
WHERE sender_type = 'owner'
  AND sender_id IS NOT NULL
GROUP BY sender_type, sender_id
ORDER BY message_count DESC
LIMIT 5;

-- Check the most recent owner messages to see the pattern
SELECT
  id,
  conversation_id,
  sender_type,
  sender_id,
  LEFT(content, 50) as content_preview,
  created_at
FROM messages
WHERE sender_type = 'owner'
ORDER BY created_at DESC
LIMIT 3;

-- Get the shop owner ID for this customer's bookings
SELECT DISTINCT
  s.owner_user_id,
  s.name as shop_name,
  b.customer_id,
  COUNT(b.id) as booking_count
FROM bookings b
JOIN shops s ON s.id = b.shop_id
WHERE b.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
GROUP BY s.owner_user_id, s.name, b.customer_id;