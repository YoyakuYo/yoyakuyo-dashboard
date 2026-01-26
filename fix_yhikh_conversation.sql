-- FIX: Create conversation for Yhikh with ALL required columns

-- Check conversations table structure
SELECT
  'Conversations table required columns:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conversations'
ORDER BY ordinal_position;

-- Get Yhikh's booking details for conversation creation
SELECT
  'Yhikh booking details for conversation:' as setup,
  c.id as customer_id,
  c.name,
  c.email,
  b.id as booking_id,
  b.shop_id,
  b.created_at as booking_created
FROM customers c
JOIN bookings b ON b.customer_id = c.id
WHERE c.role = 'guest'
  AND c.name = 'Yhikh'
  AND c.email = 'yoyakuyodemo@gmail.com'
ORDER BY b.created_at DESC
LIMIT 1;

-- CREATE conversation with ALL required columns
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
LIMIT 1
ON CONFLICT (conversation_type, target_type, target_id, customer_ref, booking_id)
DO NOTHING;

-- VERIFY the conversation was created successfully
SELECT
  'Yhikh conversation verification:' as check,
  conv.id,
  conv.conversation_type,
  conv.target_type,
  conv.target_id,
  conv.booking_id,
  conv.customer_type,
  conv.customer_ref,
  c.name,
  c.email,
  conv.created_at,
  CASE
    WHEN conv.id IS NOT NULL THEN '✅ SUCCESS: Yhikh conversation created!'
    ELSE '❌ FAILED: Conversation creation failed'
  END as status
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type::text = 'guest'
  AND c.name = 'Yhikh'
  AND c.email = 'yoyakuyodemo@gmail.com';

-- CHECK that Yhikh now appears in owner conversations
SELECT
  'Yhikh in owner conversations list:' as final_verification,
  conv.id as conversation_id,
  c.name as customer_name,
  c.email as customer_email,
  conv.created_at,
  conv.last_message_at,
  'Yhikh should now be visible to shop owners!' as result
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type::text = 'guest'
  AND c.name = 'Yhikh'
  AND c.email = 'yoyakuyodemo@gmail.com';