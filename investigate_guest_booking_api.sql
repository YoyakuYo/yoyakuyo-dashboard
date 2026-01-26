-- INVESTIGATE: Guest booking API vs actual guest data

-- Check what the guest booking API actually does
SELECT
  'Guest booking API analysis:' as investigation,
  'API collects: email, name (both required)' as api_requires,
  'API stores: name, email in customers table' as api_stores,
  'API creates: customer with role=guest' as api_creates;

-- Check recent guest customers - do they have names/emails?
SELECT
  'Recent guest customers:' as check,
  c.id,
  c.name,
  c.email,
  c.created_at,
  CASE
    WHEN c.name IS NOT NULL AND c.email IS NOT NULL THEN '✅ Has name and email (API working)'
    WHEN c.name IS NULL OR c.email IS NULL THEN '❌ Missing name/email (API broken)'
    ELSE 'Unknown'
  END as api_status
FROM customers c
WHERE c.role = 'guest'
ORDER BY c.created_at DESC
LIMIT 5;

-- Check if guest bookings are actually created via the /bookings/guest endpoint
SELECT
  'Guest booking source analysis:' as check,
  b.source,
  b.channel,
  COUNT(*) as booking_count,
  COUNT(DISTINCT b.customer_id) as unique_customers
FROM bookings b
JOIN customers c ON c.id = b.customer_id
WHERE c.role = 'guest'
GROUP BY b.source, b.channel
ORDER BY b.source, b.channel;

-- Check if there's a different guest booking flow being used
SELECT
  'Alternative guest booking investigation:' as check,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'guest_bookings'
    )
    THEN 'guest_bookings table exists - different flow used?'
    ELSE 'No guest_bookings table - using standard bookings'
  END as alternative_flow_check;

-- Check what the current guest booking endpoint expects
SELECT
  'Current guest API requirements:' as api_check,
  'Required fields: email, name, shop_id, service_id, date, time' as expected_input,
  'Creates: customers record with name/email + booking record' as expected_output,
  'Issue: Guests in DB have null names/emails' as actual_problem;