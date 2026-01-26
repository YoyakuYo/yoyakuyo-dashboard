-- CHECK MESSAGE ROUTING ISSUE - WHY ALL MESSAGES GO TO YHIKH?

-- CHECK CONVERSATION IDs FOR DIFFERENT CUSTOMERS
SELECT
  'Conversation IDs for different customers:' as check,
  conv.id as conversation_id,
  c.name as customer_name,
  conv.customer_type,
  conv.customer_ref,
  conv.created_at
FROM conversations conv
LEFT JOIN customers c ON (
  CASE WHEN conv.customer_type::text = 'line' THEN c.line_user_id = conv.customer_ref
       ELSE c.id = conv.customer_ref::uuid END
)
WHERE conv.customer_type::text IN ('guest', 'line')
  AND (
    c.name IN ('Yhikh', 'Guest2', 'Alpha', 'ghttthhhaa', 'Amira', 'wapio', 'Aliipaa')
    OR conv.customer_ref IN (
      SELECT id FROM customers WHERE name IN ('Yhikh', 'Guest2', 'Alpha', 'ghttthhhaa', 'Amira', 'wapio', 'Aliipaa')
    )
  )
ORDER BY conv.created_at DESC;

-- CHECK MESSAGES IN YHIKH'S CONVERSATION
SELECT
  'Messages in Yhikh conversation:' as check,
  m.id as message_id,
  m.content,
  m.sender_id,
  m.created_at,
  CASE
    WHEN m.sender_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a' THEN 'SHOP OWNER (should be sent)'
    ELSE 'CUSTOMER (received)'
  END as message_type
FROM messages m
WHERE m.conversation_id = 'b1178685-b981-4191-bf52-2ecad8d66420'
ORDER BY m.created_at DESC
LIMIT 10;

-- CHECK IF OTHER CONVERSATIONS HAVE MESSAGES
SELECT
  'Messages in other conversations:' as check,
  conv.id as conversation_id,
  c.name as customer_name,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as latest_message
FROM conversations conv
LEFT JOIN customers c ON (
  CASE WHEN conv.customer_type::text = 'line' THEN c.line_user_id = conv.customer_ref
       ELSE c.id = conv.customer_ref::uuid END
)
LEFT JOIN messages m ON m.conversation_id = conv.id
WHERE conv.customer_type::text IN ('guest', 'line')
  AND c.name IN ('Guest2', 'Alpha', 'ghttthhhaa', 'Amira', 'wapio', 'Aliipaa')
GROUP BY conv.id, c.name
ORDER BY conv.created_at DESC;

-- CHECK FRONTEND CONVERSATION SELECTION
SELECT
  'Frontend conversation selection check:' as diagnosis,
  'Issue: Clicking different customers shows Yhikh messages' as problem,
  'Possible causes:' as analysis,
  '1. Frontend always uses Yhikh conversation ID' as cause1,
  '2. Backend routes all messages to Yhikh conversation' as cause2,
  '3. Conversation ID mapping is wrong' as cause3;

-- CHECK MESSAGE CREATION - ARE NEW MESSAGES GOING TO YHIKH?
SELECT
  'Recent messages across all conversations:' as recent_check,
  m.id as message_id,
  m.conversation_id,
  m.content,
  m.sender_id,
  c.name as customer_name,
  m.created_at
FROM messages m
JOIN conversations conv ON conv.id = m.conversation_id
LEFT JOIN customers c ON (
  CASE WHEN conv.customer_type::text = 'line' THEN c.line_user_id = conv.customer_ref
       ELSE c.id = conv.customer_ref::uuid END
)
ORDER BY m.created_at DESC
LIMIT 10;