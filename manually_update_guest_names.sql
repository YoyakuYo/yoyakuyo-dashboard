-- Manually update guest customer names
-- Replace the names below with the actual customer names

-- Example: Update guest customer names
-- UPDATE customers 
-- SET name = 'John Doe'
-- WHERE id = '55a0b4bb-1a8c-41df-a41c-9f8c7699ed6d';

-- UPDATE customers 
-- SET name = 'Jane Smith'
-- WHERE id = '457a3ad8-e207-4e2c-b66a-606138ed977c';

-- Check current guest customers that need names
SELECT 
  id as customer_id,
  email,
  name as current_name,
  created_at,
  '⚠️ Needs manual update' as status
FROM customers
WHERE role = 'guest'
  AND (name IS NULL OR name = '' OR name = SPLIT_PART(email, '@', 1))
ORDER BY created_at DESC;

-- After updating, verify:
-- SELECT id, email, name FROM customers WHERE role = 'guest' ORDER BY created_at DESC;

