-- Analyze shops with and without addresses
-- This helps identify which shops need address data cleanup

-- 1. Count shops with addresses vs without
SELECT 
  'Shops with addresses' as category,
  COUNT(*) as count
FROM shops
WHERE address IS NOT NULL 
  AND address != ''
  AND TRIM(address) != '';

UNION ALL

SELECT 
  'Shops without addresses' as category,
  COUNT(*) as count
FROM shops
WHERE address IS NULL 
  OR address = ''
  OR TRIM(address) = '';

-- 2. Detailed breakdown: Show shops missing addresses
SELECT 
  id,
  name,
  address,
  city,
  prefecture,
  category_id,
  created_at,
  CASE 
    WHEN address IS NULL THEN 'NULL'
    WHEN address = '' THEN 'EMPTY STRING'
    WHEN TRIM(address) = '' THEN 'WHITESPACE ONLY'
    ELSE 'HAS ADDRESS'
  END as address_status
FROM shops
WHERE address IS NULL 
  OR address = ''
  OR TRIM(address) = ''
ORDER BY created_at DESC
LIMIT 100;

-- 3. Count by address status
SELECT 
  CASE 
    WHEN address IS NULL THEN 'NULL'
    WHEN address = '' THEN 'EMPTY STRING'
    WHEN TRIM(address) = '' THEN 'WHITESPACE ONLY'
    ELSE 'HAS ADDRESS'
  END as address_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2) as percentage
FROM shops
GROUP BY 
  CASE 
    WHEN address IS NULL THEN 'NULL'
    WHEN address = '' THEN 'EMPTY STRING'
    WHEN TRIM(address) = '' THEN 'WHITESPACE ONLY'
    ELSE 'HAS ADDRESS'
  END
ORDER BY count DESC;

-- 4. Shops with addresses but missing city/prefecture
SELECT 
  'Shops with address but no city' as category,
  COUNT(*) as count
FROM shops
WHERE (address IS NOT NULL AND address != '' AND TRIM(address) != '')
  AND (city IS NULL OR city = '' OR TRIM(city) = '');

UNION ALL

SELECT 
  'Shops with address but no prefecture' as category,
  COUNT(*) as count
FROM shops
WHERE (address IS NOT NULL AND address != '' AND TRIM(address) != '')
  AND (prefecture IS NULL OR prefecture = '' OR TRIM(prefecture) = '');

-- 5. Sample shops without addresses (first 20)
SELECT 
  id,
  name,
  address,
  city,
  prefecture,
  category_id,
  created_at
FROM shops
WHERE address IS NULL 
  OR address = ''
  OR TRIM(address) = ''
ORDER BY created_at DESC
LIMIT 20;

