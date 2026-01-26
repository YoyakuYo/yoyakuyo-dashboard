-- CREATE CONVERSATION FOR YHIKH - WITH BOTH TYPE COLUMNS

-- CREATE conversation setting BOTH type columns
INSERT INTO conversations (
  id,
  type,  -- OLD column (NOT NULL)
  conversation_type,  -- NEW column
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
  'customer_owner',  -- Set OLD type column
  'booking_owner'::conversation_type_enum,  -- Set NEW conversation_type column
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

-- VERIFY Yhikh conversation created with both type columns
SELECT
  'Yhikh conversation verification:' as check,
  conv.id,
  conv.type as old_type,
  conv.conversation_type as new_type,
  conv.target_type,
  conv.target_id,
  conv.customer_type,
  conv.customer_ref,
  c.name,
  c.email,
  CASE
    WHEN conv.id IS NOT NULL AND conv.type IS NOT NULL THEN '✅ SUCCESS: Yhikh conversation created!'
    ELSE '❌ FAILED: Missing required columns'
  END as status
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type::text = 'guest'
  AND c.name = 'Yhikh'
  AND c.email = 'yoyakuyodemo@gmail.com';

-- FINAL CHECK: Yhikh in owner conversations
SELECT
  'Yhikh now visible in owner messaging:' as final_result,
  conv.id,
  c.name,
  c.email,
  conv.created_at,
  'Yhikh should now appear in the conversations list!' as result
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type::text = 'guest'
  AND c.name = 'Yhikh'
  AND c.email = 'yoyakuyodemo@gmail.com';