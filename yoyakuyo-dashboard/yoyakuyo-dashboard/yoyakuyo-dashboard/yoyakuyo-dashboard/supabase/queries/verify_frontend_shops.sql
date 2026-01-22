-- ============================================
-- VERIFY FRONTEND SHOP VISIBILITY
-- This query set helps verify which shops are visible on the frontend
-- and which are hidden, plus identifies duplicates
-- ============================================

-- 1. OVERVIEW: Total Shops vs Visible vs Hidden
-- Shows the breakdown of all shops by visibility status
SELECT 
    'Total Shops in Database' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2)::text || '%' as percentage
FROM shops
UNION ALL
SELECT 
    'Visible Shops (Frontend)' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2)::text || '%' as percentage
FROM shops
WHERE claim_status IS NULL OR claim_status != 'hidden'
UNION ALL
SELECT 
    'Hidden Shops' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2)::text || '%' as percentage
FROM shops
WHERE claim_status = 'hidden'
UNION ALL
SELECT 
    'Shops with NULL claim_status' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2)::text || '%' as percentage
FROM shops
WHERE claim_status IS NULL
UNION ALL
SELECT 
    'Shops with claim_status = unclaimed' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2)::text || '%' as percentage
FROM shops
WHERE claim_status = 'unclaimed'
UNION ALL
SELECT 
    'Shops with claim_status = approved' as metric,
    COUNT(*)::text as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2)::text || '%' as percentage
FROM shops
WHERE claim_status = 'approved';

-- ============================================
-- 2. BREAKDOWN BY claim_status
-- Detailed breakdown of all claim_status values
SELECT 
    COALESCE(claim_status, 'NULL') as claim_status,
    COUNT(*) as shop_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2) as percentage,
    CASE 
        WHEN claim_status IS NULL OR claim_status != 'hidden' THEN 'VISIBLE'
        ELSE 'HIDDEN'
    END as visibility
FROM shops
GROUP BY claim_status
ORDER BY shop_count DESC;

-- ============================================
-- 3. BREAKDOWN BY is_verified
-- Shows verified vs unverified shops
SELECT 
    COALESCE(is_verified::text, 'NULL') as is_verified,
    COUNT(*) as shop_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2) as percentage,
    COUNT(CASE WHEN claim_status IS NULL OR claim_status != 'hidden' THEN 1 END) as visible_count,
    COUNT(CASE WHEN claim_status = 'hidden' THEN 1 END) as hidden_count
FROM shops
GROUP BY is_verified
ORDER BY shop_count DESC;

-- ============================================
-- 4. VISIBLE SHOPS BREAKDOWN
-- Detailed breakdown of visible shops only
SELECT 
    'Total Visible Shops' as metric,
    COUNT(*)::text as count
FROM shops
WHERE claim_status IS NULL OR claim_status != 'hidden'
UNION ALL
SELECT 
    'Visible + Verified' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND is_verified = true
UNION ALL
SELECT 
    'Visible + Unverified' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND (is_verified = false OR is_verified IS NULL)
UNION ALL
SELECT 
    'Visible + Has Category' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND category_id IS NOT NULL
UNION ALL
SELECT 
    'Visible + No Category' as metric,
    COUNT(*)::text as count
FROM shops
WHERE (claim_status IS NULL OR claim_status != 'hidden')
  AND category_id IS NULL;

-- ============================================
-- 5. HIDDEN SHOPS BREAKDOWN
-- Detailed breakdown of hidden shops
SELECT 
    'Total Hidden Shops' as metric,
    COUNT(*)::text as count
FROM shops
WHERE claim_status = 'hidden'
UNION ALL
SELECT 
    'Hidden + Verified' as metric,
    COUNT(*)::text as count
FROM shops
WHERE claim_status = 'hidden'
  AND is_verified = true
UNION ALL
SELECT 
    'Hidden + Unverified' as metric,
    COUNT(*)::text as count
FROM shops
WHERE claim_status = 'hidden'
  AND (is_verified = false OR is_verified IS NULL)
UNION ALL
SELECT 
    'Hidden + Has Category' as metric,
    COUNT(*)::text as count
FROM shops
WHERE claim_status = 'hidden'
  AND category_id IS NOT NULL
UNION ALL
SELECT 
    'Hidden + No Category' as metric,
    COUNT(*)::text as count
FROM shops
WHERE claim_status = 'hidden'
  AND category_id IS NULL;

-- ============================================
-- 6. DUPLICATES: Shops with duplicate names (VISIBLE only)
-- Shows duplicate names among visible shops
SELECT 
    LOWER(TRIM(name)) as normalized_name,
    MIN(name) as original_name,
    COUNT(*) as duplicate_count,
    COUNT(CASE WHEN claim_status = 'hidden' THEN 1 END) as hidden_count,
    COUNT(CASE WHEN claim_status IS NULL OR claim_status != 'hidden' THEN 1 END) as visible_count
FROM shops
WHERE name IS NOT NULL AND name != ''
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, normalized_name
LIMIT 100;

-- ============================================
-- 7. DUPLICATES: Shops with duplicate addresses (VISIBLE only)
-- Shows duplicate addresses among visible shops
SELECT 
    LOWER(TRIM(address)) as normalized_address,
    MIN(address) as original_address,
    COUNT(*) as duplicate_count,
    COUNT(CASE WHEN claim_status = 'hidden' THEN 1 END) as hidden_count,
    COUNT(CASE WHEN claim_status IS NULL OR claim_status != 'hidden' THEN 1 END) as visible_count
FROM shops
WHERE address IS NOT NULL AND address != ''
GROUP BY LOWER(TRIM(address))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, normalized_address
LIMIT 100;

-- ============================================
-- 8. DUPLICATES: Shops with duplicate name+address (VISIBLE only)
-- Shows exact duplicates (same name AND address) among visible shops
SELECT 
    LOWER(TRIM(name)) as normalized_name,
    LOWER(TRIM(address)) as normalized_address,
    MIN(name) as original_name,
    MIN(address) as original_address,
    COUNT(*) as duplicate_count,
    COUNT(CASE WHEN claim_status = 'hidden' THEN 1 END) as hidden_count,
    COUNT(CASE WHEN claim_status IS NULL OR claim_status != 'hidden' THEN 1 END) as visible_count
FROM shops
WHERE name IS NOT NULL AND name != '' 
  AND address IS NOT NULL AND address != ''
GROUP BY LOWER(TRIM(name)), LOWER(TRIM(address))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, normalized_name, normalized_address
LIMIT 100;

-- ============================================
-- 9. COMPARISON: Visible vs Hidden Duplicates
-- Compares duplicate counts between visible and hidden shops
SELECT 
    'Total Duplicate Names (All Shops)' as metric,
    COUNT(DISTINCT LOWER(TRIM(name)))::text as count
FROM (
    SELECT LOWER(TRIM(name)) as name
    FROM shops
    WHERE name IS NOT NULL AND name != ''
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 
    'Duplicate Names (Visible Only)' as metric,
    COUNT(DISTINCT LOWER(TRIM(name)))::text as count
FROM (
    SELECT LOWER(TRIM(name)) as name
    FROM shops
    WHERE name IS NOT NULL AND name != ''
      AND (claim_status IS NULL OR claim_status != 'hidden')
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 
    'Duplicate Names (Hidden Only)' as metric,
    COUNT(DISTINCT LOWER(TRIM(name)))::text as count
FROM (
    SELECT LOWER(TRIM(name)) as name
    FROM shops
    WHERE name IS NOT NULL AND name != ''
      AND claim_status = 'hidden'
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 
    'Total Duplicate Addresses (All Shops)' as metric,
    COUNT(DISTINCT LOWER(TRIM(address)))::text as count
FROM (
    SELECT LOWER(TRIM(address)) as address
    FROM shops
    WHERE address IS NOT NULL AND address != ''
    GROUP BY LOWER(TRIM(address))
    HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 
    'Duplicate Addresses (Visible Only)' as metric,
    COUNT(DISTINCT LOWER(TRIM(address)))::text as count
FROM (
    SELECT LOWER(TRIM(address)) as address
    FROM shops
    WHERE address IS NOT NULL AND address != ''
      AND (claim_status IS NULL OR claim_status != 'hidden')
    GROUP BY LOWER(TRIM(address))
    HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 
    'Duplicate Addresses (Hidden Only)' as metric,
    COUNT(DISTINCT LOWER(TRIM(address)))::text as count
FROM (
    SELECT LOWER(TRIM(address)) as address
    FROM shops
    WHERE address IS NOT NULL AND address != ''
      AND claim_status = 'hidden'
    GROUP BY LOWER(TRIM(address))
    HAVING COUNT(*) > 1
) duplicates;

-- ============================================
-- 10. SAMPLE: Visible shops that are duplicates
-- Shows first 50 visible shops that have duplicate names
WITH duplicate_names AS (
    SELECT LOWER(TRIM(name)) as normalized_name
    FROM shops
    WHERE name IS NOT NULL AND name != ''
      AND (claim_status IS NULL OR claim_status != 'hidden')
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
    LIMIT 20
)
SELECT 
    s.id,
    s.name,
    s.address,
    s.prefecture,
    s.city,
    s.claim_status,
    s.is_verified,
    s.category_id,
    s.created_at,
    LOWER(TRIM(s.name)) as normalized_name
FROM shops s
INNER JOIN duplicate_names dn ON LOWER(TRIM(s.name)) = dn.normalized_name
WHERE s.claim_status IS NULL OR s.claim_status != 'hidden'
ORDER BY LOWER(TRIM(s.name)), s.created_at
LIMIT 50;

-- ============================================
-- 11. SAMPLE: Hidden shops that are duplicates
-- Shows first 50 hidden shops that have duplicate names
WITH duplicate_names AS (
    SELECT LOWER(TRIM(name)) as normalized_name
    FROM shops
    WHERE name IS NOT NULL AND name != ''
      AND claim_status = 'hidden'
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
    LIMIT 20
)
SELECT 
    s.id,
    s.name,
    s.address,
    s.prefecture,
    s.city,
    s.claim_status,
    s.is_verified,
    s.category_id,
    s.created_at,
    LOWER(TRIM(s.name)) as normalized_name
FROM shops s
INNER JOIN duplicate_names dn ON LOWER(TRIM(s.name)) = dn.normalized_name
WHERE s.claim_status = 'hidden'
ORDER BY LOWER(TRIM(s.name)), s.created_at
LIMIT 50;

-- ============================================
-- 12. SUMMARY: Frontend Display Analysis
-- Final summary comparing what frontend shows vs database
SELECT 
    'Database Total' as category,
    COUNT(*)::text as count
FROM shops
UNION ALL
SELECT 
    'Frontend Visible (claim_status != hidden)' as category,
    COUNT(*)::text as count
FROM shops
WHERE claim_status IS NULL OR claim_status != 'hidden'
UNION ALL
SELECT 
    'Frontend Hidden (claim_status = hidden)' as category,
    COUNT(*)::text as count
FROM shops
WHERE claim_status = 'hidden'
UNION ALL
SELECT 
    'Visible Duplicate Names' as category,
    COUNT(*)::text as count
FROM (
    SELECT LOWER(TRIM(name)) as name
    FROM shops
    WHERE name IS NOT NULL AND name != ''
      AND (claim_status IS NULL OR claim_status != 'hidden')
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 
    'Visible Duplicate Addresses' as category,
    COUNT(*)::text as count
FROM (
    SELECT LOWER(TRIM(address)) as address
    FROM shops
    WHERE address IS NOT NULL AND address != ''
      AND (claim_status IS NULL OR claim_status != 'hidden')
    GROUP BY LOWER(TRIM(address))
    HAVING COUNT(*) > 1
) duplicates;

