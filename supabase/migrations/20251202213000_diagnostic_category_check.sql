-- ============================================================================
-- DIAGNOSTIC: Check Where All Shops Are Actually Assigned
-- ============================================================================
-- Run this to see the actual distribution of shops across categories
-- ============================================================================

-- Show all categories with shop counts
SELECT 
    c.id AS category_id,
    c.name AS category_name,
    COUNT(s.id) AS shop_count,
    ROUND(COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM shops), 2) AS percentage
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
GROUP BY c.id, c.name
ORDER BY shop_count DESC
LIMIT 30;

-- Show main categories specifically
SELECT 
    c.id AS category_id,
    c.name AS category_name,
    COUNT(s.id) AS shop_count
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
WHERE c.name IN (
    'Beauty Services',
    'Spa, Onsen & Relaxation',
    'Hotels & Stays',
    'Dining & Izakaya',
    'Clinics & Medical Care',
    'Activities & Sports',
    'Unknown'
)
GROUP BY c.id, c.name
ORDER BY shop_count DESC;

-- Count shops with NULL category_id
SELECT COUNT(*) AS shops_with_null_category
FROM shops
WHERE category_id IS NULL;

-- Count total shops
SELECT COUNT(*) AS total_shops FROM shops;

