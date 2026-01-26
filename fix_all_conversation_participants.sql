-- FIX: Add shop owner to ALL conversation_participants tables

-- CHECK HOW MANY CONVERSATIONS ARE MISSING SHOP OWNER
SELECT
  'Conversations missing shop owner in participants:' as check,
  COUNT(*) as total_conversations,
  COUNT(CASE WHEN cp.id IS NULL THEN 1 END) as missing_shop_owner,
  ROUND(
    COUNT(CASE WHEN cp.id IS NULL THEN 1 END)::decimal /
    COUNT(*)::decimal * 100, 1
  ) || '%' as missing_percentage
FROM conversations conv
LEFT JOIN conversation_participants cp ON cp.conversation_id = conv.id
  AND cp.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a'
WHERE conv.target_type::text = 'shop';

-- ADD SHOP OWNER TO ALL CONVERSATIONS MISSING THEM
INSERT INTO conversation_participants (
  conversation_id,
  user_id,
  participant_type,
  shop_id,
  created_at
)
SELECT
  conv.id,
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',
  'owner',
  conv.target_id::uuid,
  NOW()
FROM conversations conv
LEFT JOIN conversation_participants cp ON cp.conversation_id = conv.id
  AND cp.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a'
WHERE conv.target_type::text = 'shop'
  AND cp.id IS NULL  -- Shop owner not a participant
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- VERIFY ALL CONVERSATIONS NOW HAVE SHOP OWNER
SELECT
  'After bulk fix - shop owner participation:' as verification,
  COUNT(*) as total_conversations,
  COUNT(CASE WHEN cp.id IS NOT NULL THEN 1 END) as with_shop_owner,
  ROUND(
    COUNT(CASE WHEN cp.id IS NOT NULL THEN 1 END)::decimal /
    COUNT(*)::decimal * 100, 1
  ) || '%' as participation_rate,
  CASE
    WHEN COUNT(CASE WHEN cp.id IS NOT NULL THEN 1 END) = COUNT(*)
    THEN '🎉 PERFECT: Shop owner can message ALL customers!'
    ELSE '⚠️ WARNING: Some conversations still missing shop owner'
  END as status
FROM conversations conv
LEFT JOIN conversation_participants cp ON cp.conversation_id = conv.id
  AND cp.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a'
WHERE conv.target_type::text = 'shop';

-- CHECK SPECIFIC CONVERSATIONS (YHIKH + A FEW OTHERS)
SELECT
  'Specific conversations check:' as sample,
  conv.id as conversation_id,
  c.name as customer_name,
  conv.customer_type,
  CASE
    WHEN cp.id IS NOT NULL THEN '✅ Has shop owner participant'
    ELSE '❌ MISSING shop owner participant'
  END as shop_owner_access
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
LEFT JOIN conversation_participants cp ON cp.conversation_id = conv.id
  AND cp.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a'
WHERE conv.customer_type::text IN ('guest', 'line')
  AND conv.id IN (
    'b1178685-b981-4191-bf52-2ecad8d66420',  -- Yhikh
    (SELECT conv.id FROM conversations conv
     LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
     WHERE conv.customer_type::text = 'line'
     LIMIT 1)  -- One LINE customer
  );