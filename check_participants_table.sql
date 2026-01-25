-- Check the participants table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'participants'
ORDER BY ordinal_position;

-- Check what participants exist for this conversation
SELECT
  p.id,
  p.conversation_id,
  p.user_type,
  p.user_id,
  p.created_at
FROM participants p
WHERE p.conversation_id = '26a1f4b4-6ea0-498b-be43-27cfc69711e8';

-- Check if the shop owner is in the participants table for any conversation
SELECT DISTINCT
  p.conversation_id,
  p.user_type,
  p.user_id,
  c.customer_type,
  c.customer_ref
FROM participants p
LEFT JOIN conversations c ON c.id = p.conversation_id
WHERE p.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a';

-- Check what user_id values are actually used as sender_id in messages
SELECT DISTINCT
  m.sender_type,
  m.sender_id,
  COUNT(*) as message_count
FROM messages m
WHERE m.sender_id IS NOT NULL
GROUP BY m.sender_type, m.sender_id
ORDER BY m.sender_type, message_count DESC
LIMIT 10;