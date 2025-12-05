-- ============================================================================
-- DIAGNOSE MASSAGES SHOPS SPECIFICALLY
-- ============================================================================
-- This query helps understand why "Massages" category filter returns 0 shops
-- It checks:
-- 1. Shops with subcategory="Massages"
-- 2. What category_id these shops have
-- 3. If there's a separate "Massages" category in categories table
-- 4. Sample Massages shops to verify data structure
-- ============================================================================

-- Query 1: Total unclaimed shops with subcategory="Massages"
SELECT 
    'Unclaimed Shops with subcategory=Massages' AS report_type,
    COUNT(*) AS count
FROM shops
WHERE owner_user_id IS NULL
AND (claim_status IS NULL OR claim_status != 'hidden')
AND (deleted_at IS NULL OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
))
AND address IS NOT NULL 
AND address != ''
AND subcategory = 'Massages';

-- Query 2: What category_id do Massages shops have?
SELECT 
    'Massages Shops by category_id' AS report_type,
    c.name AS category_name,
    COUNT(*) AS shop_count
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
WHERE s.owner_user_id IS NULL
AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
AND (s.deleted_at IS NULL OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
))
AND s.address IS NOT NULL 
AND s.address != ''
AND s.subcategory = 'Massages'
GROUP BY c.name
ORDER BY shop_count DESC;

-- Query 3: Check if "Massages" exists as a separate category
SELECT 
    'Categories matching Massages' AS report_type,
    id,
    name,
    (SELECT COUNT(*) FROM shops WHERE category_id = categories.id AND owner_user_id IS NULL) AS unclaimed_count
FROM categories
WHERE LOWER(name) LIKE '%massage%'
   OR LOWER(name) = 'massages'
ORDER BY name;

-- Query 4: Sample Massages shops (first 10)
SELECT 
    'Sample Massages Shops' AS report_type,
    s.id,
    s.name,
    s.address,
    s.subcategory,
    s.category_id,
    c.name AS category_name,
    s.prefecture
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
WHERE s.owner_user_id IS NULL
AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
AND (s.deleted_at IS NULL OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
))
AND s.address IS NOT NULL 
AND s.address != ''
AND s.subcategory = 'Massages'
ORDER BY s.name
LIMIT 10;

-- Query 5: Massages shops in Tokyo prefecture
SELECT 
    'Massages Shops in Tokyo' AS report_type,
    COUNT(*) AS count
FROM shops s
WHERE s.owner_user_id IS NULL
AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
AND (s.deleted_at IS NULL OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
))
AND s.address IS NOT NULL 
AND s.address != ''
AND s.subcategory = 'Massages'
AND (
    s.prefecture = 'tokyo'
    OR s.address ILIKE '%東京%'
    OR s.address ILIKE '%tokyo%'
    OR s.address ILIKE '%東京都%'
);

-- Query 6: Massages shops in Kanto region (Tokyo, Kanagawa, Saitama, Chiba, Ibaraki, Tochigi, Gunma)
SELECT 
    'Massages Shops in Kanto Region' AS report_type,
    COUNT(*) AS count
FROM shops s
WHERE s.owner_user_id IS NULL
AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
AND (s.deleted_at IS NULL OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
))
AND s.address IS NOT NULL 
AND s.address != ''
AND s.subcategory = 'Massages'
AND (
    s.prefecture IN ('tokyo', 'kanagawa', 'saitama', 'chiba', 'ibaraki', 'tochigi', 'gunma')
    OR s.address ILIKE '%東京%'
    OR s.address ILIKE '%神奈川%'
    OR s.address ILIKE '%埼玉%'
    OR s.address ILIKE '%千葉%'
    OR s.address ILIKE '%茨城%'
    OR s.address ILIKE '%栃木%'
    OR s.address ILIKE '%群馬%'
    OR s.address ILIKE '%tokyo%'
    OR s.address ILIKE '%kanagawa%'
    OR s.address ILIKE '%saitama%'
    OR s.address ILIKE '%chiba%'
);

-- Query 7: All categories that contain shops with subcategory="Massages"
SELECT 
    'Categories containing Massages subcategory shops' AS report_type,
    c.id AS category_id,
    c.name AS category_name,
    COUNT(*) AS massages_shop_count,
    (SELECT COUNT(*) FROM shops WHERE category_id = c.id AND owner_user_id IS NULL) AS total_unclaimed_in_category
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE s.owner_user_id IS NULL
AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
AND (s.deleted_at IS NULL OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
))
AND s.address IS NOT NULL 
AND s.address != ''
AND s.subcategory = 'Massages'
GROUP BY c.id, c.name
ORDER BY massages_shop_count DESC;

