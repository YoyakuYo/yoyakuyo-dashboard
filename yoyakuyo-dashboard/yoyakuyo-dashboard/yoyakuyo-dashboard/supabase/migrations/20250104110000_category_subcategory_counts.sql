-- ============================================================================
-- CATEGORY AND SUBCATEGORY SHOP COUNTS - COMPREHENSIVE REPORT
-- ============================================================================
-- This query shows shop counts for each category and subcategory
-- ============================================================================

-- ============================================================================
-- REPORT 1: Shop counts by Category (from categories table)
-- ============================================================================
SELECT 
    'Category Shop Counts' AS report_type,
    c.name AS category_name,
    COUNT(s.id) AS shop_count,
    COUNT(s.id) * 100.0 / NULLIF((
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
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
    AND (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'deleted_at'
        )
        OR s.deleted_at IS NULL
    )
    AND s.address IS NOT NULL 
    AND s.address != ''
GROUP BY c.id, c.name
ORDER BY shop_count DESC;

-- ============================================================================
-- REPORT 2: Shop counts by Subcategory (from shops.subcategory field)
-- ============================================================================
SELECT 
    'Subcategory Shop Counts' AS report_type,
    COALESCE(s.subcategory, 'No Subcategory') AS subcategory_name,
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
FROM shops s
WHERE (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
GROUP BY s.subcategory
ORDER BY shop_count DESC;

-- ============================================================================
-- REPORT 3: Category + Subcategory Combined View
-- ============================================================================
SELECT 
    'Category + Subcategory Combined' AS report_type,
    c.name AS category_name,
    COALESCE(s.subcategory, 'No Subcategory') AS subcategory_name,
    COUNT(*) AS shop_count
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
WHERE (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
GROUP BY c.name, s.subcategory
ORDER BY c.name, shop_count DESC;

-- ============================================================================
-- REPORT 4: Shops without category assignment
-- ============================================================================
SELECT 
    'Shops Without Category' AS report_type,
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
FROM shops s
WHERE s.category_id IS NULL
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != '';

-- ============================================================================
-- REPORT 5: Shops without subcategory assignment
-- ============================================================================
SELECT 
    'Shops Without Subcategory' AS report_type,
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
FROM shops s
WHERE (s.subcategory IS NULL OR s.subcategory = '')
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != '';

-- ============================================================================
-- REPORT 6: Top 20 Categories by Shop Count
-- ============================================================================
SELECT 
    'Top 20 Categories' AS report_type,
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
    AND s.address IS NOT NULL 
    AND s.address != ''
GROUP BY c.id, c.name
ORDER BY shop_count DESC
LIMIT 20;

-- ============================================================================
-- REPORT 7: Top 20 Subcategories by Shop Count
-- ============================================================================
SELECT 
    'Top 20 Subcategories' AS report_type,
    COALESCE(s.subcategory, 'No Subcategory') AS subcategory_name,
    COUNT(*) AS shop_count
FROM shops s
WHERE (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
GROUP BY s.subcategory
ORDER BY shop_count DESC
LIMIT 20;

-- ============================================================================
-- REPORT 8: Categories with Zero Shops
-- ============================================================================
SELECT 
    'Categories with Zero Shops' AS report_type,
    c.name AS category_name,
    0 AS shop_count
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
    AND (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'deleted_at'
        )
        OR s.deleted_at IS NULL
    )
    AND s.address IS NOT NULL 
    AND s.address != ''
GROUP BY c.id, c.name
HAVING COUNT(s.id) = 0
ORDER BY c.name;

-- ============================================================================
-- REPORT 9: Summary Statistics
-- ============================================================================
SELECT 
    'Summary Statistics' AS report_type,
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
    (SELECT COUNT(DISTINCT category_id) FROM shops 
     WHERE category_id IS NOT NULL
     AND (
         NOT EXISTS (
             SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'shops' AND column_name = 'deleted_at'
         )
         OR deleted_at IS NULL
     )
     AND address IS NOT NULL 
     AND address != '') AS unique_categories_used,
    (SELECT COUNT(*) FROM categories) AS total_categories_in_db,
    (SELECT COUNT(DISTINCT subcategory) FROM shops 
     WHERE subcategory IS NOT NULL 
     AND subcategory != ''
     AND (
         NOT EXISTS (
             SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'shops' AND column_name = 'deleted_at'
         )
         OR deleted_at IS NULL
     )
     AND address IS NOT NULL 
     AND address != '') AS unique_subcategories_used,
    (SELECT COUNT(*) FROM shops 
     WHERE category_id IS NULL
     AND (
         NOT EXISTS (
             SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'shops' AND column_name = 'deleted_at'
         )
         OR deleted_at IS NULL
     )
     AND address IS NOT NULL 
     AND address != '') AS shops_without_category,
    (SELECT COUNT(*) FROM shops 
     WHERE (subcategory IS NULL OR subcategory = '')
     AND (
         NOT EXISTS (
             SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'shops' AND column_name = 'deleted_at'
         )
         OR deleted_at IS NULL
     )
     AND address IS NOT NULL 
     AND address != '') AS shops_without_subcategory;

