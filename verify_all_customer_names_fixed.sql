-- Final verification: Check all bookings will show correct customer names

SELECT 
  b.id as booking_id,
  b.source,
  b.status,
  b.date,
  c.role as customer_role,
  -- Current name in customers table
  c.name as customer_name_in_db,
  c.email as customer_email,
  -- What will be displayed (based on API logic)
  CASE 
    WHEN c.role = 'line' THEN
      COALESCE(
        (SELECT line_display_name FROM customer_profiles WHERE line_user_id = c.line_user_id LIMIT 1),
        'LINE Customer'
      )
    WHEN c.role = 'web' THEN
      COALESCE(
        (SELECT full_name FROM users WHERE id = c.auth_user_id LIMIT 1),
        c.name,
        (SELECT email FROM users WHERE id = c.auth_user_id LIMIT 1),
        c.email,
        'Web Customer'
      )
    WHEN c.role = 'guest' THEN
      COALESCE(
        c.name,
        c.email,
        'Guest'
      )
    ELSE 'Unknown'
  END as will_display_as,
  -- Status
  CASE 
    WHEN c.role = 'line' AND (SELECT line_display_name FROM customer_profiles WHERE line_user_id = c.line_user_id LIMIT 1) IS NOT NULL THEN '✅ LINE name ready'
    WHEN c.role = 'line' THEN '❌ LINE name missing'
    WHEN c.role = 'web' AND (SELECT full_name FROM users WHERE id = c.auth_user_id LIMIT 1) IS NOT NULL THEN '✅ WEB name ready'
    WHEN c.role = 'web' THEN '⚠️ WEB name missing (will use email)'
    WHEN c.role = 'guest' AND c.name IS NOT NULL AND c.name != '' AND c.name != c.email THEN '✅ GUEST name ready'
    WHEN c.role = 'guest' AND c.name IS NULL OR c.name = '' OR c.name = c.email THEN '⚠️ GUEST name missing (will use email)'
    ELSE '❓ Unknown'
  END as display_status
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
WHERE b.customer_id IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 50;

