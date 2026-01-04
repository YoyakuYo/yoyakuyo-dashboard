-- Verify bookings and their customer data
-- This checks if customer names can be properly retrieved for each booking

WITH booking_customer_info AS (
  SELECT 
    b.id as booking_id,
    b.shop_id,
    b.customer_id,
    b.source,
    b.status,
    b.date,
    b.start_time,
    b.created_at,
    -- Customer info
    c.role as customer_role,
    c.email as customer_email,
    c.name as customer_name,
    c.auth_user_id,
    c.line_user_id,
    -- Service info
    s.name as service_name,
    sh.name as shop_name
  FROM bookings b
  LEFT JOIN customers c ON b.customer_id = c.id
  LEFT JOIN services s ON b.service_id = s.id
  LEFT JOIN shops sh ON b.shop_id = sh.id
  ORDER BY b.created_at DESC
  LIMIT 50
),
enriched_bookings AS (
  SELECT 
    bci.*,
    -- Try to get LINE customer name
    CASE 
      WHEN bci.customer_role = 'line' AND bci.line_user_id IS NOT NULL THEN
        (SELECT line_display_name FROM customer_profiles WHERE line_user_id = bci.line_user_id LIMIT 1)
      ELSE NULL
    END as line_display_name,
    -- Try to get WEB customer name
    CASE 
      WHEN bci.customer_role = 'web' AND bci.auth_user_id IS NOT NULL THEN
        (SELECT full_name FROM users WHERE id = bci.auth_user_id LIMIT 1)
      ELSE NULL
    END as user_full_name,
    -- Try to get WEB customer email
    CASE 
      WHEN bci.customer_role = 'web' AND bci.auth_user_id IS NOT NULL THEN
        (SELECT email FROM users WHERE id = bci.auth_user_id LIMIT 1)
      ELSE NULL
    END as user_email,
    -- GUEST customers: data is in customers table (no separate guests table)
    -- guest_full_name and guest_email are NULL (guests table doesn't exist)
    NULL as guest_full_name,
    NULL as guest_email
  FROM booking_customer_info bci
)
SELECT 
  booking_id,
  shop_name,
  service_name,
  source,
  status,
  date,
  start_time,
  -- Customer identification
  customer_role,
  customer_id,
  -- Final customer name (priority: specific source > customer.name > email > fallback)
  COALESCE(
    line_display_name,
    user_full_name,
    customer_name,
    CASE 
      WHEN customer_role = 'line' THEN 'LINE Customer'
      WHEN customer_role = 'web' THEN COALESCE(user_email, customer_email, 'Web Customer')
      WHEN customer_role = 'guest' THEN COALESCE(customer_email, 'Guest')
      ELSE 'Unknown Customer'
    END
  ) as final_customer_name,
  -- Final customer email
  COALESCE(
    user_email,
    customer_email
  ) as final_customer_email,
  -- Data source status
  CASE 
    WHEN customer_role = 'line' AND line_display_name IS NOT NULL THEN '✅ LINE name found'
    WHEN customer_role = 'line' AND line_display_name IS NULL THEN '❌ LINE name missing'
    WHEN customer_role = 'web' AND user_full_name IS NOT NULL THEN '✅ WEB name found'
    WHEN customer_role = 'web' AND user_full_name IS NULL THEN '⚠️ WEB name missing (using email)'
    WHEN customer_role = 'guest' AND customer_email IS NOT NULL THEN '✅ GUEST email found'
    WHEN customer_role = 'guest' AND customer_email IS NULL THEN '❌ GUEST email missing'
    ELSE '❓ Unknown role'
  END as name_status,
  created_at
FROM enriched_bookings
ORDER BY created_at DESC;

