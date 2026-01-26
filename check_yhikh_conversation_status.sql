-- CHECK YHIKH'S CONVERSATION STATUS AFTER UPDATE ATTEMPT

SELECT
  'Yhikh conversation current status:' as check,
  conv.id as conversation_id,
  conv.target_id as shop_id,
  CASE
    WHEN conv.target_id IS NOT NULL THEN '✅ HAS SHOP_ID: Mark-read should work now!'
    WHEN conv.target_id IS NULL THEN '❌ STILL MISSING SHOP_ID: Need to add it'
    ELSE 'Unknown status'
  END as status
FROM conversations conv
WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- IF STILL MISSING, FORCE UPDATE
UPDATE conversations
SET target_id = '0bfa803b-230e-4b80-872e-434c3cbfee7c'
WHERE id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- VERIFY THE FORCE UPDATE
SELECT
  'After force update:' as verification,
  conv.id,
  conv.target_id,
  CASE
    WHEN conv.target_id IS NOT NULL THEN '✅ SUCCESS: Shop ID added!'
    ELSE '❌ FAILED: Still no shop ID'
  END as final_status
FROM conversations conv
WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420';