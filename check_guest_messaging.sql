-- Check why guest customers cannot receive messages
-- Guest customers have no accounts linked, so messaging is limited

-- Check messaging capabilities for guest vs authenticated customers
SELECT
  'Guest Customer Limitations:' as issue,
  'No LINE account linked (line_user_id is null)' as problem_1,
  'No web account linked (auth_user_id is null)' as problem_2,
  'Cannot receive internal messages (only authenticated users)' as limitation,
  'Can only receive email notifications if email provided' as alternative;

-- Check if guest customers can have conversations
SELECT
  conv.customer_type,
  COUNT(*) as conversation_count,
  COUNT(DISTINCT conv.customer_ref) as unique_customers
FROM conversations conv
GROUP BY conv.customer_type
ORDER BY conv.customer_type;

-- Check messaging requirements (from API code)
SELECT
  'Messaging Requirements:' as requirements,
  'Must be authenticated user (LINE or web)' as requirement_1,
  'Must have conversation in database' as requirement_2,
  'Guest customers cannot receive internal messages' as limitation;

-- Check if Yhikh has any conversations (should be none for guest)
SELECT
  conv.id,
  conv.customer_type,
  conv.customer_ref,
  COUNT(m.id) as message_count
FROM conversations conv
LEFT JOIN messages m ON m.conversation_id = conv.id
WHERE conv.customer_ref = '34f4d105-1c7b-4a78-a5f1-0d27c52fd216' -- Yhikh's customer ID
GROUP BY conv.id, conv.customer_type, conv.customer_ref;

-- Check how messages are sent (from API logic)
SELECT
  'Why cannot send message to Yhikh:' as reason,
  'Guest customers have no accounts to receive messages' as explanation_1,
  'Internal messaging requires LINE or web authentication' as explanation_2,
  'Only email notifications work for guests' as explanation_3;