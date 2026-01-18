-- ============================================
-- SHOW ALL DUPLICATE SHOPS BY NAME OR ADDRESS
-- OPTIMIZED VERSION - Faster queries
-- ============================================

-- 1. DUPLICATES BY NAME (Case-insensitive) - SIMPLIFIED
-- Shows summary of duplicate names (faster, no string aggregation)
SELECT 
    LOWER(TRIM(name)) as normalized_name,
    MIN(name) as original_name,
    COUNT(*) as duplicate_count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM shops
WHERE name IS NOT NULL AND name != ''
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, normalized_name
LIMIT 500;

-- ============================================
-- 2. DUPLICATES BY ADDRESS (Normalized) - SIMPLIFIED
-- Shows summary of duplicate addresses (faster, no string aggregation)
SELECT 
    LOWER(TRIM(address)) as normalized_address,
    MIN(address) as original_address,
    COUNT(*) as duplicate_count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM shops
WHERE address IS NOT NULL AND address != ''
GROUP BY LOWER(TRIM(address))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, normalized_address
LIMIT 500;

-- ============================================
-- 3. DUPLICATES BY NAME AND ADDRESS (Exact Match) - SIMPLIFIED
-- Shows shops with the same name AND address
SELECT 
    LOWER(TRIM(name)) as normalized_name,
    LOWER(TRIM(address)) as normalized_address,
    MIN(name) as original_name,
    MIN(address) as original_address,
    COUNT(*) as duplicate_count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM shops
WHERE name IS NOT NULL AND name != '' 
  AND address IS NOT NULL AND address != ''
GROUP BY LOWER(TRIM(name)), LOWER(TRIM(address))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, normalized_name, normalized_address
LIMIT 500;

-- ============================================
-- 4. DETAILED VIEW: Duplicates by name (with full shop details)
-- Shows first 1000 duplicate shops with full details
-- Use this AFTER running query 1 to see specific duplicates
WITH duplicate_names AS (
    SELECT LOWER(TRIM(name)) as normalized_name
    FROM shops
    WHERE name IS NOT NULL AND name != ''
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
    LIMIT 100  -- Limit to first 100 duplicate name groups
)
SELECT 
    s.id,
    s.name,
    s.address,
    s.phone,
    s.google_place_id,
    s.prefecture,
    s.city,
    s.claim_status,
    s.is_verified,
    s.created_at,
    LOWER(TRIM(s.name)) as normalized_name
FROM shops s
INNER JOIN duplicate_names dn ON LOWER(TRIM(s.name)) = dn.normalized_name
ORDER BY LOWER(TRIM(s.name)), s.created_at
LIMIT 2000;

-- ============================================
-- 5. DETAILED VIEW: Duplicates by address (with full shop details)
-- Shows first 1000 duplicate shops with full details
-- Use this AFTER running query 2 to see specific duplicates
WITH duplicate_addresses AS (
    SELECT LOWER(TRIM(address)) as normalized_address
    FROM shops
    WHERE address IS NOT NULL AND address != ''
    GROUP BY LOWER(TRIM(address))
    HAVING COUNT(*) > 1
    LIMIT 100  -- Limit to first 100 duplicate address groups
)
SELECT 
    s.id,
    s.name,
    s.address,
    s.phone,
    s.google_place_id,
    s.prefecture,
    s.city,
    s.claim_status,
    s.is_verified,
    s.created_at,
    LOWER(TRIM(s.address)) as normalized_address
FROM shops s
INNER JOIN duplicate_addresses da ON LOWER(TRIM(s.address)) = da.normalized_address
ORDER BY LOWER(TRIM(s.address)), s.created_at
LIMIT 2000;

-- ============================================
-- 6. FIND DUPLICATES FOR A SPECIFIC SHOP NAME
-- Use this to see all duplicates for a specific shop name
-- Replace 'YOUR_SHOP_NAME_HERE' with the actual shop name
SELECT 
    id,
    name,
    address,
    phone,
    email,
    google_place_id,
    prefecture,
    city,
    claim_status,
    is_verified,
    created_at,
    updated_at
FROM shops
WHERE LOWER(TRIM(name)) = LOWER(TRIM('YOUR_SHOP_NAME_HERE'))
ORDER BY created_at;

-- ============================================
-- 7. FIND DUPLICATES FOR A SPECIFIC ADDRESS
-- Use this to see all duplicates for a specific address
-- Replace 'YOUR_ADDRESS_HERE' with the actual address
SELECT 
    id,
    name,
    address,
    phone,
    email,
    google_place_id,
    prefecture,
    city,
    claim_status,
    is_verified,
    created_at,
    updated_at
FROM shops
WHERE LOWER(TRIM(address)) = LOWER(TRIM('YOUR_ADDRESS_HERE'))
ORDER BY created_at;

-- ============================================
-- 8. SUMMARY STATISTICS (FAST)
-- Quick overview of duplicate situation
SELECT 
    'Total Shops' as metric,
    COUNT(*)::text as value
FROM shops
UNION ALL
SELECT 
    'Shops with Duplicate Names' as metric,
    COUNT(DISTINCT LOWER(TRIM(name)))::text as value
FROM (
    SELECT LOWER(TRIM(name)) as name
    FROM shops
    WHERE name IS NOT NULL AND name != ''
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 
    'Shops with Duplicate Addresses' as metric,
    COUNT(DISTINCT LOWER(TRIM(address)))::text as value
FROM (
    SELECT LOWER(TRIM(address)) as address
    FROM shops
    WHERE address IS NOT NULL AND address != ''
    GROUP BY LOWER(TRIM(address))
    HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 
    'Shops with Duplicate Name+Address' as metric,
    COUNT(*)::text as value
FROM (
    SELECT LOWER(TRIM(name)), LOWER(TRIM(address))
    FROM shops
    WHERE name IS NOT NULL AND name != '' 
      AND address IS NOT NULL AND address != ''
    GROUP BY LOWER(TRIM(name)), LOWER(TRIM(address))
    HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 
    'Max Duplicates by Name' as metric,
    COALESCE(MAX(cnt)::text, '0') as value
FROM (
    SELECT COUNT(*) as cnt
    FROM shops
    WHERE name IS NOT NULL AND name != ''
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
) counts
UNION ALL
SELECT 
    'Max Duplicates by Address' as metric,
    COALESCE(MAX(cnt)::text, '0') as value
FROM (
    SELECT COUNT(*) as cnt
    FROM shops
    WHERE address IS NOT NULL AND address != ''
    GROUP BY LOWER(TRIM(address))
    HAVING COUNT(*) > 1
) counts;

-- ============================================
-- 9. TOP 20 MOST DUPLICATED NAMES
-- Shows the shop names that appear most frequently
SELECT 
    LOWER(TRIM(name)) as normalized_name,
    MIN(name) as original_name,
    COUNT(*) as duplicate_count
FROM shops
WHERE name IS NOT NULL AND name != ''
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 20;

-- ============================================
-- 10. TOP 20 MOST DUPLICATED ADDRESSES
-- Shows the addresses that appear most frequently
SELECT 
    LOWER(TRIM(address)) as normalized_address,
    MIN(address) as original_address,
    COUNT(*) as duplicate_count
FROM shops
WHERE address IS NOT NULL AND address != ''
GROUP BY LOWER(TRIM(address))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 20;

-- ============================================
-- 11. VIEW ALL SHOPS FOR A SPECIFIC DUPLICATE ADDRESS
-- Example: View all 37 "APA Hotel, Japan" shops
-- Replace 'apa hotel, japan' with any address from query 10
SELECT 
    id,
    name,
    address,
    phone,
    email,
    google_place_id,
    osm_id,
    prefecture,
    city,
    normalized_city,
    latitude,
    longitude,
    claim_status,
    is_verified,
    owner_user_id,
    created_at,
    updated_at
FROM shops
WHERE LOWER(TRIM(address)) = LOWER(TRIM('apa hotel, japan'))
ORDER BY created_at;

-- ============================================
-- 12. FIND SHOPS WITH INCOMPLETE/BAD ADDRESSES
-- Identifies shops with addresses that are likely incomplete
SELECT 
    id,
    name,
    address,
    phone,
    google_place_id,
    prefecture,
    city,
    claim_status,
    is_verified,
    created_at,
    CASE 
        WHEN LENGTH(TRIM(address)) <= 3 THEN 'Too Short'
        WHEN address ~ '^[0-9]+$' THEN 'Numbers Only'
        WHEN address ~ '^[0-9]+\s' THEN 'Starts with Number Only'
        WHEN address IN ('大阪市', '京都市', '横浜市', '名古屋市', '福岡市', '札幌市', '仙台市', '神戸市') THEN 'City Name Only'
        ELSE 'Other'
    END as issue_type
FROM shops
WHERE address IS NOT NULL 
  AND address != ''
  AND (
    LENGTH(TRIM(address)) <= 3
    OR address ~ '^[0-9]+$'
    OR address ~ '^[0-9]+\s'
    OR address IN ('大阪市', '京都市', '横浜市', '名古屋市', '福岡市', '札幌市', '仙台市', '神戸市', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10')
  )
ORDER BY issue_type, address
LIMIT 1000;

-- ============================================
-- 13. COUNT SHOPS WITH INCOMPLETE ADDRESSES
-- Summary of bad address data
SELECT 
    CASE 
        WHEN LENGTH(TRIM(address)) <= 3 THEN 'Too Short (≤3 chars)'
        WHEN address ~ '^[0-9]+$' THEN 'Numbers Only'
        WHEN address ~ '^[0-9]+\s' THEN 'Starts with Number Only'
        WHEN address IN ('大阪市', '京都市', '横浜市', '名古屋市', '福岡市', '札幌市', '仙台市', '神戸市') THEN 'City Name Only'
        ELSE 'Other'
    END as issue_type,
    COUNT(*) as shop_count
FROM shops
WHERE address IS NOT NULL 
  AND address != ''
  AND (
    LENGTH(TRIM(address)) <= 3
    OR address ~ '^[0-9]+$'
    OR address ~ '^[0-9]+\s'
    OR address IN ('大阪市', '京都市', '横浜市', '名古屋市', '福岡市', '札幌市', '仙台市', '神戸市', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10')
  )
GROUP BY issue_type
ORDER BY shop_count DESC;
