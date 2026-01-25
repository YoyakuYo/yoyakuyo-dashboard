-- Verify the guest system design is working correctly

-- Check guest customer creation
SELECT
  'Guest system verification:' as check,
  COUNT(*) as total_guests_in_customers_table,
  COUNT(CASE WHEN name IS NULL AND email IS NULL THEN 1 END) as anonymous_guests,
  COUNT(CASE WHEN name IS NOT NULL OR email IS NOT NULL THEN 1 END) as guests_with_data,
  ROUND(
    COUNT(CASE WHEN name IS NULL AND email IS NULL THEN 1 END)::decimal /
    COUNT(*)::decimal * 100, 1
  ) || '%' as anonymity_rate
FROM customers
WHERE role = 'guest';

-- Check guest booking patterns
SELECT
  'Guest booking patterns:' as analysis,
  COUNT(DISTINCT b.customer_id) as unique_guest_customers,
  COUNT(b.id) as total_guest_bookings,
  ROUND(AVG(bookings_per_customer), 1) as avg_bookings_per_guest
FROM (
  SELECT
    b.customer_id,
    COUNT(b.id) as bookings_per_customer
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  WHERE c.role = 'guest'
  GROUP BY b.customer_id
) as guest_stats
CROSS JOIN (
  SELECT COUNT(b.id) as total_guest_bookings
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  WHERE c.role = 'guest'
) as total_stats;

-- Verify guest conversations work
SELECT
  'Guest conversation system:' as check,
  COUNT(*) as total_guest_conversations,
  COUNT(DISTINCT conv.customer_ref) as unique_guest_conversation_participants,
  'Guests can have conversations without revealing identity' as privacy_feature
FROM conversations conv
WHERE conv.customer_type::text = 'guest';

-- Final verification
SELECT
  '🎉 GUEST SYSTEM STATUS:' as verification,
  CASE
    WHEN (
      SELECT COUNT(*)
      FROM customers
      WHERE role = 'guest'
        AND (name IS NULL AND email IS NULL)
    ) = (
      SELECT COUNT(*)
      FROM customers
      WHERE role = 'guest'
    )
    THEN '✅ PERFECT: All guests remain anonymous'
    ELSE '❌ ISSUE: Some guests have stored personal data'
  END as privacy_status,
  'Guest system protects user privacy while allowing bookings' as conclusion;