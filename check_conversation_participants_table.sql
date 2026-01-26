-- CHECK THE CORRECT PARTICIPANTS TABLE
SELECT
  'conversation_participants table structure:' as check,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conversation_participants'
ORDER BY ordinal_position;

-- SEE WHAT PARTICIPANTS EXIST FOR YHIKH'S CONVERSATION
SELECT
  'Current participants in Yhikh conversation:' as check,
  cp.conversation_id,
  cp.user_id,
  cp.line_user_id,
  cp.shop_id,
  cp.participant_type,
  cp.created_at
FROM conversation_participants cp
WHERE cp.conversation_id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- ADD SHOP OWNER TO CONVERSATION_PARTICIPANTS
INSERT INTO conversation_participants (
  conversation_id,
  user_id,
  participant_type,
  shop_id,
  created_at
) VALUES (
  'b1178685-b981-4191-bf52-2ecad8d66420',
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',
  'owner',
  (SELECT conv.target_id::uuid FROM conversations conv WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420'),
  NOW()
)
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- VERIFY SHOP OWNER IS NOW A PARTICIPANT
SELECT
  'After adding shop owner:' as verification,
  cp.conversation_id,
  cp.user_id,
  cp.participant_type,
  CASE
    WHEN cp.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a' THEN '✅ SHOP OWNER CAN NOW VIEW MESSAGES!'
    ELSE 'Other participant'
  END as status
FROM conversation_participants cp
WHERE cp.conversation_id = 'b1178685-b981-4191-bf52-2ecad8d66420';