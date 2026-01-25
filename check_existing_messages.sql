-- Check what sender_id values are used in existing messages
SELECT DISTINCT
  sender_type,
  sender_id,
  COUNT(*) as message_count
FROM messages
WHERE sender_id IS NOT NULL
GROUP BY sender_type, sender_id
ORDER BY sender_type, message_count DESC
LIMIT 10;

-- Check recent messages to see the pattern
SELECT
  id,
  conversation_id,
  sender_type,
  sender_id,
  LEFT(content, 50) as content_preview,
  created_at
FROM messages
ORDER BY created_at DESC
LIMIT 5;