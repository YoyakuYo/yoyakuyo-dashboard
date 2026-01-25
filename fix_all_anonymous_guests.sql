-- FIX ALL remaining anonymous guest customers

-- First, identify ALL anonymous guest conversations and their customer IDs
SELECT
  'All anonymous guest conversations:' as check,
  conv.id as conversation_id,
  conv.customer_ref as customer_id,
  conv.created_at,
  'Need to update customers table' as action
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type::text = 'guest'
  AND (c.name IS NULL OR c.email IS NULL);

-- UPDATE all anonymous guests with identifiable names based on their conversation dates
UPDATE customers
SET
  name = CASE
    WHEN customers.id = '2e9827b1-0a6c-4d92-9afc-cb606c402234' THEN 'Guest Customer (Jan 6)'
    WHEN customers.id = 'c8bc2720-f718-4658-a6fc-cb606c402234' THEN 'Guest Customer (Jan 4)'
    WHEN customers.id = '35c526c2-264b-4c3e-aeba-bc7166ec5805' THEN 'Guest Customer (Jan 3)'
    WHEN customers.id = '480e75fb-40c3-4936-908c-877085ffa9da' THEN 'Guest Customer (Dec 30)'
    ELSE customers.name
  END,
  email = CASE
    WHEN customers.id = '2e9827b1-0a6c-4d92-9afc-cb606c402234' THEN 'guest.jan6@yoyakuyo.com'
    WHEN customers.id = 'c8bc2720-f718-4658-a6fc-cb606c402234' THEN 'guest.jan4@yoyakuyo.com'
    WHEN customers.id = '35c526c2-264b-4c3e-aeba-bc7166ec5805' THEN 'guest.jan3@yoyakuyo.com'
    WHEN customers.id = '480e75fb-40c3-4936-908c-877085ffa9da' THEN 'guest.dec30@yoyakuyo.com'
    ELSE customers.email
  END
WHERE customers.role = 'guest'
  AND customers.id IN (
    '2e9827b1-0a6c-4d92-9afc-cb606c402234',
    'c8bc2720-f718-4658-a6fc-cb606c402234',
    '35c526c2-264b-4c3e-aeba-bc7166ec5805',
    '480e75fb-40c3-4936-908c-877085ffa9da'
  );

-- Alternative approach: Use a more direct update for all anonymous guests
-- This will work even if the IDs don't match exactly

-- First, create a mapping of conversation IDs to customer IDs for anonymous guests
CREATE TEMP TABLE anonymous_guest_mapping AS
SELECT
  conv.id as conversation_id,
  conv.customer_ref as customer_id,
  conv.created_at,
  ROW_NUMBER() OVER (ORDER BY conv.created_at DESC) as row_num
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type::text = 'guest'
  AND (c.name IS NULL OR c.email IS NULL);

-- Update using the mapping
UPDATE customers
SET
  name = 'Guest Customer #' || agm.row_num,
  email = 'guest' || agm.row_num || '@yoyakuyo.com'
FROM anonymous_guest_mapping agm
WHERE customers.id = agm.customer_id::uuid
  AND customers.role = 'guest'
  AND (customers.name IS NULL OR customers.email IS NULL);

-- FINAL VERIFICATION: All guest conversations should now show names
SELECT
  'FINAL VERIFICATION - All guest conversations:' as check,
  conv.id as conversation_id,
  c.name as guest_name,
  c.email as guest_email,
  conv.created_at,
  CASE
    WHEN c.name IS NOT NULL THEN '✅ Shop sees: ' || c.name
    ELSE '❌ ERROR: Still anonymous - customer ID mismatch?'
  END as owner_sees
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type::text = 'guest'
ORDER BY conv.created_at DESC;

-- Check if there are any remaining anonymous guests
SELECT
  'Remaining anonymous guests check:' as final_check,
  COUNT(*) as remaining_anonymous,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ SUCCESS: All guests have names!'
    ELSE '❌ ISSUE: ' || COUNT(*) || ' guests still anonymous'
  END as status
FROM conversations conv
LEFT JOIN customers c ON c.id = conv.customer_ref::uuid
WHERE conv.customer_type::text = 'guest'
  AND (c.name IS NULL OR c.email IS NULL);

-- Clean up temp table
DROP TABLE IF EXISTS anonymous_guest_mapping;