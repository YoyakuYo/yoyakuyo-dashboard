-- Diagnostic script to check owner profile issues
-- Run this to see what's wrong with owner profiles

-- 1. Check if owner_profiles table has the correct structure
SELECT 
  'Table Structure' AS check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'owner_profiles'
ORDER BY ordinal_position;

-- 2. Check sample owner profiles (first 5)
SELECT 
  'Sample Profiles' AS check_type,
  id,
  full_name,
  date_of_birth,
  country,
  address_line1,
  city,
  prefecture,
  company_phone,
  company_email,
  created_at
FROM owner_profiles
LIMIT 5;

-- 3. Check which profiles are missing required fields
SELECT 
  'Missing Required Fields' AS check_type,
  id,
  CASE WHEN full_name IS NULL OR full_name = '' THEN 'missing_full_name' END AS missing_full_name,
  CASE WHEN date_of_birth IS NULL THEN 'missing_date_of_birth' END AS missing_date_of_birth,
  CASE WHEN country IS NULL OR country = '' THEN 'missing_country' END AS missing_country,
  CASE WHEN address_line1 IS NULL OR address_line1 = '' THEN 'missing_address_line1' END AS missing_address_line1,
  CASE WHEN city IS NULL OR city = '' THEN 'missing_city' END AS missing_city,
  CASE WHEN prefecture IS NULL OR prefecture = '' THEN 'missing_prefecture' END AS missing_prefecture
FROM owner_profiles
WHERE 
  full_name IS NULL OR full_name = '' OR
  date_of_birth IS NULL OR
  country IS NULL OR country = '' OR
  address_line1 IS NULL OR address_line1 = '' OR
  city IS NULL OR city = '' OR
  prefecture IS NULL OR prefecture = '';

-- 4. Count profiles by completeness
SELECT 
  'Profile Completeness' AS check_type,
  COUNT(*) AS total_profiles,
  COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 END) AS has_full_name,
  COUNT(CASE WHEN date_of_birth IS NOT NULL THEN 1 END) AS has_date_of_birth,
  COUNT(CASE WHEN country IS NOT NULL AND country != '' THEN 1 END) AS has_country,
  COUNT(CASE WHEN address_line1 IS NOT NULL AND address_line1 != '' THEN 1 END) AS has_address_line1,
  COUNT(CASE WHEN city IS NOT NULL AND city != '' THEN 1 END) AS has_city,
  COUNT(CASE WHEN prefecture IS NOT NULL AND prefecture != '' THEN 1 END) AS has_prefecture,
  COUNT(CASE WHEN 
    full_name IS NOT NULL AND full_name != '' AND
    date_of_birth IS NOT NULL AND
    country IS NOT NULL AND country != '' AND
    address_line1 IS NOT NULL AND address_line1 != '' AND
    city IS NOT NULL AND city != '' AND
    prefecture IS NOT NULL AND prefecture != ''
  THEN 1 END) AS complete_profiles
FROM owner_profiles;

-- 5. Check RLS policies
SELECT
  'RLS Policies' AS check_type,
  policyname,
  cmd AS operation,
  qual AS using_expression
FROM pg_policies
WHERE tablename = 'owner_profiles'
ORDER BY policyname;

