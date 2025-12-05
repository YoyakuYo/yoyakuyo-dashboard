-- ============================================================================
-- RECALCULATE CATEGORY COUNTS AFTER DEDUPLICATION
-- ============================================================================
-- This migration ensures category counts are accurate after deduplication
-- It doesn't modify data, just provides verification queries
-- NOTE: Works with or without deleted_at and claim_status columns
-- ============================================================================

-- ============================================================================
-- VERIFICATION: Category counts (excluding soft-deleted and hidden shops)
-- ============================================================================
SELECT 
    'Category Shop Counts (Clean)' AS report_type,
    c.name AS category_name,
    COUNT(s.id) AS shop_count
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id 
    AND (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'deleted_at'
        )
        OR s.deleted_at IS NULL
    )
    AND (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'claim_status'
        )
        OR s.claim_status IS NULL 
        OR s.claim_status != 'hidden'
    )
    AND s.address IS NOT NULL 
    AND s.address != ''
GROUP BY c.id, c.name
ORDER BY shop_count DESC;

-- ============================================================================
-- VERIFICATION: Total counts comparison
-- ============================================================================
SELECT 
    'Total Count Comparison' AS report_type,
    (SELECT COUNT(*) FROM shops 
     WHERE (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'deleted_at'
        )
        OR deleted_at IS NULL
     )) AS total_active_shops,
    (SELECT COUNT(*) FROM shops 
     WHERE (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'deleted_at'
        )
        OR deleted_at IS NULL
     )
     AND (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'claim_status'
        )
        OR claim_status IS NULL 
        OR claim_status != 'hidden'
     )
     AND address IS NOT NULL 
     AND address != '') AS total_visible_shops,
    (SELECT COUNT(*) FROM shops 
     WHERE EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
     )
     AND deleted_at IS NOT NULL) AS total_soft_deleted_shops;

-- ============================================================================
-- VERIFICATION: Restaurant count (should match after deduplication)
-- ============================================================================
SELECT 
    'Restaurant Count Verification' AS report_type,
    COUNT(*) AS total_restaurants,
    COUNT(DISTINCT COALESCE(s.unique_id, 
        CONCAT(
            COALESCE(s.name, ''), 
            '|', 
            COALESCE(ROUND(s.latitude::numeric, 4)::text, ''), 
            '|', 
            COALESCE(ROUND(s.longitude::numeric, 4)::text, '')
        )
    )) AS unique_restaurants,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT COALESCE(s.unique_id, 
            CONCAT(
                COALESCE(s.name, ''), 
                '|', 
                COALESCE(ROUND(s.latitude::numeric, 4)::text, ''), 
                '|', 
                COALESCE(ROUND(s.longitude::numeric, 4)::text, '')
            )
        )) THEN '✅ No duplicates'
        ELSE '❌ Duplicates still exist'
    END AS status
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE 
    c.name = 'Restaurant'
    AND (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'deleted_at'
        )
        OR s.deleted_at IS NULL
    )
    AND (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'claim_status'
        )
        OR s.claim_status IS NULL 
        OR s.claim_status != 'hidden'
    )
    AND s.address IS NOT NULL 
    AND s.address != '';

-- ============================================================================
-- VERIFICATION: Prefecture counts
-- ============================================================================
SELECT 
    'Prefecture Shop Counts' AS report_type,
    COALESCE(prefecture, 'Unknown') AS prefecture,
    COUNT(*) AS shop_count
FROM shops
WHERE 
    (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'deleted_at'
        )
        OR deleted_at IS NULL
    )
    AND (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'claim_status'
        )
        OR claim_status IS NULL 
        OR claim_status != 'hidden'
    )
    AND address IS NOT NULL 
    AND address != ''
GROUP BY prefecture
ORDER BY shop_count DESC;
