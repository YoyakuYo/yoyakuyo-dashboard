-- Fix email typo: yayakuyodemo@gmail.com -> yoyakuyodemo@gmail.com
-- This email address worked yesterday, so the typo is in the database

-- First, check how many records need to be fixed
SELECT 
  'BEFORE FIX' AS status,
  COUNT(*) AS count,
  email
FROM customers
WHERE role = 'guest'
  AND email = 'yayakuyodemo@gmail.com'
GROUP BY email;

-- Fix the typo: yayakuyodemo -> yoyakuyodemo
UPDATE customers
SET email = 'yoyakuyodemo@gmail.com'
WHERE role = 'guest'
  AND email = 'yayakuyodemo@gmail.com';

-- Verify the fix
SELECT 
  'AFTER FIX' AS status,
  COUNT(*) AS count,
  email
FROM customers
WHERE role = 'guest'
  AND email IN ('yayakuyodemo@gmail.com', 'yoyakuyodemo@gmail.com')
GROUP BY email;

-- Show all records with the corrected email
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM customers
WHERE role = 'guest'
  AND email = 'yoyakuyodemo@gmail.com'
ORDER BY created_at DESC;

