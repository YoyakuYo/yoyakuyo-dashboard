-- CHECK PARTICIPANTS TABLE STRUCTURE AND FIX COLUMN NAME ISSUE
SELECT
  'Participants table structure:' as check,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'participants'
ORDER BY ordinal_position;

-- SEE SAMPLE PARTICIPANTS DATA
SELECT
  'Sample participants data:' as check,
  *
FROM participants
LIMIT 3;

-- FIX: ADD SHOP OWNER AS PARTICIPANT WITH CORRECT COLUMN NAMES
INSERT INTO participants (conversation_id, user_id, role, created_at)
VALUES (
  'b1178685-b981-4191-bf52-2ecad8d66420',
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',
  'owner',
  NOW()
)
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- VERIFY THE FIX WORKED
SELECT
  'Yhikh conversation participants after fix:' as verification,
  p.conversation_id,
  p.user_id,
  p.role,
  p.created_at,
  CASE
    WHEN p.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a' THEN '✅ SHOP OWNER - CAN SEND MESSAGES!'
    ELSE 'Other participant'
  END as status
FROM participants p
WHERE p.conversation_id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- AUTOMATIC PARTICIPANT CREATION FOR FUTURE CONVERSATIONS
-- This should be added to the conversation creation process
SELECT
  'RECOMMENDATION: Auto-add shop owner to new conversations' as improvement,
  'Modify conversation creation to automatically add shop owner as participant' as action,
  'Every new conversation should include shop owner participant' as benefit;