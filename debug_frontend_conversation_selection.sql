-- DEBUG: Why frontend shows Yhikh messages for all customers

-- CHECK WHAT THE API SHOULD RETURN FOR DIFFERENT CONVERSATION IDs
SELECT
  'API RESPONSE CHECK FOR DIFFERENT CONVERSATIONS:' as debug,
  'Frontend should call: GET /api/internal-messaging/{conversationId}/messages' as expected_api_call,
  'Each conversationId should return different messages' as expected_behavior;

-- VERIFY DIFFERENT CONVERSATIONS HAVE DIFFERENT MESSAGES
SELECT
  'MESSAGES PER CONVERSATION (should be different):' as verification,
  conv.id as conversation_id,
  COALESCE(c.name, conv.customer_ref) as customer,
  COUNT(m.id) as message_count,
  STRING_AGG(LEFT(m.content, 20), '; ') as sample_messages
FROM conversations conv
LEFT JOIN customers c ON (
  CASE WHEN conv.customer_type::text = 'line' THEN c.line_user_id = conv.customer_ref
       ELSE c.id = conv.customer_ref::uuid END
)
LEFT JOIN messages m ON m.conversation_id = conv.id
WHERE conv.customer_type::text IN ('guest', 'line')
  AND conv.id IN ('b1178685-b981-4191-bf52-2ecad8d66420', 'f6049616-713f-4a97-82d6-aa30ff4f6dfb')
GROUP BY conv.id, c.name, conv.customer_ref
ORDER BY conv.created_at DESC;

-- CHECK IF FRONTEND HAS HARDCODED CONVERSATION ID
SELECT
  'FRONTEND DEBUGGING CHECKLIST:' as frontend_debug,
  '1. Check if selectedThread state updates on click' as check1,
  '2. Check if loadMessages() receives correct conversationId' as check2,
  '3. Check if API call uses the correct conversationId parameter' as check3,
  '4. Check if API response contains messages from correct conversation' as check4,
  '5. Check browser Network tab for actual API calls made' as check5;

-- POSSIBLE FRONTEND BUGS
SELECT
  'POSSIBLE FRONTEND BUGS:' as diagnosis,
  'BUG 1: selectedThread not updating on click' as bug1,
  'BUG 2: loadMessages called with wrong conversationId' as bug2,
  'BUG 3: API endpoint hardcoded to Yhikh conversation' as bug3,
  'BUG 4: State persistence issue (localStorage overriding)' as bug4,
  'BUG 5: URL parameter not updating on conversation change' as bug5;

-- CHECK FOR BACKEND BUG (API returning wrong messages)
SELECT
  'BACKEND API VERIFICATION:' as backend_check,
  'API should return different messages for different conversationIds' as expected,
  CASE
    WHEN (
      SELECT COUNT(DISTINCT conversation_id) FROM (
        SELECT m.conversation_id
        FROM messages m
        WHERE m.conversation_id IN (
          SELECT id FROM conversations WHERE customer_type::text IN ('guest', 'line') LIMIT 5
        )
        GROUP BY m.conversation_id
        HAVING COUNT(*) > 0
      ) t
    ) > 1
    THEN '✅ BACKEND CORRECT: Different conversations have different messages'
    ELSE '❌ BACKEND BUG: All conversations returning same messages'
  END as backend_status;