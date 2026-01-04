-- Fix guest customer names in customers table
-- Update customers.name for guest customers where name is missing but email exists

-- First, show what needs to be fixed
SELECT 
  id as customer_id,
  role,
  email,
  name as current_name,
  CASE 
    WHEN name IS NULL OR name = '' THEN '❌ Name missing'
    WHEN name = email THEN '⚠️ Name equals email'
    ELSE '✅ Name exists'
  END as status
FROM customers
WHERE role = 'guest'
ORDER BY created_at DESC;

-- Update guest customers: set name to email prefix if name is missing
-- This extracts the part before @ from email (e.g., "john@example.com" -> "john")
UPDATE customers
SET name = SPLIT_PART(email, '@', 1)
WHERE role = 'guest'
  AND (name IS NULL OR name = '' OR name = email)
  AND email IS NOT NULL;

-- Verify the updates
SELECT 
  id as customer_id,
  role,
  email,
  name as updated_name,
  '✅ Fixed' as status
FROM customers
WHERE role = 'guest'
  AND name IS NOT NULL
  AND name != ''
  AND name != email
ORDER BY created_at DESC;

