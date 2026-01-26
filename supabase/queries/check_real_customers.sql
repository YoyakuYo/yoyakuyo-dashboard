-- Check what customers actually exist in the database
SELECT
  id,
  name,
  role,
  line_user_id,
  auth_user_id,
  created_at
FROM customers
ORDER BY created_at DESC
LIMIT 20;

-- Check specifically for LINE customers
SELECT
  id,
  name,
  role,
  line_user_id,
  auth_user_id,
  created_at
FROM customers
WHERE role = 'line'
ORDER BY created_at DESC;

-- Check for customers with line_user_id
SELECT
  id,
  name,
  role,
  line_user_id,
  auth_user_id,
  created_at
FROM customers
WHERE line_user_id IS NOT NULL
ORDER BY created_at DESC;

-- Check if there are customers with the specific LINE user ID mentioned
SELECT
  id,
  name,
  role,
  line_user_id,
  auth_user_id,
  created_at
FROM customers
WHERE line_user_id = 'Uf5741397f874c9a5822578e506f0cb47';