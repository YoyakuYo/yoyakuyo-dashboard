-- ============================================================================
-- DIAGNOSE CATEGORY HIERARCHY - UNDERSTAND PARENT VS SUBCATEGORY STRUCTURE
-- ============================================================================
-- This query identifies parent categories and their subcategories
-- ============================================================================

-- ============================================================================
-- DIAGNOSTIC 1: All categories and their shop counts
-- ============================================================================
SELECT 
    'All Categories' AS diagnostic_type,
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
ORDER BY shop_count DESC;

-- ============================================================================
-- DIAGNOSTIC 2: Identify potential parent categories
-- ============================================================================
-- Parent categories typically have "&" or are broader terms
SELECT 
    'Potential Parent Categories' AS diagnostic_type,
    c.name AS category_name,
    COUNT(s.id) AS shop_count,
    CASE 
        WHEN c.name LIKE '%&%' THEN 'Likely Parent (contains &)'
        WHEN c.name IN ('Beauty Services', 'Dining & Izakaya', 'Hotels & Stays', 
                       'Spa, Onsen & Relaxation', 'Clinics & Medical Care', 
                       'Activities & Sports') THEN 'Confirmed Parent'
        ELSE 'Likely Subcategory'
    END AS category_type
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
HAVING COUNT(s.id) > 0
ORDER BY shop_count DESC;

-- ============================================================================
-- DIAGNOSTIC 3: Shops assigned to parent categories
-- ============================================================================
SELECT 
    'Shops in Parent Categories' AS diagnostic_type,
    c.name AS parent_category,
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
JOIN categories c ON s.category_id = c.id
WHERE c.name IN (
    'Beauty Services',
    'Dining & Izakaya',
    'Hotels & Stays',
    'Spa, Onsen & Relaxation',
    'Clinics & Medical Care',
    'Activities & Sports'
)
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
GROUP BY c.name
ORDER BY shop_count DESC;

-- ============================================================================
-- DIAGNOSTIC 4: Sample shops in parent categories
-- ============================================================================
SELECT 
    'Sample Shops in Parent Categories' AS diagnostic_type,
    c.name AS parent_category,
    s.id,
    s.name AS shop_name,
    s.subcategory AS current_subcategory,
    s.category_id
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name IN (
    'Beauty Services',
    'Dining & Izakaya',
    'Hotels & Stays',
    'Spa, Onsen & Relaxation',
    'Clinics & Medical Care',
    'Activities & Sports'
)
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
ORDER BY c.name, s.name
LIMIT 50;

