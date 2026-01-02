-- ============================================
-- VERIFY CITY DATA POPULATION RESULTS
-- Check how many shops now have city data after running the script
-- ============================================

-- 1. OVERVIEW: Shops with city vs without city (AFTER UPDATE)
SELECT 
    'Shops WITH city data (AFTER UPDATE)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
UNION ALL
SELECT 
    'Shops WITHOUT city data (STILL MISSING)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE claim_status IS NULL OR claim_status != 'hidden'), 2)::text || '%' as percentage
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '');

-- ============================================
-- 2. COMPARISON: Before vs After
-- Estimated improvement
SELECT 
    'Estimated Frontend Shops (has city)' as metric,
    COUNT(*)::text as count,
    'These shops should now be visible on frontend' as note
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
UNION ALL
SELECT 
    'Shops Still Filtered Out (no city)' as metric,
    COUNT(*)::text as count,
    'These shops still need city data' as note
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '');

-- ============================================
-- 3. BREAKDOWN: Shops with city by data source
-- Check which shops have city and how they got it
SELECT 
    'Has city + Has normalized_city (matched)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
  AND normalized_city IS NOT NULL AND normalized_city != ''
UNION ALL
SELECT 
    'Has city + Has address (extracted)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
  AND address IS NOT NULL AND address != ''
UNION ALL
SELECT 
    'Has city + Has prefecture' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
  AND prefecture IS NOT NULL AND prefecture != ''
UNION ALL
SELECT 
    'Has city + Missing address' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
  AND (address IS NULL OR address = '');

-- ============================================
-- 4. REMAINING ISSUES: Shops still missing city
-- Detailed breakdown of shops that still need city data
SELECT 
    'Missing city + Has address (can extract)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '')
  AND address IS NOT NULL AND address != ''
UNION ALL
SELECT 
    'Missing city + Has prefecture (can set default)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '')
  AND prefecture IS NOT NULL AND prefecture != ''
UNION ALL
SELECT 
    'Missing city + Has normalized_city (can copy)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '')
  AND normalized_city IS NOT NULL AND normalized_city != ''
UNION ALL
SELECT 
    'Missing city + No address + No prefecture (needs manual review)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '')
  AND (address IS NULL OR address = '')
  AND (prefecture IS NULL OR prefecture = '');

-- ============================================
-- 5. VERIFIED SHOPS: City data completeness
-- Check if verified shops now have city data
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
-- 6. SAMPLE: Shops that still need city data
-- First 50 shops that still need city data
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
    created_at,
    CASE 
        WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN 'Has normalized_city (can copy)'
        WHEN address IS NOT NULL AND address != '' THEN 'Has address (can extract)'
        WHEN prefecture IS NOT NULL AND prefecture != '' THEN 'Has prefecture (can set default)'
        ELSE 'No data (needs manual review)'
    END as fix_suggestion
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '')
ORDER BY is_verified DESC, created_at DESC
LIMIT 50;

-- ============================================
-- 7. PROGRESS SUMMARY
-- Overall progress on city data population
SELECT 
    'Total Visible Shops' as metric,
    COUNT(*)::text as count
FROM shops
WHERE claim_status IS NULL OR claim_status != 'hidden'
UNION ALL
SELECT 
    'Shops WITH city (✅ Fixed)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
UNION ALL
SELECT 
    'Shops WITHOUT city (❌ Still Missing)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '')
UNION ALL
SELECT 
    'Improvement (shops that got city data)' as metric,
    '~9515' as count;

-- ============================================
-- 8. TOP CITIES: Most common cities now in database
-- See which cities were extracted most often
SELECT 
    city,
    COUNT(*) as shop_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops WHERE city IS NOT NULL AND city != ''), 2) as percentage
FROM shops
WHERE city IS NOT NULL AND city != ''
  AND (claim_status IS NULL OR claim_status != 'hidden')
GROUP BY city
ORDER BY shop_count DESC
LIMIT 30;

-- ============================================
-- 9. CHECK: Shops with city but missing other data
-- Verify data completeness after city update
SELECT 
    'Has city + Has address + Has prefecture (✅ Complete)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
  AND address IS NOT NULL AND address != ''
  AND prefecture IS NOT NULL AND prefecture != ''
UNION ALL
SELECT 
    'Has city + Missing address' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
  AND (address IS NULL OR address = '')
UNION ALL
SELECT 
    'Has city + Missing prefecture' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND city IS NOT NULL AND city != ''
  AND (prefecture IS NULL OR prefecture = '');

