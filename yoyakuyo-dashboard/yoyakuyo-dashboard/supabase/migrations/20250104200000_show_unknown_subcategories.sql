-- ============================================================================
-- SHOW UNKNOWN SHOPS BY SUBCATEGORY - IDENTIFY WHAT VALUES EXIST
-- ============================================================================
-- This query shows what subcategory values are in Unknown shops
-- Use this to create targeted categorization
-- ============================================================================

-- ============================================================================
-- QUERY 1: Unknown shops grouped by subcategory
-- ============================================================================
SELECT 
    'Unknown Shops by Subcategory' AS report_type,
    COALESCE(subcategory, 'NULL') AS subcategory_value,
    COUNT(*) AS shop_count,
    COUNT(*) * 100.0 / NULLIF((
        SELECT COUNT(*) FROM shops s2
        JOIN categories c2 ON s2.category_id = c2.id
        WHERE c2.name = 'Unknown'
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR s2.deleted_at IS NULL
        )
        AND s2.address IS NOT NULL 
        AND s2.address != ''
    ), 0) AS percentage
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name = 'Unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
GROUP BY subcategory
ORDER BY shop_count DESC;

-- ============================================================================
-- QUERY 2: Sample shops for each subcategory value
-- ============================================================================
SELECT 
    'Sample Unknown Shops by Subcategory' AS report_type,
    subcategory,
    s.id,
    s.name AS shop_name,
    s.address
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name = 'Unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
ORDER BY subcategory, s.name
LIMIT 200;

