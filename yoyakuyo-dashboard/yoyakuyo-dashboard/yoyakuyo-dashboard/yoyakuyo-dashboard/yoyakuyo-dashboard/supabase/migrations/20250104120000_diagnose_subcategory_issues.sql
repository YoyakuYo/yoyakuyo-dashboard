-- ============================================================================
-- DIAGNOSE SUBCATEGORY ISSUES - UNDERSTAND CURRENT STATE
-- ============================================================================
-- This query analyzes the subcategory assignment problem
-- ============================================================================

-- ============================================================================
-- DIAGNOSTIC 1: Current subcategories and their counts
-- ============================================================================
SELECT 
    'Current Subcategories' AS diagnostic_type,
    COALESCE(subcategory, 'NULL') AS subcategory_name,
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
WHERE (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != ''
GROUP BY subcategory
ORDER BY shop_count DESC;

-- ============================================================================
-- DIAGNOSTIC 2: Shops by Category with Subcategory status
-- ============================================================================
SELECT 
    'Category vs Subcategory Status' AS diagnostic_type,
    c.name AS category_name,
    COUNT(*) AS total_shops,
    COUNT(CASE WHEN s.subcategory IS NOT NULL AND s.subcategory != '' THEN 1 END) AS shops_with_subcategory,
    COUNT(CASE WHEN s.subcategory IS NULL OR s.subcategory = '' THEN 1 END) AS shops_without_subcategory,
    ROUND(COUNT(CASE WHEN s.subcategory IS NOT NULL AND s.subcategory != '' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS subcategory_coverage_percentage
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
GROUP BY c.id, c.name
ORDER BY total_shops DESC;

-- ============================================================================
-- DIAGNOSTIC 3: Sample shops without subcategory by category
-- ============================================================================
SELECT 
    'Sample Shops Without Subcategory' AS diagnostic_type,
    c.name AS category_name,
    s.id,
    s.name AS shop_name,
    s.subcategory AS current_subcategory,
    s.category_id
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
WHERE (s.subcategory IS NULL OR s.subcategory = '')
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

-- ============================================================================
-- DIAGNOSTIC 4: Category names that might indicate subcategory
-- ============================================================================
SELECT 
    'Category Names Analysis' AS diagnostic_type,
    c.name AS category_name,
    COUNT(*) AS shop_count,
    CASE 
        WHEN c.name IN ('Hair Salon', 'Nail Salon', 'Eyelash / Eyebrow', 'Beauty Salon', 'General Salon', 'Barbershop', 'Waxing') THEN 'Beauty Services'
        WHEN c.name IN ('Spa', 'Massages', 'Onsen', 'Ryokan Onsen') THEN 'Spa & Relaxation'
        WHEN c.name IN ('Hotel', 'Boutique Hotel', 'Guest House', 'Ryokan Stay') THEN 'Accommodation'
        WHEN c.name IN ('Restaurant', 'Izakaya', 'Karaoke') THEN 'Food & Entertainment'
        WHEN c.name IN ('Dental Clinic', 'Eye Clinic', 'Women''s Clinic', 'Wellness Clinic', 'Aesthetic Clinic') THEN 'Medical & Wellness'
        WHEN c.name IN ('Golf', 'Golf Practice Range', 'Pilates', 'Yoga') THEN 'Sports & Fitness'
        ELSE 'Other'
    END AS category_group
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE (
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
-- DIAGNOSTIC 5: Check if subcategory field exists in shops table
-- ============================================================================
SELECT 
    'Subcategory Column Check' AS diagnostic_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'shops'
AND column_name = 'subcategory';

-- ============================================================================
-- DIAGNOSTIC 6: Distribution of shops with/without subcategory
-- ============================================================================
SELECT 
    'Subcategory Distribution' AS diagnostic_type,
    CASE 
        WHEN subcategory IS NULL THEN 'NULL subcategory'
        WHEN subcategory = '' THEN 'Empty string subcategory'
        WHEN TRIM(subcategory) = '' THEN 'Whitespace only subcategory'
        ELSE 'Has subcategory'
    END AS subcategory_status,
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
WHERE (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != ''
GROUP BY 
    CASE 
        WHEN subcategory IS NULL THEN 'NULL subcategory'
        WHEN subcategory = '' THEN 'Empty string subcategory'
        WHEN TRIM(subcategory) = '' THEN 'Whitespace only subcategory'
        ELSE 'Has subcategory'
    END
ORDER BY shop_count DESC;

