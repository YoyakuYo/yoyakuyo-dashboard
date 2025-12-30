-- ============================================
-- DIAGNOSTIC: Why only ~35k shops show on frontend?
-- Check for missing data that might cause filtering
-- ============================================

-- 13a. Shops with/without category_id
SELECT 
    'Shops WITH category_id' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND category_id IS NOT NULL
UNION ALL
SELECT 
    'Shops WITHOUT category_id (NULL)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND category_id IS NULL;

-- ============================================
-- 13b. Shops with/without prefecture data
SELECT 
    'Shops WITH prefecture' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND prefecture IS NOT NULL AND prefecture != ''
UNION ALL
SELECT 
    'Shops WITHOUT prefecture (NULL or empty)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (prefecture IS NULL OR prefecture = '');

-- ============================================
-- 13c. Shops with/without city data
SELECT 
    'Shops WITH city' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
UNION ALL
SELECT 
    'Shops WITHOUT city (NULL or empty)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '');

-- ============================================
-- 13d. Shops with/without address
SELECT 
    'Shops WITH address' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND address IS NOT NULL AND address != ''
UNION ALL
SELECT 
    'Shops WITHOUT address (NULL or empty)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (address IS NULL OR address = '');

-- ============================================
-- 13e. Shops with/without name
SELECT 
    'Shops WITH name' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND name IS NOT NULL AND name != ''
UNION ALL
SELECT 
    'Shops WITHOUT name (NULL or empty)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (name IS NULL OR name = '');

-- ============================================
-- 13f. COMBINATIONS: Shops that might be filtered out
-- These combinations might cause shops to not display properly
SELECT 
    'Has category_id + prefecture + city' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND category_id IS NOT NULL
  AND prefecture IS NOT NULL AND prefecture != ''
  AND city IS NOT NULL AND city != ''
UNION ALL
SELECT 
    'Has category_id + prefecture (no city)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND category_id IS NOT NULL
  AND prefecture IS NOT NULL AND prefecture != ''
  AND (city IS NULL OR city = '')
UNION ALL
SELECT 
    'Has category_id (no prefecture, no city)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND category_id IS NOT NULL
  AND (prefecture IS NULL OR prefecture = '')
  AND (city IS NULL OR city = '')
UNION ALL
SELECT 
    'NO category_id (might be filtered)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND category_id IS NULL;

-- ============================================
-- 13g. COUNT BY CATEGORY: How many shops per category?
-- This might reveal if certain categories are missing shops
SELECT 
    COALESCE(c.name, 'NO CATEGORY') as category_name,
    COUNT(*) as shop_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2) as percentage_of_visible
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
WHERE s.claim_status IS NULL OR s.claim_status != 'hidden'
GROUP BY c.name, s.category_id
ORDER BY shop_count DESC
LIMIT 20;

-- ============================================
-- 13h. COUNT BY PREFECTURE: How many shops per prefecture?
-- This might reveal if certain prefectures are missing shops
SELECT 
    COALESCE(prefecture, 'NO PREFECTURE') as prefecture_name,
    COUNT(*) as shop_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2) as percentage_of_visible
FROM shops
WHERE claim_status IS NULL OR claim_status != 'hidden'
GROUP BY prefecture
ORDER BY shop_count DESC
LIMIT 20;

-- ============================================
-- 13i. ESTIMATE: Shops that would show on frontend
-- Based on common filtering criteria
SELECT 
    'Estimated Frontend Shops (has category + prefecture)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND category_id IS NOT NULL
  AND prefecture IS NOT NULL AND prefecture != ''
UNION ALL
SELECT 
    'Estimated Frontend Shops (has category + prefecture + city)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND category_id IS NOT NULL
  AND prefecture IS NOT NULL AND prefecture != ''
  AND city IS NOT NULL AND city != ''
UNION ALL
SELECT 
    'Shops Missing Critical Data (no category OR no prefecture)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage_of_visible
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (category_id IS NULL OR prefecture IS NULL OR prefecture = '');

-- ============================================
-- 13j. SAMPLE: Shops without category_id (might not show)
-- First 20 shops that might be filtered out
SELECT 
    id,
    name,
    address,
    prefecture,
    city,
    category_id,
    claim_status,
    is_verified,
    created_at
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND category_id IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 13k. SAMPLE: Shops without prefecture (might not show)
-- First 20 shops that might be filtered out
SELECT 
    id,
    name,
    address,
    prefecture,
    city,
    category_id,
    claim_status,
    is_verified,
    created_at
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (prefecture IS NULL OR prefecture = '')
ORDER BY created_at DESC
LIMIT 20;

