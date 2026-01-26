-- FINAL FIX: Enable shop owner to send messages to Yhikh
-- FIXED: Proper type casting to avoid UUID/TEXT errors

-- CHECK CURRENT AUTHORIZATION STATUS WITH PROPER CASTING
SELECT
  'FINAL YHIKH AUTHORIZATION CHECK:' as diagnosis,
  conv.id as conversation_id,
  conv.target_id::uuid as shop_id,
  s.owner_user_id,
  'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a' as user_id,
  CASE
    WHEN conv.target_id IS NULL THEN '❌ BLOCKED: No shop_id'
    WHEN s.id IS NULL THEN '❌ BLOCKED: Shop does not exist'
    WHEN s.owner_user_id IS NULL THEN '❌ BLOCKED: Shop has no owner'
    WHEN s.owner_user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a' THEN '✅ ALLOWED: User is shop owner'
    ELSE '❌ BLOCKED: User is not shop owner'
  END as authorization_status
FROM conversations conv
LEFT JOIN shops s ON s.id = conv.target_id::uuid
WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420';

-- FIX: SET CORRECT SHOP_ID IF MISSING (with proper casting)
UPDATE conversations
SET target_id = (
  SELECT b.shop_id::text
  FROM bookings b
  WHERE b.customer_id = (
    SELECT conv.customer_ref::uuid
    FROM conversations conv
    WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420'
  )
  ORDER BY b.created_at DESC
  LIMIT 1
)
WHERE id = 'b1178685-b981-4191-bf52-2ecad8d66420'
  AND target_id IS NULL;

-- VERIFY SHOP OWNERSHIP MATCHES
SELECT
  'SHOP OWNERSHIP VERIFICATION:' as check,
  s.id as shop_id,
  s.name as shop_name,
  s.owner_user_id,
  CASE
    WHEN s.owner_user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a' THEN '✅ CONFIRMED: User owns this shop'
    ELSE '❌ ERROR: User does not own this shop'
  END as ownership_status
FROM shops s
WHERE s.id = (
  SELECT conv.target_id::uuid
  FROM conversations conv
  WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420'
);

-- FINAL CONFIRMATION
SELECT
  '🎉 FINAL STATUS - SHOP OWNER CAN SEND MESSAGES:' as result,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM conversations conv
      JOIN shops s ON s.id = conv.target_id::uuid
      WHERE conv.id = 'b1178685-b981-4191-bf52-2ecad8d66420'
      AND s.owner_user_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a'
    ) THEN '✅ SUCCESS: Authorization fixed - try sending message now!'
    ELSE '❌ FAILED: Still blocked'
  END as messaging_status;