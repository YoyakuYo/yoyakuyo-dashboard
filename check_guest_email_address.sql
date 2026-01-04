-- Check guest customer email addresses
-- This will help identify if the email address is correct in the database

SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM customers
WHERE role = 'guest'
  AND email = 'yayakuyodemo@gmail.com'
ORDER BY created_at DESC;

-- Check all recent guest customers
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM customers
WHERE role = 'guest'
ORDER BY created_at DESC
LIMIT 10;

-- Check for typos or invalid email formats
SELECT 
  id,
  email,
  name,
  role,
  CASE 
    WHEN email NOT LIKE '%@%.%' THEN 'Invalid format'
    WHEN email LIKE '%..%' THEN 'Double dots'
    WHEN email LIKE '% @%' OR email LIKE '%@ %' THEN 'Spaces around @'
    ELSE 'Valid format'
  END AS email_status
FROM customers
WHERE role = 'guest'
  AND email IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

