-- Check what type of customer Yhikh is
SELECT
  c.id,
  c.name,
  c.email,
  c.role,
  c.auth_user_id,
  c.line_user_id,
  c.created_at,
  CASE
    WHEN c.role = 'line' AND c.line_user_id IS NOT NULL THEN 'LINE Customer (registered via LINE)'
    WHEN c.role = 'web' AND c.auth_user_id IS NOT NULL THEN 'Web Customer (registered via email/password)'
    WHEN c.role = 'guest' THEN 'Guest Customer (no registration required)'
    WHEN c.role = 'owner' THEN 'Shop Owner'
    ELSE 'Unknown type'
  END as customer_type_description,
  CASE
    WHEN c.line_user_id IS NOT NULL THEN 'Has LINE account linked'
    WHEN c.auth_user_id IS NOT NULL THEN 'Has web account'
    ELSE 'No account linked (guest)'
  END as account_status
FROM customers c
WHERE c.email = 'yoyakuyodemo@gmail.com' OR c.name = 'Yhikh'
ORDER BY c.created_at DESC;

-- Check if this customer has any LINE accounts
SELECT
  la.customer_id,
  la.line_user_id,
  la.created_at
FROM line_accounts la
WHERE la.customer_id IN (
  SELECT id FROM customers
  WHERE email = 'yoyakuyodemo@gmail.com' OR name = 'Yhikh'
);

-- Check booking history for this customer
SELECT
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
  COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
  MIN(b.created_at) as first_booking_date,
  MAX(b.created_at) as latest_booking_date
FROM bookings b
WHERE b.customer_id IN (
  SELECT id FROM customers
  WHERE email = 'yoyakuyodemo@gmail.com' OR name = 'Yhikh'
);