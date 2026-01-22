-- ============================================
-- ANALYZE MISSING CITY DATA ISSUE
-- This explains why only ~35k shops show on frontend
-- ============================================

-- 1. BREAKDOWN: Shops with city vs without city
SELECT 
    'Shops WITH city data' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
UNION ALL
SELECT 
    'Shops WITHOUT city data' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '');

-- ============================================
-- 2. ESTIMATE: How many shops would show if city is required?
-- This should match the ~35k you see on frontend
SELECT 
    'Estimated Frontend Shops (has city)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
UNION ALL
SELECT 
    'Shops Filtered Out (no city)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '');

-- ============================================
-- 3. Shops with city but missing address
-- These might still show if city is the main filter
SELECT 
    'Has city + Has address' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
  AND address IS NOT NULL AND address != ''
UNION ALL
SELECT 
    'Has city + Missing address' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
  AND (address IS NULL OR address = '');

-- ============================================
-- 4. Verified shops: City data completeness
SELECT 
    'Verified Shops WITH city' as metric,
    COUNT(*)::text as count
FROM shops
WHERE is_verified = true
  AND (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
UNION ALL
SELECT 
    'Verified Shops WITHOUT city' as metric,
    COUNT(*)::text as count
FROM shops
WHERE is_verified = true
  AND (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '');

-- ============================================
-- 5. Sample: Shops without city (first 50)
-- See what shops are being filtered out
SELECT 
    id,
    name,
    address,
    prefecture,
    city,
    normalized_city,
    category_id,
    claim_status,
    is_verified,
    created_at
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '')
ORDER BY is_verified DESC, created_at DESC
LIMIT 50;

-- ============================================
-- 6. Check if normalized_city has data when city is missing
-- Maybe we can use normalized_city as fallback
SELECT 
    'Shops: city NULL but normalized_city has data' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '')
  AND normalized_city IS NOT NULL AND normalized_city != ''
UNION ALL
SELECT 
    'Shops: Both city and normalized_city are NULL' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '')
  AND (normalized_city IS NULL OR normalized_city = '');

-- ============================================
-- 7. Shops by prefecture (to see if we can extract city from prefecture)
-- Check if shops with prefecture but no city can be fixed
SELECT 
    COALESCE(prefecture, 'NO PREFECTURE') as prefecture_name,
    COUNT(*) as total_shops,
    COUNT(CASE WHEN city IS NOT NULL AND city != '' THEN 1 END) as shops_with_city,
    COUNT(CASE WHEN city IS NULL OR city = '' THEN 1 END) as shops_without_city,
    ROUND(COUNT(CASE WHEN city IS NULL OR city = '' THEN 1 END) * 100.0 / COUNT(*), 2) as missing_city_percentage
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
GROUP BY prefecture
ORDER BY shops_without_city DESC
LIMIT 20;

-- ============================================
-- 8. POTENTIAL FIX: Shops that have address but no city
-- These might be fixable by parsing the address
SELECT 
    'Shops with address but no city (can potentially extract city from address)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND address IS NOT NULL AND address != ''
  AND (city IS NULL OR city = '')
UNION ALL
SELECT 
    'Shops with prefecture but no city (can potentially set city from prefecture)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND prefecture IS NOT NULL AND prefecture != ''
  AND (city IS NULL OR city = '');

