-- CHECK WHY SHOP OWNER CANNOT SEND MESSAGES TO YHIKH

-- CHECK YHIKH'S CONVERSATION DETAILS
SELECT
  'Yhikh conversation details:' as check,
  conv.id as conversation_id,
  conv.conversation_type,
  conv.target_type,
  conv.target_id as shop_id,
  conv.customer_type,
  conv.customer_ref,
  c.name as customer_name,
  CASE
    WHEN conv.target_id IS NULL THEN '❌ PROBLEM: No shop_id in conversation!'
    ELSE '✅ Has shop_id'
  END as shop_id_status
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- CHECK IF THE SHOP EXISTS AND WHO OWNS IT
SELECT
  'Shop ownership check:' as check,
  s.id as shop_id,
  s.name as shop_name,
  s.owner_user_id,
  CASE
    WHEN s.owner_user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a' THEN '✅ MATCH: User is shop owner'
    WHEN s.owner_user_id IS NULL THEN '❌ PROBLEM: Shop has no owner!'
    ELSE '❌ MISMATCH: User is not shop owner'
  END as ownership_status
FROM shops s
WHERE s.id = (
  SELECT target_id
  FROM conversations
  WHERE id = 'b1178685-b981-4191-bf52-2ecad8d66420'
);

-- CHECK USER IDENTITY DETAILS
SELECT
  'User authorization details:' as check,
  'User ID from error:' as source,
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a' as user_id,
  CASE
    WHEN EXISTS (SELECT 1 FROM shops WHERE owner_user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a') THEN '✅ User is a shop owner'
    ELSE '❌ User is not a shop owner'
  END as user_status;

-- DIAGNOSIS SUMMARY
SELECT
  'AUTHORIZATION DIAGNOSIS:' as summary,
  CASE
    WHEN (
      SELECT target_id FROM conversations WHERE id = 'b1178685-b981-4191-bf52-2ecad8d66420'
    ) IS NULL THEN '❌ ISSUE: Conversation has no shop_id'
    WHEN (
      SELECT owner_user_id FROM shops WHERE id = (
        SELECT target_id FROM conversations WHERE id = 'b1178685-b981-4191-bf52-2ecad8d66420'
      )
    ) IS NULL THEN '❌ ISSUE: Shop has no owner'
    WHEN (
      SELECT owner_user_id FROM shops WHERE id = (
        SELECT target_id FROM conversations WHERE id = 'b1178685-b981-4191-bf52-2ecad8d66420'
      )
    ) != 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a' THEN '❌ ISSUE: User is not the shop owner'
    ELSE '✅ SHOULD WORK: All authorization checks should pass'
  END as diagnosis;

-- IF SHOP_ID IS MISSING, FIX IT
UPDATE conversations
SET target_id = (
  SELECT shop_id FROM bookings
  WHERE customer_id = (
    SELECT customer_ref::uuid FROM conversations WHERE id = 'b1178685-b981-4191-bf52-2ecad8d66420'
  )
  ORDER BY created_at DESC
  LIMIT 1
)
WHERE id = 'b1178685-b981-4191-bf52-2ecad8d66420'
  AND target_id IS NULL;