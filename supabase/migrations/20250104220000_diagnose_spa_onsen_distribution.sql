-- ============================================================================
-- DIAGNOSE SPA, ONSEN & RELAXATION CATEGORY DISTRIBUTION
-- ============================================================================
-- This query checks how many shops are in the parent category vs subcategories
-- ============================================================================

-- ============================================================================
-- QUERY 1: Shop count in parent "Spa, Onsen & Relaxation" category
-- ============================================================================
SELECT 
    'Parent Category: Spa, Onsen & Relaxation' AS category_type,
    COUNT(*) AS shop_count
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name = 'Spa, Onsen & Relaxation'
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
-- QUERY 2: Shop count in each subcategory
-- ============================================================================
SELECT 
    'Subcategory: ' || c.name AS category_type,
    COUNT(*) AS shop_count
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name IN ('Spa', 'Massages', 'Onsen', 'Ryokan Onsen', 'Spa & Massage', 'Onsen & Ryokan')
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
-- QUERY 3: Sample shops in parent "Spa, Onsen & Relaxation" category
-- ============================================================================
SELECT 
    s.id,
    s.name AS shop_name,
    s.subcategory,
    s.address
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name = 'Spa, Onsen & Relaxation'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
ORDER BY s.name
LIMIT 50;

-- ============================================================================
-- QUERY 4: Shops with spa/onsen-related names in OTHER categories
-- ============================================================================
SELECT 
    c.name AS current_category,
    COUNT(*) AS shop_count,
    STRING_AGG(DISTINCT s.subcategory, ', ') AS subcategories
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE (
    LOWER(s.name) LIKE '%spa%' OR
    LOWER(s.name) LIKE '%スパ%' OR
    LOWER(s.name) LIKE '%massage%' OR
    LOWER(s.name) LIKE '%マッサージ%' OR
    LOWER(s.name) LIKE '%onsen%' OR
    LOWER(s.name) LIKE '%温泉%' OR
    LOWER(s.name) LIKE '%relax%' OR
    LOWER(s.name) LIKE '%リラク%' OR
    LOWER(s.name) LIKE '%ryokan%' OR
    LOWER(s.name) LIKE '%旅館%' OR
    LOWER(s.address) LIKE '%spa%' OR
    LOWER(s.address) LIKE '%スパ%' OR
    LOWER(s.address) LIKE '%onsen%' OR
    LOWER(s.address) LIKE '%温泉%'
)
AND c.name NOT IN ('Spa, Onsen & Relaxation', 'Spa', 'Massages', 'Onsen', 'Ryokan Onsen', 'Spa & Massage', 'Onsen & Ryokan')
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
-- QUERY 5: Shops with spa/onsen-related names in "Unknown" category
-- ============================================================================
SELECT 
    s.id,
    s.name AS shop_name,
    s.subcategory,
    s.address
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name = 'Unknown'
AND (
    LOWER(s.name) LIKE '%spa%' OR
    LOWER(s.name) LIKE '%スパ%' OR
    LOWER(s.name) LIKE '%massage%' OR
    LOWER(s.name) LIKE '%マッサージ%' OR
    LOWER(s.name) LIKE '%onsen%' OR
    LOWER(s.name) LIKE '%温泉%' OR
    LOWER(s.name) LIKE '%relax%' OR
    LOWER(s.name) LIKE '%リラク%' OR
    LOWER(s.name) LIKE '%ryokan%' OR
    LOWER(s.name) LIKE '%旅館%' OR
    LOWER(s.address) LIKE '%spa%' OR
    LOWER(s.address) LIKE '%スパ%' OR
    LOWER(s.address) LIKE '%onsen%' OR
    LOWER(s.address) LIKE '%温泉%'
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
ORDER BY s.name
LIMIT 100;

