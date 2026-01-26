-- CREATE CONVERSATION FOR YHIKH - FINAL VERSION

-- Check if conversation already exists first
SELECT
  'Checking if Yhikh already has conversation:' as pre_check,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM conversations conv
      LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
      WHERE conv.customer_type::text = 'guest'
      AND c.name = 'Yhikh'
      AND c.email = 'yoyakuyodemo@gmail.com'
    )
    THEN '⚠️ Conversation already exists - skipping creation'
    ELSE '✅ No conversation found - will create one'
  END as status;

-- CREATE conversation for Yhikh with ALL required columns
INSERT INTO conversations (
  id,
  conversation_type,
  target_type,
  target_id,
  booking_id,
  customer_type,
  customer_ref,
  created_at,
  last_message_at
)
SELECT
  gen_random_uuid(),
  'booking_owner'::conversation_type_enum,
  'shop'::target_type_enum,
  b.shop_id::text,
  b.id,
  'guest'::customer_type_enum,
  c.id::text,
  c.created_at,
  c.created_at
FROM customers c
JOIN bookings b ON b.customer_id = c.id
WHERE c.role = 'guest'
  AND c.name = 'Yhikh'
  AND c.email = 'yoyakuyodemo@gmail.com'
ORDER BY b.created_at DESC
LIMIT 1;

-- VERIFY the conversation was created
SELECT
  'Yhikh conversation verification:' as check,
  conv.id as conversation_id,
  conv.conversation_type,
  conv.target_type,
  conv.target_id,
  conv.customer_type,
  conv.customer_ref,
  c.name as customer_name,
  c.email as customer_email,
  conv.created_at,
  CASE
    WHEN conv.id IS NOT NULL THEN '✅ SUCCESS: Yhikh conversation created!'
    ELSE '❌ FAILED: Conversation not created'
  END as status
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type::text = 'guest'
  AND c.name = 'Yhikh'
  AND c.email = 'yoyakuyodemo@gmail.com';

-- FINAL CHECK: Yhikh in conversations list
SELECT
  'Yhikh in owner conversations:' as final_verification,
  conv.id,
  c.name,
  c.email,
  conv.created_at,
  conv.last_message_at,
  'Yhikh should now appear in owner messaging interface!' as result
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type::text = 'guest'
  AND c.name = 'Yhikh'
  AND c.email = 'yoyakuyodemo@gmail.com';