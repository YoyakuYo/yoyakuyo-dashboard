-- FIX: Shop owner cannot send messages - not a participant in conversation

-- CHECK PARTICIPANTS TABLE STRUCTURE
SELECT
  'Participants table structure:' as check,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'participants'
ORDER BY ordinal_position;

-- CHECK IF SHOP OWNER IS PARTICIPANT IN YHIKH'S CONVERSATION
SELECT
  'Yhikh conversation participants check:' as diagnosis,
  conv.id as conversation_id,
  conv.customer_type,
  conv.customer_ref,
  c.name as customer_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM participants p
      WHERE p.conversation_id = conv.id
      AND p.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a'
    )
    THEN '✅ Shop owner IS a participant'
    ELSE '❌ Shop owner NOT a participant - cannot send messages!'
  END as shop_owner_participation,
  (SELECT COUNT(*) FROM participants p WHERE p.conversation_id = conv.id) as total_participants
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- CHECK WHAT PARTICIPANTS EXIST IN YHIKH'S CONVERSATION
SELECT
  'Current participants in Yhikh conversation:' as participants_check,
  p.conversation_id,
  p.user_id,
  p.role,
  p.created_at,
  CASE
    WHEN p.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a' THEN 'SHOP OWNER'
    WHEN p.user_id = conv.customer_ref::uuid THEN 'GUEST CUSTOMER'
    ELSE 'OTHER'
  END as participant_type
FROM participants p
JOIN conversations conv ON conv.id = p.conversation_id
WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- ADD SHOP OWNER AS PARTICIPANT IN YHIKH'S CONVERSATION
INSERT INTO participants (conversation_id, user_id, role, created_at)
VALUES (
  'b1178685-b981-4191-bf52-2ecad8d66420',
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',
  'owner',
  NOW()
)
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- VERIFY SHOP OWNER IS NOW A PARTICIPANT
SELECT
  'After fix - Yhikh conversation participants:' as verification,
  p.conversation_id,
  p.user_id,
  p.role,
  CASE
    WHEN p.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a' THEN '✅ SHOP OWNER - can now send messages!'
    WHEN p.user_id::text = conv.customer_ref THEN 'GUEST CUSTOMER'
    ELSE 'OTHER'
  END as participant_type
FROM participants p
JOIN conversations conv ON conv.id = p.conversation_id
WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- GENERAL FIX: ENSURE ALL CONVERSATIONS HAVE SHOP OWNER AS PARTICIPANT
INSERT INTO participants (conversation_id, user_id, role, created_at)
SELECT
  conv.id,
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',
  'owner',
  NOW()
FROM conversations conv
LEFT JOIN participants p ON p.conversation_id = conv.id
  AND p.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a'
WHERE p.id IS NULL  -- Shop owner not a participant
  AND conv.target_type::text = 'shop'
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- FINAL VERIFICATION: SHOP OWNER PARTICIPATION IN ALL CONVERSATIONS
SELECT
  'Final verification - shop owner participation:' as summary,
  COUNT(*) as total_conversations,
  COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as conversations_with_shop_owner,
  ROUND(
    COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END)::decimal /
    COUNT(*)::decimal * 100, 1
  ) || '%' as shop_owner_participation_rate,
  CASE
    WHEN COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) = COUNT(*)
    THEN '🎉 PERFECT: Shop owner can send messages to ALL conversations!'
    ELSE '⚠️ INCOMPLETE: Some conversations still missing shop owner'
  END as messaging_status
FROM conversations conv
LEFT JOIN participants p ON p.conversation_id = conv.id
  AND p.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a'
WHERE conv.target_type::text = 'shop';