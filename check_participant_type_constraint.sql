-- CHECK WHAT VALUES ARE ALLOWED FOR participant_type
SELECT
  'Check constraint on participant_type:' as constraint_check,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = (
  SELECT oid FROM pg_class
  WHERE relname = 'conversation_participants'
) AND conname LIKE '%participant_type%';

-- SEE WHAT participant_type VALUES EXIST IN THE TABLE
SELECT
  'Existing participant_type values:' as existing_values,
  DISTINCT participant_type,
  COUNT(*) as count
FROM conversation_participants
GROUP BY participant_type;

-- FIND THE CORRECT participant_type VALUE FOR SHOP OWNERS
SELECT
  'What participant_type should shop owners use?' as question,
  'Looking at existing data to find the correct value...' as analysis;

-- TRY WITH A DIFFERENT participant_type VALUE
-- Based on the constraint, 'owner' might not be allowed
-- Try 'web' or check what the API expects
INSERT INTO conversation_participants (
  conversation_id,
  user_id,
  participant_type,  -- Try different value
  participant_ref,
  shop_id,
  created_at
)
VALUES (
  'b1178685-b981-4191-bf52-2ecad8d66420',
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',
  'web',  -- Try 'web' instead of 'owner'
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',
  '0bfa803b-230e-4b80-872e-434c3cbfee7c'::uuid,
  NOW()
);

-- VERIFY THE CORRECT participant_type
SELECT
  'Check if web worked:' as test,
  cp.participant_type,
  cp.user_id
FROM conversation_participants cp
WHERE cp.conversation_id = 'b1178685-b981-4191-bf52-2ecad8d66420'
ORDER BY cp.created_at DESC
LIMIT 1;