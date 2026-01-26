-- Find the Yhikh guest customer and see why they're missing from conversations list

-- Search for Yhikh in customers table
SELECT
  'Yhikh guest customer search:' as investigation,
  c.id,
  c.name,
  c.email,
  c.role,
  c.created_at,
  CASE
    WHEN c.name = 'Yhikh' AND c.email = 'yoyakuyodemo@gmail.com' THEN '✅ FOUND: This is the Yhikh customer!'
    WHEN c.name ILIKE '%yhikh%' THEN '⚠️ Similar name found'
    ELSE 'Not Yhikh'
  END as match_status
FROM customers c
WHERE c.role = 'guest'
  AND (c.name ILIKE '%yhikh%' OR c.email ILIKE '%yoyakuyodemo%')
ORDER BY c.created_at DESC;

-- Check if Yhikh has any bookings
SELECT
  'Yhikh booking check:' as check,
  b.id as booking_id,
  b.customer_id,
  c.name,
  c.email,
  b.status,
  b.created_at as booking_date,
  b.date as service_date,
  b.start_time
FROM bookings b
JOIN customers c ON c.id = b.customer_id
WHERE c.role = 'guest'
  AND (c.name = 'Yhikh' OR c.email = 'yoyakuyodemo@gmail.com')
ORDER BY b.created_at DESC;

-- Check if Yhikh has any conversations
SELECT
  'Yhikh conversation check:' as check,
  conv.id as conversation_id,
  conv.customer_type,
  conv.customer_ref,
  c.name as customer_name,
  c.email as customer_email,
  conv.created_at as conversation_started,
  conv.last_message_at
FROM conversations conv
LEFT JOIN customers c ON (
  CASE WHEN conv.customer_type::text = 'line' THEN c.line_user_id = conv.customer_ref
       ELSE c.id = conv.customer_ref::uuid END
)
WHERE (c.name = 'Yhikh' AND c.email = 'yoyakuyodemo@gmail.com')
   OR conv.customer_ref = (
     SELECT id FROM customers
     WHERE role = 'guest' AND name = 'Yhikh' AND email = 'yoyakuyodemo@gmail.com'
   )::text;

-- If Yhikh exists but has no conversation, check when they should have one
SELECT
  'Yhikh conversation creation check:' as analysis,
  c.id,
  c.name,
  c.email,
  c.created_at as customer_created,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM bookings b WHERE b.customer_id = c.id
    ) THEN 'Has bookings - should have conversation'
    ELSE 'No bookings yet'
  END as should_have_conversation,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM conversations conv WHERE conv.customer_ref = c.id::text AND conv.customer_type::text = 'guest'
    ) THEN '✅ Has conversation'
    ELSE '❌ MISSING: No conversation found!'
  END as conversation_status
FROM customers c
WHERE c.role = 'guest'
  AND c.name = 'Yhikh'
  AND c.email = 'yoyakuyodemo@gmail.com';

-- Check recent guest activity to see if Yhikh should be in recent conversations
SELECT
  'Recent guest conversations (last 10):' as recent_check,
  conv.id,
  c.name,
  c.email,
  conv.created_at,
  conv.last_message_at
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type::text = 'guest'
ORDER BY COALESCE(conv.last_message_at, conv.created_at) DESC
LIMIT 10;