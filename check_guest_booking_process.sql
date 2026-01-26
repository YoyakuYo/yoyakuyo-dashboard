-- Check if guest booking process actually stores names/emails anywhere

-- Check if there are any other tables that might store guest booking info
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%booking%'
ORDER BY table_name;

-- Check if guest bookings have any associated data in other tables
SELECT
  'Guest booking analysis:' as check,
  b.id as booking_id,
  b.customer_id,
  b.created_at as booking_created_at,
  c.name as customer_name,
  c.email as customer_email,
  c.role
FROM bookings b
LEFT JOIN customers c ON c.id = b.customer_id
WHERE b.customer_id IN (
  SELECT id FROM customers WHERE role = 'guest'
)
ORDER BY b.created_at DESC
LIMIT 5;

-- Check if there's a guest_bookings or similar table
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%guest%' OR table_name LIKE '%booking%')
ORDER BY table_name;

-- Check the booking confirmation you showed - maybe it's frontend-generated?
SELECT
  'CONCLUSION:' as analysis,
  'If guests provide names/emails in booking form but they are not stored,' as issue,
  'This suggests the guest booking flow collects info but does not persist it' as explanation,
  'The confirmation you saw might be frontend-generated only' as theory;

-- Check if guest customers ever have names/emails (they should not)
SELECT
  COUNT(*) as total_guests,
  COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as guests_with_names,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as guests_with_emails
FROM customers
WHERE role = 'guest';