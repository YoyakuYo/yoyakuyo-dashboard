-- ============================================
-- FIX: LINE Customer Name Collection Issue
-- ============================================
-- Root Cause: LINE booking flow doesn't collect customer names
-- Current fallback: "LINE Customer" + ID snippet

-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5
-- LINE User ID: Uf5741397f874c9a5822578e506f0cb47

-- ============================================
-- STEP 1: IMMEDIATE FIX - Send message asking for name
-- ============================================

-- Send a polite message asking for the customer's name
-- First ensure the shop owner is a participant in this conversation
INSERT INTO participants (
  conversation_id,
  user_type,
  user_id,
  created_at
)
SELECT
  '26a1f4b4-6ea0-498b-be43-27cfc69711e8',
  'owner',
  s.owner_user_id,
  NOW()
FROM shops s
WHERE s.id = (
  SELECT b.shop_id
  FROM bookings b
  WHERE b.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  ORDER BY b.created_at DESC
  LIMIT 1
)
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Now send the message using the shop owner UUID as sender_id
INSERT INTO messages (
  conversation_id,
  sender_type,
  sender_id,
  content,
  created_at
)
SELECT
  '26a1f4b4-6ea0-498b-be43-27cfc69711e8',
  'owner',
  s.owner_user_id, -- Get the actual shop owner UUID
  'Hello! Thank you for being a valued customer. May I please have your name so we can provide you with better service?',
  NOW()
FROM shops s
WHERE s.id = (
  SELECT b.shop_id
  FROM bookings b
  WHERE b.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  ORDER BY b.created_at DESC
  LIMIT 1
);

-- ============================================
-- STEP 2: TEMPORARY FIX - Update existing bookings with identifiable name
-- ============================================

-- Update all existing bookings for this customer with a better placeholder name
UPDATE bookings
SET customer_name = 'LINE Customer Uf57413'
WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  AND (customer_name IS NULL OR customer_name = '' OR customer_name = 'LINE Customer');

-- ============================================
-- STEP 3: VERIFY THE FIX
-- ============================================

-- Check that bookings now have names
SELECT
  b.id as booking_id,
  b.customer_name,
  b.created_at as booking_date,
  b.status
FROM bookings b
WHERE b.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
ORDER BY b.created_at DESC
LIMIT 5;

-- ============================================
-- STEP 4: PREVENT FUTURE ISSUES - Update booking flow
-- ============================================

-- The LINE booking API expects 'line_display_name' parameter
-- Frontend should collect this during booking process

-- Example of how the booking request should look:
SELECT
  'Frontend should send:' as requirement,
  'line_user_id: "Uf5741397f874c9a5822578e506f0cb47"' as param_1,
  'line_display_name: "Customer Name"' as param_2, -- THIS IS MISSING
  'shop_id, service_id, date, time, etc.' as param_3;

-- ============================================
-- STEP 5: MONITOR FOR NAME COLLECTION
-- ============================================

-- Create a view to monitor LINE customers without names
CREATE OR REPLACE VIEW line_customers_missing_names AS
SELECT
  c.id as customer_id,
  c.role,
  la.line_user_id,
  COUNT(b.id) as total_bookings,
  MAX(b.created_at) as last_booking_date
FROM customers c
JOIN line_accounts la ON la.customer_id = c.id
LEFT JOIN bookings b ON b.customer_id = c.id
WHERE c.role = 'line'
  AND NOT EXISTS (
    SELECT 1 FROM bookings b2
    WHERE b2.customer_id = c.id
      AND b2.customer_name IS NOT NULL
      AND b2.customer_name != ''
      AND b2.customer_name NOT LIKE 'LINE Customer%'
  )
GROUP BY c.id, c.role, la.line_user_id
ORDER BY total_bookings DESC;

-- Check how many LINE customers are missing names
SELECT * FROM line_customers_missing_names;

-- ============================================
-- STEP 6: FUTURE IMPROVEMENT - LINE Login Integration
-- ============================================

-- For automatic name collection, implement LINE Login:
-- 1. Use LINE Login OAuth flow
-- 2. Get user profile with display name
-- 3. Store in customers.name or bookings.customer_name
-- 4. Requires LINE Login channel setup

SELECT
  'FUTURE ENHANCEMENT:' as improvement,
  'Implement LINE Login to automatically get customer names' as step_1,
  'Store displayName from LINE profile API' as step_2,
  'Update booking flow to use authenticated names' as step_3;