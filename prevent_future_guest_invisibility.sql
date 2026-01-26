-- PREVENT FUTURE GUESTS FROM BEING INVISIBLE IN CONVERSATIONS

-- CHECK CURRENT GUEST CONVERSATION COVERAGE
SELECT
  'Current guest conversation coverage:' as analysis,
  (SELECT COUNT(*) FROM customers WHERE role = 'guest') as total_guests,
  (SELECT COUNT(DISTINCT conv.customer_ref)
   FROM conversations conv
   WHERE conv.customer_type::text = 'guest') as guests_with_conversations,
  ROUND(
    (SELECT COUNT(DISTINCT conv.customer_ref)
     FROM conversations conv
     WHERE conv.customer_type::text = 'guest')::decimal /
    (SELECT COUNT(*) FROM customers WHERE role = 'guest')::decimal * 100, 1
  ) || '%' as conversation_coverage;

-- FIND GUESTS WITHOUT CONVERSATIONS (like Yhikh was)
SELECT
  'Guests missing conversations (like Yhikh):' as problem_guests,
  c.id,
  c.name,
  c.email,
  c.created_at as customer_created,
  COUNT(b.id) as booking_count,
  MAX(b.created_at) as last_booking
FROM customers c
LEFT JOIN conversations conv ON conv.customer_ref = c.id::text AND conv.customer_type::text = 'guest'
LEFT JOIN bookings b ON b.customer_id = c.id
WHERE c.role = 'guest'
  AND conv.id IS NULL  -- No conversation
  AND b.id IS NOT NULL -- But has bookings
GROUP BY c.id, c.name, c.email, c.created_at
ORDER BY last_booking DESC;

-- SOLUTION: AUTO-CREATE CONVERSATIONS FOR ALL GUESTS WITH BOOKINGS
INSERT INTO conversations (
  id,
  type,
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
  'customer_owner',
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
LEFT JOIN conversations conv ON conv.customer_ref = c.id::text
  AND conv.customer_type::text = 'guest'
  AND conv.booking_id = b.id
WHERE c.role = 'guest'
  AND conv.id IS NULL  -- No conversation exists
  AND b.id IS NOT NULL -- Has bookings
  -- Use the most recent booking per customer
  AND b.id IN (
    SELECT DISTINCT ON (customer_id) id
    FROM bookings
    WHERE customer_id = c.id
    ORDER BY created_at DESC
  );

-- VERIFY ALL GUESTS NOW HAVE CONVERSATIONS
SELECT
  'After auto-creation - guest conversation coverage:' as final_check,
  (SELECT COUNT(*) FROM customers WHERE role = 'guest') as total_guests,
  (SELECT COUNT(DISTINCT conv.customer_ref)
   FROM conversations conv
   WHERE conv.customer_type::text = 'guest') as guests_with_conversations,
  ROUND(
    (SELECT COUNT(DISTINCT conv.customer_ref)
     FROM conversations conv
     WHERE conv.customer_type::text = 'guest')::decimal /
    (SELECT COUNT(*) FROM customers WHERE role = 'guest')::decimal * 100, 1
  ) || '%' as conversation_coverage,
  CASE
    WHEN (
      SELECT COUNT(DISTINCT conv.customer_ref)
      FROM conversations conv
      WHERE conv.customer_type::text = 'guest'
    ) = (
      SELECT COUNT(*) FROM customers WHERE role = 'guest'
    )
    THEN '✅ PERFECT: All guests have conversations!'
    ELSE '❌ Still missing some conversations'
  END as status;