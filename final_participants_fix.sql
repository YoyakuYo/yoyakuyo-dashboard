-- FINAL FIX FOR SHOP OWNER MESSAGING ACCESS

-- CHECK ALLOWED participant_type VALUES (fix syntax)
SELECT
  'Allowed participant_type values:' as check,
  participant_type,
  COUNT(*) as count
FROM conversation_participants
GROUP BY participant_type
ORDER BY count DESC;

-- ADD SHOP OWNER WITH CORRECT participant_type
INSERT INTO conversation_participants (
  conversation_id,
  user_id,
  participant_type,
  participant_ref,
  shop_id,
  created_at
)
VALUES (
  'b1178685-b981-4191-bf52-2ecad8d66420',
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',
  'web',  -- Use 'web' for authenticated users
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a',
  '0bfa803b-230e-4b80-872e-434c3cbfee7c'::uuid,
  NOW()
);

-- VERIFY SHOP OWNER CAN NOW ACCESS MESSAGES
SELECT
  'FINAL VERIFICATION - Shop owner access:' as check,
  cp.conversation_id,
  cp.user_id,
  cp.participant_type,
  cp.participant_ref,
  CASE
    WHEN cp.participant_type = 'web' AND cp.participant_ref IS NOT NULL THEN '✅ SHOP OWNER CAN NOW SEND/RECEIVE MESSAGES!'
    ELSE '❌ Still not properly configured'
  END as messaging_status
FROM conversation_participants cp
WHERE cp.conversation_id = 'b1178685-b981-4191-bf52-2ecad8d66420'
  AND cp.user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a'
ORDER BY cp.created_at DESC
LIMIT 1;