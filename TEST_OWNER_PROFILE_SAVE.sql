-- Test script to manually save an owner profile
-- Replace USER_ID_HERE with an actual user ID from auth.users

-- Step 1: Get a test user ID
SELECT 
  'Test User IDs' AS check_type,
  id,
  email
FROM auth.users
LIMIT 5;

-- Step 2: Try to insert/update an owner profile manually
-- Replace 'USER_ID_HERE' with an actual user ID from above
/*
INSERT INTO owner_profiles (
  id,
  full_name,
  date_of_birth,
  country,
  address_line1,
  city,
  prefecture,
  company_phone,
  company_email
) VALUES (
  'USER_ID_HERE'::uuid,
  'Test Owner',
  '1990-01-01',
  'Japan',
  '123 Test Street',
  'Tokyo',
  'tokyo',
  '123-456-7890',
  'test@example.com'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  date_of_birth = EXCLUDED.date_of_birth,
  country = EXCLUDED.country,
  address_line1 = EXCLUDED.address_line1,
  city = EXCLUDED.city,
  prefecture = EXCLUDED.prefecture,
  company_phone = EXCLUDED.company_phone,
  company_email = EXCLUDED.company_email,
  updated_at = NOW();
*/

-- Step 3: Check if the profile was saved
SELECT 
  'Profile Check' AS check_type,
  id,
  full_name,
  date_of_birth,
  country,
  address_line1,
  city,
  prefecture,
  company_phone,
  company_email,
  created_at,
  updated_at
FROM owner_profiles
WHERE id = 'USER_ID_HERE'::uuid;

-- Step 4: Check what fields are required by the API
SELECT 
  'Required Fields Check' AS check_type,
  CASE WHEN full_name IS NULL OR full_name = '' THEN 'MISSING' ELSE 'OK' END AS full_name,
  CASE WHEN date_of_birth IS NULL THEN 'MISSING' ELSE 'OK' END AS date_of_birth,
  CASE WHEN country IS NULL OR country = '' THEN 'MISSING' ELSE 'OK' END AS country,
  CASE WHEN address_line1 IS NULL OR address_line1 = '' THEN 'MISSING' ELSE 'OK' END AS address_line1,
  CASE WHEN city IS NULL OR city = '' THEN 'MISSING' ELSE 'OK' END AS city,
  CASE WHEN prefecture IS NULL OR prefecture = '' THEN 'MISSING' ELSE 'OK' END AS prefecture
FROM owner_profiles
WHERE id = 'USER_ID_HERE'::uuid;

