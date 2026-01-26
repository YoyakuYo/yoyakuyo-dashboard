-- CHECK WHY MARK-READ API CAN'T FIND YHIKH'S CONVERSATION

-- CHECK IF YHIKH'S CONVERSATION EXISTS
SELECT
  'Yhikh conversation exists check:' as check,
  conv.id,
  conv.conversation_type,
  conv.target_type,
  conv.target_id,
  conv.customer_type,
  conv.customer_ref,
  CASE
    WHEN conv.id IS NOT NULL THEN '✅ Conversation exists in database'
    ELSE '❌ Conversation does NOT exist'
  END as status
FROM conversations conv
WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- CHECK WHAT THE MARK-READ API IS LOOKING FOR
-- The API query: .select('id, conversation_type, customer_type, customer_ref, shop_id')
SELECT
  'What mark-read API expects to find:' as api_check,
  conv.id,
  conv.conversation_type,
  conv.customer_type,
  conv.customer_ref,
  conv.target_id as shop_id_from_target_id,
  s.owner_user_id,
  CASE
    WHEN conv.id IS NOT NULL AND s.owner_user_id IS NOT NULL THEN '✅ API should find this conversation'
    ELSE '❌ API query will fail'
  END as api_status
FROM conversations conv
LEFT JOIN shops s ON s.id = conv.target_id::uuid
WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- CHECK IF CONVERSATION HAS MESSAGES
SELECT
  'Yhikh conversation messages:' as messages_check,
  COUNT(m.id) as message_count,
  COUNT(CASE WHEN m.is_read = false THEN 1 END) as unread_messages,
  MAX(m.created_at) as latest_message
FROM messages m
WHERE m.conversation_id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- CHECK API QUERY SIMULATION
-- The API does: .eq('id', id)
SELECT
  'API query simulation (.eq id):' as simulation,
  conv.id,
  CASE
    WHEN conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420' THEN '✅ API query should find this'
    ELSE '❌ API query will miss this'
  END as query_result
FROM conversations conv
WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- CHECK IF THERE'S A shop_id vs target_id ISSUE
-- API expects: shop_id field
-- Database has: target_id field
SELECT
  'shop_id vs target_id field check:' as field_check,
  conv.id,
  conv.target_id as database_target_id,
  CASE
    WHEN conv.target_id IS NOT NULL THEN 'Database has target_id (correct)'
    ELSE 'Database missing target_id'
  END as database_status,
  'API expects shop_id field' as api_expects,
  CASE
    WHEN conv.target_id IS NOT NULL THEN '✅ Field mapping should work'
    ELSE '❌ Field mapping will fail'
  END as api_compatibility;