-- Check LINE customers in analytics
-- This query diagnoses why LINE customers aren't showing in the admin analytics

-- 1. Count customers by role
SELECT
  role,
  COUNT(*) as count
FROM customers
GROUP BY role
ORDER BY role;

-- 2. Check LINE accounts
SELECT
  COUNT(*) as total_line_accounts,
  COUNT(DISTINCT customer_id) as unique_customers_with_line_accounts
FROM line_accounts;

-- 3. Check customers with line_user_id
SELECT
  COUNT(*) as customers_with_line_user_id
FROM customers
WHERE line_user_id IS NOT NULL;

-- 4. Check bookings by source
SELECT
  source,
  COUNT(*) as booking_count
FROM bookings
GROUP BY source;

-- 5. Check LINE customers with bookings
SELECT
  COUNT(DISTINCT b.customer_id) as line_customers_with_bookings
FROM bookings b
WHERE b.source = 'line';

-- 6. Check all LINE customers (with or without bookings)
WITH line_customers AS (
  SELECT c.id, c.name, c.role, c.line_user_id,
         la.line_user_id as account_line_user_id
  FROM customers c
  LEFT JOIN line_accounts la ON la.customer_id = c.id
  WHERE c.role = 'line'
     OR la.customer_id IS NOT NULL
     OR c.line_user_id IS NOT NULL
)
SELECT
  COUNT(*) as total_line_customers,
  COUNT(CASE WHEN EXISTS (SELECT 1 FROM bookings b WHERE b.customer_id = lc.id) THEN 1 END) as with_bookings,
  COUNT(CASE WHEN NOT EXISTS (SELECT 1 FROM bookings b WHERE b.customer_id = lc.id) THEN 1 END) as without_bookings
FROM line_customers lc;

-- 7. Show some LINE customers without bookings
WITH line_customers AS (
  SELECT c.id, c.name, c.role, c.line_user_id, c.created_at,
         la.line_user_id as account_line_user_id
  FROM customers c
  LEFT JOIN line_accounts la ON la.customer_id = c.id
  WHERE c.role = 'line'
     OR la.customer_id IS NOT NULL
     OR c.line_user_id IS NOT NULL
)
SELECT lc.id, lc.name, lc.role, lc.line_user_id, lc.account_line_user_id, lc.created_at
FROM line_customers lc
WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.customer_id = lc.id)
ORDER BY lc.created_at DESC
LIMIT 10;