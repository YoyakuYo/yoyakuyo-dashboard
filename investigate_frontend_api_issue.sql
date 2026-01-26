-- INVESTIGATE WHY FRONTEND SHOWS WRONG CONVERSATION (messages exist in 18/19 conversations)

-- WHICH CONVERSATION IS MISSING MESSAGES?
SELECT
  'CONVERSATION MISSING MESSAGES:' as missing_check,
  conv.id as conversation_id,
  COALESCE(c.name, conv.customer_ref) as customer_identifier,
  conv.customer_type,
  conv.created_at,
  0 as message_count,
  'This conversation has NO messages!' as status
FROM conversations conv
LEFT JOIN customers c ON (
  CASE WHEN conv.customer_type::text = 'line' THEN c.line_user_id = conv.customer_ref
       ELSE c.id = conv.customer_ref::uuid END
)
LEFT JOIN messages m ON m.conversation_id = conv.id
WHERE conv.customer_type::text IN ('guest', 'line')
  AND m.id IS NULL
GROUP BY conv.id, c.name, conv.customer_ref, conv.customer_type, conv.created_at;

-- CHECK CONVERSATION LIST API RESPONSE STRUCTURE
SELECT
  'CONVERSATION LIST STRUCTURE CHECK:' as api_check,
  conv.id,
  COALESCE(c.name, conv.customer_ref) as customer_name,
  conv.customer_type,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message_at,
  MAX(m.content) as last_message_preview
FROM conversations conv
LEFT JOIN customers c ON (
  CASE WHEN conv.customer_type::text = 'line' THEN c.line_user_id = conv.customer_ref
       ELSE c.id = conv.customer_ref::uuid END
)
LEFT JOIN messages m ON m.conversation_id = conv.id
WHERE conv.customer_type::text IN ('guest', 'line')
GROUP BY conv.id, c.name, conv.customer_ref, conv.customer_type
ORDER BY MAX(COALESCE(m.created_at, conv.created_at)) DESC
LIMIT 10;

-- CHECK IF FRONTEND CONVERSATION SELECTION IS WRONG
SELECT
  'FRONTEND CONVERSATION SELECTION DIAGNOSTIC:' as frontend_check,
  'User sees these customers in list:' as user_experience,
  'Yhikh, Guest2, Alpha, ghttthhhaa, Amira, wapio, Aliipaa' as listed_customers,
  'But clicking any shows Yhikh messages' as problem,
  'Possible frontend bugs:' as analysis,
  '1. Wrong conversation ID passed to API' as bug1,
  '2. API returns wrong conversation data' as bug2,
  '3. Frontend state management issue' as bug3,
  '4. URL parameter not updating correctly' as bug4;

-- CHECK RECENT MESSAGE CREATION PATTERNS
SELECT
  'RECENT MESSAGE CREATION PATTERNS:' as message_flow,
  m.id as message_id,
  m.conversation_id,
  COALESCE(c.name, conv.customer_ref) as customer_name,
  m.sender_id,
  LEFT(m.content, 50) as content_preview,
  m.created_at,
  CASE
    WHEN m.sender_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a' THEN 'SENT by shop owner'
    ELSE 'RECEIVED from customer'
  END as direction
FROM messages m
JOIN conversations conv ON conv.id = m.conversation_id
LEFT JOIN customers c ON (
  CASE WHEN conv.customer_type::text = 'line' THEN c.line_user_id = conv.customer_ref
       ELSE c.id = conv.customer_ref::uuid END
)
ORDER BY m.created_at DESC
LIMIT 10;

-- CHECK IF YHIKH CONVERSATION IS BEING USED FOR NEW MESSAGES
SELECT
  'IS YHIKH GETTING ALL NEW MESSAGES?' as critical_check,
  conv.id as conversation_id,
  COALESCE(c.name, conv.customer_ref) as customer_name,
  COUNT(m.id) as total_messages,
  COUNT(CASE WHEN m.created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as messages_last_hour,
  MAX(m.created_at) as latest_message
FROM conversations conv
LEFT JOIN customers c ON (
  CASE WHEN conv.customer_type::text = 'line' THEN c.line_user_id = conv.customer_ref
       ELSE c.id = conv.customer_ref::uuid END
)
LEFT JOIN messages m ON m.conversation_id = conv.id
WHERE conv.customer_type::text IN ('guest', 'line')
  AND conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420' -- Yhikh's conversation
GROUP BY conv.id, c.name, conv.customer_ref;