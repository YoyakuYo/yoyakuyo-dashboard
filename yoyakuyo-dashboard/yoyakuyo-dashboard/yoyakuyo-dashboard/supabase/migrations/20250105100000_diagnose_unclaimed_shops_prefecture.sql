-- ============================================================================
-- DIAGNOSE UNCLAIMED SHOPS PREFECTURE DATA
-- ============================================================================
-- This migration helps diagnose why unclaimed shops aren't showing when filtered
-- by prefecture. It checks:
-- 1. Total unclaimed shops
-- 2. Shops with/without prefecture data
-- 3. Shops in Tokyo prefecture
-- 4. Shops in Kanto region
-- 5. Sample shops to verify data structure
-- ============================================================================

-- Query 1: Total unclaimed shops
SELECT 
    'Total Unclaimed Shops' AS report_type,
    COUNT(*) AS count
FROM shops
WHERE owner_user_id IS NULL
AND (claim_status IS NULL OR claim_status != 'hidden')
AND (deleted_at IS NULL OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
))
AND address IS NOT NULL 
AND address != '';

-- Query 2: Unclaimed shops with prefecture data
SELECT 
    'Unclaimed Shops with Prefecture' AS report_type,
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
AND prefecture IS NOT NULL
AND prefecture != '';

-- Query 3: Unclaimed shops without prefecture data
SELECT 
    'Unclaimed Shops without Prefecture' AS report_type,
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
AND (prefecture IS NULL OR prefecture = '');

-- Query 4: Unclaimed shops in Tokyo prefecture
SELECT 
    'Unclaimed Shops in Tokyo' AS report_type,
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
AND (
    prefecture = 'tokyo'
    OR address ILIKE '%東京%'
    OR address ILIKE '%tokyo%'
    OR address ILIKE '%東京都%'
);

-- Query 5: Unclaimed shops in Kanto region (Tokyo, Kanagawa, Saitama, Chiba, Ibaraki, Tochigi, Gunma)
SELECT 
    'Unclaimed Shops in Kanto Region' AS report_type,
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
AND (
    prefecture IN ('tokyo', 'kanagawa', 'saitama', 'chiba', 'ibaraki', 'tochigi', 'gunma')
    OR address ILIKE '%東京%'
    OR address ILIKE '%神奈川%'
    OR address ILIKE '%埼玉%'
    OR address ILIKE '%千葉%'
    OR address ILIKE '%茨城%'
    OR address ILIKE '%栃木%'
    OR address ILIKE '%群馬%'
    OR address ILIKE '%tokyo%'
    OR address ILIKE '%kanagawa%'
    OR address ILIKE '%saitama%'
    OR address ILIKE '%chiba%'
);

-- Query 6: Sample unclaimed shops (first 10)
SELECT 
    'Sample Unclaimed Shops' AS report_type,
    s.id,
    s.name,
    s.address,
    s.prefecture,
    s.category_id,
    s.subcategory,
    c.name AS category_name
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
ORDER BY s.name
LIMIT 10;

-- Query 7: Unclaimed shops by prefecture (top 10)
SELECT 
    'Unclaimed Shops by Prefecture' AS report_type,
    COALESCE(s.prefecture, 'NULL or empty') AS prefecture,
    COUNT(*) AS shop_count
FROM shops s
WHERE s.owner_user_id IS NULL
AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
AND (s.deleted_at IS NULL OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
))
AND s.address IS NOT NULL 
AND s.address != ''
GROUP BY s.prefecture
ORDER BY shop_count DESC
LIMIT 10;

-- Query 8: Unclaimed shops by category (top 10)
SELECT 
    'Unclaimed Shops by Category' AS report_type,
    COALESCE(c.name, 'NULL or Unknown') AS category_name,
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
GROUP BY c.name
ORDER BY shop_count DESC
LIMIT 10;

