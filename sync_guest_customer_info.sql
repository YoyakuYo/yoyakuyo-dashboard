-- Fix: Sync guest customer names/emails from bookings to customers table

-- Check current state - guests with bookings that have names/emails
SELECT
  'Guests with booking info but missing in customers table:' as issue,
  c.id as customer_id,
  c.name as customer_name,
  c.email as customer_email,
  b.customer_name as booking_name,
  b.customer_email as booking_email,
  b.created_at as booking_date
FROM customers c
JOIN bookings b ON b.customer_id = c.id
WHERE c.role = 'guest'
  AND (c.name IS NULL OR c.email IS NULL)
  AND (b.customer_name IS NOT NULL OR b.customer_email IS NOT NULL)
ORDER BY b.created_at DESC;

-- Update guest customers with info from their most recent booking
UPDATE customers
SET
  name = COALESCE(c.name, b.customer_name),
  email = COALESCE(c.email, b.customer_email)
FROM customers c
JOIN bookings b ON b.customer_id = c.id
WHERE customers.id = c.id
  AND customers.role = 'guest'
  AND (
    (customers.name IS NULL AND b.customer_name IS NOT NULL) OR
    (customers.email IS NULL AND b.customer_email IS NOT NULL)
  )
  AND b.id IN (
    -- Use the most recent booking for each customer
    SELECT DISTINCT ON (customer_id) id
    FROM bookings
    WHERE customer_id = c.id
    ORDER BY created_at DESC
  );

-- Verify the fix worked
SELECT
  'After sync - Guest customers now have:' as verification,
  c.id,
  c.name,
  c.email,
  c.role,
  COUNT(b.id) as total_bookings
FROM customers c
LEFT JOIN bookings b ON b.customer_id = c.id
WHERE c.role = 'guest'
  AND c.name IS NOT NULL
GROUP BY c.id, c.name, c.email, c.role
ORDER BY total_bookings DESC
LIMIT 5;

-- Check the specific guest customer we were looking at
SELECT
  'Yhikh guest customer after sync:' as verification,
  c.id,
  c.name,
  c.email,
  c.role
FROM customers c
WHERE c.id = '34f4d105-1c7b-4a78-a5f1-0d27c52fd216';

-- Final verification of multi-conversation customers
SELECT
  'Multi-conversation customers with names:' as final_check,
  CASE WHEN conv.customer_type = 'line' THEN 'LINE Customer' ELSE 'Guest Customer' END as type,
  c.name,
  c.email,
  COUNT(conv.id) as conversations,
  STRING_AGG(DISTINCT conv.created_at::date::text, ', ') as dates
FROM conversations conv
LEFT JOIN customers c ON (
  CASE WHEN conv.customer_type = 'line' THEN c.line_user_id = conv.customer_ref
       ELSE c.id = conv.customer_ref::uuid END
)
WHERE (conv.customer_type::text, conv.customer_ref) IN (
  SELECT customer_type::text, customer_ref
  FROM conversations
  GROUP BY customer_type, customer_ref
  HAVING COUNT(*) > 1
)
GROUP BY conv.customer_type, conv.customer_ref, c.id, c.name, c.email
ORDER BY conversations DESC;