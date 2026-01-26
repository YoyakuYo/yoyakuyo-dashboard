-- Check why guest customer has null name/email
SELECT
  'Guest Customer Analysis:' as analysis,
  c.id,
  c.name,
  c.email,
  c.role,
  c.created_at,
  CASE
    WHEN c.name IS NULL AND c.email IS NULL THEN 'Anonymous guest - never provided details'
    WHEN c.name IS NOT NULL THEN 'Guest with provided name'
    ELSE 'Partial guest info'
  END as guest_status
FROM customers c
WHERE c.id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a';

-- Check all guest customers to see the pattern
SELECT
  'All Guest Customers:' as analysis,
  c.id,
  c.name,
  c.email,
  c.created_at,
  CASE
    WHEN c.name IS NULL AND c.email IS NULL THEN 'Fully anonymous'
    WHEN c.name IS NOT NULL AND c.email IS NOT NULL THEN 'Full details provided'
    WHEN c.name IS NOT NULL OR c.email IS NOT NULL THEN 'Partial details'
    ELSE 'Unknown'
  END as info_status
FROM customers c
WHERE c.role = 'guest'
ORDER BY c.created_at DESC
LIMIT 10;

-- Check if guest customer has any booking details that might have name/email
SELECT
  'Booking details for guest customer:' as analysis,
  b.id as booking_id,
  b.customer_name,
  b.customer_email,
  b.customer_phone,
  b.created_at as booking_date
FROM bookings b
WHERE b.customer_id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a'
ORDER BY b.created_at DESC;

-- Explain guest vs LINE customer behavior
SELECT
  'WHY THIS IS NORMAL:' as explanation,
  'Guest customers can book without providing name/email' as guest_behavior,
  'LINE customers get name from LINE profile automatically' as line_behavior,
  'This guest chose to remain anonymous - completely normal!' as conclusion;