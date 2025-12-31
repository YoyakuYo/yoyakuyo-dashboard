-- ============================================================================
-- VERIFY PREFECTURE DATA QUALITY - COMPREHENSIVE VERIFICATION
-- ============================================================================
-- This migration verifies that all prefecture data is clean and normalized
-- ============================================================================

-- ============================================================================
-- VERIFICATION 1: Total shops with valid prefecture
-- ============================================================================
SELECT 
    'Total Shops with Valid Prefecture' AS verification_type,
    COUNT(*) AS shop_count,
    COUNT(*) * 100.0 / NULLIF((
        SELECT COUNT(*) FROM shops 
        WHERE (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != ''
    ), 0) AS percentage
FROM shops
WHERE prefecture IS NOT NULL
AND prefecture != 'Unknown'
AND LOWER(prefecture) != 'unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != '';

-- ============================================================================
-- VERIFICATION 2: Shops with NULL or Unknown prefecture (should be 0)
-- ============================================================================
SELECT 
    'Shops with NULL/Unknown Prefecture (Should be 0)' AS verification_type,
    COUNT(*) AS shop_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END AS status
FROM shops
WHERE (prefecture IS NULL OR prefecture = 'Unknown' OR LOWER(prefecture) = 'unknown')
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != '';

-- ============================================================================
-- VERIFICATION 3: Prefecture distribution (all 47 prefectures)
-- ============================================================================
SELECT 
    'Prefecture Distribution' AS verification_type,
    prefecture,
    COUNT(*) AS shop_count,
    COUNT(*) * 100.0 / NULLIF((
        SELECT COUNT(*) FROM shops 
        WHERE (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != ''
        AND prefecture IS NOT NULL
        AND prefecture != 'Unknown'
        AND LOWER(prefecture) != 'unknown'
    ), 0) AS percentage
FROM shops
WHERE prefecture IS NOT NULL
AND prefecture != 'Unknown'
AND LOWER(prefecture) != 'unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != ''
GROUP BY prefecture
ORDER BY shop_count DESC;

-- ============================================================================
-- VERIFICATION 4: Check for case sensitivity issues (should be 0)
-- ============================================================================
SELECT 
    'Case Sensitivity Issues (Should be 0)' AS verification_type,
    COUNT(DISTINCT LOWER(prefecture)) AS unique_lowercase_prefectures,
    COUNT(DISTINCT prefecture) AS unique_prefectures,
    CASE 
        WHEN COUNT(DISTINCT LOWER(prefecture)) = COUNT(DISTINCT prefecture) THEN '✅ PASS - No case duplicates'
        ELSE '❌ FAIL - Case duplicates found'
    END AS status
FROM shops
WHERE prefecture IS NOT NULL
AND prefecture != 'Unknown'
AND LOWER(prefecture) != 'unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != '';

-- ============================================================================
-- VERIFICATION 5: Top 10 prefectures by shop count
-- ============================================================================
SELECT 
    'Top 10 Prefectures by Shop Count' AS verification_type,
    prefecture,
    COUNT(*) AS shop_count
FROM shops
WHERE prefecture IS NOT NULL
AND prefecture != 'Unknown'
AND LOWER(prefecture) != 'unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != ''
GROUP BY prefecture
ORDER BY shop_count DESC
LIMIT 10;

-- ============================================================================
-- VERIFICATION 6: Prefectures with very few shops (< 10)
-- ============================================================================
SELECT 
    'Prefectures with Few Shops (< 10)' AS verification_type,
    prefecture,
    COUNT(*) AS shop_count
FROM shops
WHERE prefecture IS NOT NULL
AND prefecture != 'Unknown'
AND LOWER(prefecture) != 'unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != ''
GROUP BY prefecture
HAVING COUNT(*) < 10
ORDER BY shop_count ASC;

-- ============================================================================
-- VERIFICATION 7: Data completeness check
-- ============================================================================
SELECT 
    'Data Completeness Check' AS verification_type,
    COUNT(*) AS total_shops,
    COUNT(prefecture) AS shops_with_prefecture,
    COUNT(*) - COUNT(prefecture) AS shops_without_prefecture,
    ROUND(COUNT(prefecture) * 100.0 / NULLIF(COUNT(*), 0), 2) AS completeness_percentage,
    CASE 
        WHEN COUNT(*) - COUNT(prefecture) = 0 THEN '✅ PASS - 100% complete'
        ELSE '⚠️ WARNING - Some shops missing prefecture'
    END AS status
FROM shops
WHERE (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != '';

-- ============================================================================
-- VERIFICATION 8: Verify all 47 prefectures are represented
-- ============================================================================
SELECT 
    'All 47 Prefectures Representation' AS verification_type,
    COUNT(DISTINCT prefecture) AS unique_prefectures_found,
    CASE 
        WHEN COUNT(DISTINCT prefecture) >= 45 THEN '✅ PASS - Most prefectures represented'
        WHEN COUNT(DISTINCT prefecture) >= 40 THEN '⚠️ WARNING - Some prefectures missing'
        ELSE '❌ FAIL - Many prefectures missing'
    END AS status
FROM shops
WHERE prefecture IS NOT NULL
AND prefecture != 'Unknown'
AND LOWER(prefecture) != 'unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != '';

-- ============================================================================
-- VERIFICATION 9: Sample of shops to verify normalization
-- ============================================================================
SELECT 
    'Sample Shops - Prefecture Normalization Check' AS verification_type,
    id,
    name,
    prefecture,
    city,
    SUBSTRING(address, 1, 50) AS address_sample
FROM shops
WHERE prefecture IS NOT NULL
AND prefecture != 'Unknown'
AND LOWER(prefecture) != 'unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != ''
ORDER BY RANDOM()
LIMIT 20;

-- ============================================================================
-- VERIFICATION 10: Summary statistics
-- ============================================================================
SELECT 
    'Summary Statistics' AS verification_type,
    (SELECT COUNT(*) FROM shops 
     WHERE (
         NOT EXISTS (
             SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'shops' AND column_name = 'deleted_at'
         )
         OR deleted_at IS NULL
     )
     AND address IS NOT NULL 
     AND address != '') AS total_shops,
    (SELECT COUNT(*) FROM shops 
     WHERE prefecture IS NOT NULL
     AND prefecture != 'Unknown'
     AND LOWER(prefecture) != 'unknown'
     AND (
         NOT EXISTS (
             SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'shops' AND column_name = 'deleted_at'
         )
         OR deleted_at IS NULL
     )
     AND address IS NOT NULL 
     AND address != '') AS shops_with_valid_prefecture,
    (SELECT COUNT(*) FROM shops 
     WHERE (prefecture IS NULL OR prefecture = 'Unknown' OR LOWER(prefecture) = 'unknown')
     AND (
         NOT EXISTS (
             SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'shops' AND column_name = 'deleted_at'
         )
         OR deleted_at IS NULL
     )
     AND address IS NOT NULL 
     AND address != '') AS shops_with_unknown_prefecture,
    (SELECT COUNT(DISTINCT prefecture) FROM shops 
     WHERE prefecture IS NOT NULL
     AND prefecture != 'Unknown'
     AND LOWER(prefecture) != 'unknown'
     AND (
         NOT EXISTS (
             SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'shops' AND column_name = 'deleted_at'
         )
         OR deleted_at IS NULL
     )
     AND address IS NOT NULL 
     AND address != '') AS unique_prefectures;

