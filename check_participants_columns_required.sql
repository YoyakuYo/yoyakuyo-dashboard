-- CHECK EXACT REQUIRED COLUMNS FOR conversation_participants
SELECT
  'conversation_participants table - REQUIRED columns:' as check,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conversation_participants'
  AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- SEE WHAT participant_ref SHOULD BE (probably the user_id or customer_id)
SELECT
  'What participant_ref should contain:' as analysis,
  'For shop owners: user_id (c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a)' as owner_ref,
  'For customers: customer_id or line_user_id' as customer_ref,
  'The column stores the participant identifier' as explanation;

-- INSERT WITH participant_ref FILLED CORRECTLY
INSERT INTO conversation_participants (
  conversation_id,
  user_id,
  participant_type,
  participant_ref,  -- REQUIRED column
  shop_id,
  created_at
)
VALUES (
  'b1178685-b981-4191-bf52-2ecad8d66420',
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',
  'owner',
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',  -- participant_ref = user_id for owners
  '0bfa803b-230e-4b80-872e-434c3cbfee7c'::uuid,
  NOW()
);

-- VERIFY THE INSERT WORKED
SELECT
  'Yhikh conversation participants after fix:' as verification,
  cp.conversation_id,
  cp.user_id,
  cp.participant_type,
  cp.participant_ref,
  CASE
    WHEN cp.participant_ref IS NOT NULL THEN '✅ ALL REQUIRED FIELDS FILLED!'
    ELSE '❌ Still missing required fields'
  END as status
FROM conversation_participants cp
WHERE cp.conversation_id = 'b1178685-b981-4191-bf52-2ecad8d66420';