-- ============================================
-- FIND VERIFIED SHOPS WITH MISSING DATA
-- This helps identify why verified shops might not show on frontend
-- ============================================

-- 1. Verified shops with missing critical data
SELECT 
    id,
    name,
    address,
    prefecture,
    city,
    category_id,
    claim_status,
    is_verified,
    created_at,
    CASE 
        WHEN address IS NULL OR address = '' THEN 'Missing Address'
        WHEN prefecture IS NULL OR prefecture = '' THEN 'Missing Prefecture'
        WHEN city IS NULL OR city = '' THEN 'Missing City'
        WHEN category_id IS NULL THEN 'Missing Category'
        ELSE 'OK'
    END as missing_data_type
FROM shops
WHERE is_verified = true
  AND (
    address IS NULL OR address = ''
    OR prefecture IS NULL OR prefecture = ''
    OR city IS NULL OR city = ''
    OR category_id IS NULL
  )
ORDER BY created_at DESC;

-- ============================================
-- 2. Summary: Verified shops data completeness
SELECT 
    'Total Verified Shops' as metric,
    COUNT(*)::text as count
FROM shops
WHERE is_verified = true
UNION ALL
SELECT 
    'Verified + Has All Data (address + prefecture + city + category)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE is_verified = true
  AND address IS NOT NULL AND address != ''
  AND prefecture IS NOT NULL AND prefecture != ''
  AND city IS NOT NULL AND city != ''
  AND category_id IS NOT NULL
UNION ALL
SELECT 
    'Verified + Missing Address' as metric,
    COUNT(*)::text as count
FROM shops
WHERE is_verified = true
  AND (address IS NULL OR address = '')
UNION ALL
SELECT 
    'Verified + Missing Prefecture' as metric,
    COUNT(*)::text as count
FROM shops
WHERE is_verified = true
  AND (prefecture IS NULL OR prefecture = '')
UNION ALL
SELECT 
    'Verified + Missing City' as metric,
    COUNT(*)::text as count
FROM shops
WHERE is_verified = true
  AND (city IS NULL OR city = '')
UNION ALL
SELECT 
    'Verified + Missing Category' as metric,
    COUNT(*)::text as count
FROM shops
WHERE is_verified = true
  AND category_id IS NULL
UNION ALL
SELECT 
    'Verified + Hidden (claim_status = hidden)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE is_verified = true
  AND claim_status = 'hidden'
UNION ALL
SELECT 
    'Verified + Visible (claim_status != hidden)' as metric,
    COUNT(*)::text as count
FROM shops
WHERE is_verified = true
  AND (claim_status IS NULL OR claim_status != 'hidden');

-- ============================================
-- 3. Specific shop check (replace ID with your shop ID)
-- Check a specific shop's data
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
    owner_user_id,
    created_at,
    updated_at,
    CASE 
        WHEN address IS NULL OR address = '' THEN '❌ Missing Address'
        ELSE '✅ Has Address'
    END as address_status,
    CASE 
        WHEN prefecture IS NULL OR prefecture = '' THEN '❌ Missing Prefecture'
        ELSE '✅ Has Prefecture'
    END as prefecture_status,
    CASE 
        WHEN city IS NULL OR city = '' THEN '❌ Missing City'
        ELSE '✅ Has City'
    END as city_status,
    CASE 
        WHEN category_id IS NULL THEN '❌ Missing Category'
        ELSE '✅ Has Category'
    END as category_status,
    CASE 
        WHEN is_verified = true THEN '✅ Verified'
        ELSE '❌ Not Verified'
    END as verification_status,
    CASE 
        WHEN claim_status = 'hidden' THEN '❌ Hidden'
        WHEN claim_status IS NULL OR claim_status != 'hidden' THEN '✅ Visible'
        ELSE '❓ Unknown'
    END as visibility_status
FROM shops
WHERE id = 'ac80f3bc-22e3-4449-bfd4-aa788c086d07';

-- ============================================
-- 4. All shops with same issues (missing address, prefecture, city)
-- Find all shops that might not show due to missing location data
SELECT 
    id,
    name,
    address,
    prefecture,
    city,
    category_id,
    claim_status,
    is_verified,
    created_at,
    CASE 
        WHEN address IS NULL OR address = '' THEN 'Missing Address'
        WHEN prefecture IS NULL OR prefecture = '' THEN 'Missing Prefecture'
        WHEN city IS NULL OR city = '' THEN 'Missing City'
        WHEN category_id IS NULL THEN 'Missing Category'
        ELSE 'OK'
    END as issue
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (
    address IS NULL OR address = ''
    OR prefecture IS NULL OR prefecture = ''
    OR city IS NULL OR city = ''
  )
ORDER BY is_verified DESC, created_at DESC
LIMIT 100;

-- ============================================
-- 5. Count shops that won't show due to missing data
SELECT 
    'Shops Missing Address' as issue,
    COUNT(*)::text as count,
    COUNT(CASE WHEN is_verified = true THEN 1 END)::text as verified_count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (address IS NULL OR address = '')
UNION ALL
SELECT 
    'Shops Missing Prefecture' as issue,
    COUNT(*)::text as count,
    COUNT(CASE WHEN is_verified = true THEN 1 END)::text as verified_count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (prefecture IS NULL OR prefecture = '')
UNION ALL
SELECT 
    'Shops Missing City' as issue,
    COUNT(*)::text as count,
    COUNT(CASE WHEN is_verified = true THEN 1 END)::text as verified_count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (city IS NULL OR city = '')
UNION ALL
SELECT 
    'Shops Missing Category' as issue,
    COUNT(*)::text as count,
    COUNT(CASE WHEN is_verified = true THEN 1 END)::text as verified_count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND category_id IS NULL
UNION ALL
SELECT 
    'Shops Missing Address AND Prefecture AND City' as issue,
    COUNT(*)::text as count,
    COUNT(CASE WHEN is_verified = true THEN 1 END)::text as verified_count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (address IS NULL OR address = '')
  AND (prefecture IS NULL OR prefecture = '')
  AND (city IS NULL OR city = '');

