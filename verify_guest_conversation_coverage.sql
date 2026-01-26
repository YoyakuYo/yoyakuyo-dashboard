-- VERIFY ALL GUESTS NOW HAVE CONVERSATIONS

SELECT
  'FINAL GUEST CONVERSATION COVERAGE:' as verification,
  (SELECT COUNT(*) FROM customers WHERE role = 'guest') as total_guests,
  (SELECT COUNT(DISTINCT conv.customer_ref)
   FROM conversations conv
   WHERE conv.customer_type::text = 'guest') as guests_with_conversations,
  ROUND(
    (SELECT COUNT(DISTINCT conv.customer_ref)
     FROM conversations conv
     WHERE conv.customer_type::text = 'guest')::decimal /
    NULLIF((SELECT COUNT(*) FROM customers WHERE role = 'guest'), 0)::decimal * 100, 1
  ) || '%' as coverage_percentage,
  CASE
    WHEN (
      SELECT COUNT(DISTINCT conv.customer_ref)
      FROM conversations conv
      WHERE conv.customer_type::text = 'guest'
    ) = (
      SELECT COUNT(*) FROM customers WHERE role = 'guest'
    )
    THEN '🎉 PERFECT: 100% coverage - no invisible guests!'
    ELSE '⚠️ INCOMPLETE: Some guests still missing conversations'
  END as status;

-- SHOW ANY REMAINING GUESTS WITHOUT CONVERSATIONS
SELECT
  'Remaining invisible guests (should be 0):' as check,
  c.id,
  c.name,
  c.email,
  c.created_at,
  COUNT(b.id) as bookings_count
FROM customers c
LEFT JOIN conversations conv ON conv.customer_ref = c.id::text AND conv.customer_type::text = 'guest'
LEFT JOIN bookings b ON b.customer_id = c.id
WHERE c.role = 'guest'
  AND conv.id IS NULL
GROUP BY c.id, c.name, c.email, c.created_at
HAVING COUNT(b.id) > 0  -- Only show guests with bookings
ORDER BY c.created_at DESC;

-- CONFIRM YHIKH IS NOW VISIBLE
SELECT
  'Yhikh visibility confirmation:' as final_check,
  conv.id as conversation_id,
  c.name,
  c.email,
  conv.created_at,
  '✅ Yhikh is now visible to shop owners!' as status
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type::text = 'guest'
  AND c.name = 'Yhikh'
  AND c.email = 'yoyakuyodemo@gmail.com';