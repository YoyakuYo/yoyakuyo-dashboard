-- Check if guests actually receive email notifications and if shops can see guest details

-- Check if there are email notification records for guests
SELECT
  'Guest email notifications check:' as investigation,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%email%' OR table_name LIKE '%notification%'
    )
    THEN 'Email/notification tables exist - checking...'
    ELSE 'No email/notification tables found'
  END as email_tables_status;

-- Check what email/notification related tables exist
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%email%' OR table_name LIKE '%notification%' OR table_name LIKE '%message%')
ORDER BY table_name;

-- Check if guest bookings have any contact information stored
SELECT
  'Guest booking contact info check:' as check,
  b.id as booking_id,
  b.customer_id,
  b.created_at,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name IN ('customer_name', 'customer_email', 'customer_phone')
    )
    THEN 'Bookings table has contact fields'
    ELSE 'Bookings table has NO contact fields'
  END as booking_table_status
FROM bookings b
JOIN customers c ON c.id = b.customer_id
WHERE c.role = 'guest'
ORDER BY b.created_at DESC
LIMIT 3;

-- Check guest booking API to see what fields it accepts
SELECT
  'Guest booking API investigation:' as api_check,
  'Need to check guest booking endpoint to see if it collects names/emails' as next_step;

-- Check if there are any guest-specific tables
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%guest%'
ORDER BY table_name;