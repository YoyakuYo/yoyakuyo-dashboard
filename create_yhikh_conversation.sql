-- CREATE CONVERSATION FOR YHIKH GUEST CUSTOMER

-- Get Yhikh's customer details
SELECT
  'Creating conversation for Yhikh:' as action,
  c.id as customer_id,
  c.name,
  c.email,
  c.created_at as customer_created,
  'Will create conversation with customer_type=guest' as plan
FROM customers c
WHERE c.role = 'guest'
  AND c.name = 'Yhikh'
  AND c.email = 'yoyakuyodemo@gmail.com';

-- CREATE the conversation for Yhikh
INSERT INTO conversations (
  id,
  shop_id,
  customer_type,
  customer_ref,
  created_at,
  updated_at,
  last_message_at
)
SELECT
  gen_random_uuid() as id,
  s.id as shop_id,
  'guest'::customer_type_enum as customer_type,
  c.id::text as customer_ref,
  c.created_at as created_at,
  NOW() as updated_at,
  c.created_at as last_message_at
FROM customers c
CROSS JOIN shops s
WHERE c.role = 'guest'
  AND c.name = 'Yhikh'
  AND c.email = 'yoyakuyodemo@gmail.com'
  AND s.id = (
    SELECT shop_id FROM bookings
    WHERE customer_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  );

-- VERIFY the conversation was created
SELECT
  'Yhikh conversation verification:' as check,
  conv.id as conversation_id,
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

-- CHECK that Yhikh now appears in recent conversations
SELECT
  'Yhikh in recent conversations:' as final_check,
  conv.id,
  c.name,
  c.email,
  conv.created_at,
  conv.last_message_at,
  ROW_NUMBER() OVER (ORDER BY COALESCE(conv.last_message_at, conv.created_at) DESC) as recent_rank
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type::text = 'guest'
ORDER BY COALESCE(conv.last_message_at, conv.created_at) DESC
LIMIT 10;