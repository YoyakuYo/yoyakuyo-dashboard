-- ============================================================================
-- DEBUG CLAIM SHOP FILTERS - DATABASE STATE CHECK
-- ============================================================================
-- This migration checks what data exists in the shops table for filtering
-- ============================================================================

-- Query 1: Check if shops have region field (region column does NOT exist - confirmed)
-- Region is derived from prefecture, not stored as a column
SELECT 
    'Region Field Check' AS report_type,
    COUNT(*) AS total_shops,
    0 AS shops_with_region,
    COUNT(*) AS shops_without_region,
    'Region is derived from prefecture, not a database column' AS note
FROM shops
WHERE owner_user_id IS NULL
AND (claim_status IS NULL OR claim_status != 'hidden')
AND (deleted_at IS NULL OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
))
AND address IS NOT NULL 
AND address != '';

-- Query 2: Check if shops have prefecture field
SELECT 
    'Prefecture Field Check' AS report_type,
    COUNT(*) AS total_shops,
    COUNT(prefecture) AS shops_with_prefecture,
    COUNT(*) - COUNT(prefecture) AS shops_without_prefecture
FROM shops
WHERE owner_user_id IS NULL
AND (claim_status IS NULL OR claim_status != 'hidden')
AND (deleted_at IS NULL OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
))
AND address IS NOT NULL 
AND address != '';

-- Query 3: Count shops grouped by category
SELECT 
    'Shops by Category' AS report_type,
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
GROUP BY c.name
ORDER BY shop_count DESC
LIMIT 10;

-- Query 4: Count shops grouped by region (derived from prefecture)
-- Region is calculated from prefecture, not stored as a column
SELECT 
    'Shops by Region (Derived from Prefecture)' AS report_type,
    CASE
        WHEN address ILIKE '%北海道%' OR address ILIKE '%hokkaido%' THEN 'hokkaido'
        WHEN address ILIKE '%青森%' OR address ILIKE '%aomori%' OR 
             address ILIKE '%岩手%' OR address ILIKE '%iwate%' OR
             address ILIKE '%宮城%' OR address ILIKE '%miyagi%' OR
             address ILIKE '%秋田%' OR address ILIKE '%akita%' OR
             address ILIKE '%山形%' OR address ILIKE '%yamagata%' OR
             address ILIKE '%福島%' OR address ILIKE '%fukushima%' THEN 'tohoku'
        WHEN address ILIKE '%茨城%' OR address ILIKE '%ibaraki%' OR
             address ILIKE '%栃木%' OR address ILIKE '%tochigi%' OR
             address ILIKE '%群馬%' OR address ILIKE '%gunma%' OR
             address ILIKE '%埼玉%' OR address ILIKE '%saitama%' OR
             address ILIKE '%千葉%' OR address ILIKE '%chiba%' OR
             address ILIKE '%東京%' OR address ILIKE '%tokyo%' OR
             address ILIKE '%神奈川%' OR address ILIKE '%kanagawa%' THEN 'kanto'
        WHEN address ILIKE '%新潟%' OR address ILIKE '%niigata%' OR
             address ILIKE '%富山%' OR address ILIKE '%toyama%' OR
             address ILIKE '%石川%' OR address ILIKE '%ishikawa%' OR
             address ILIKE '%福井%' OR address ILIKE '%fukui%' OR
             address ILIKE '%山梨%' OR address ILIKE '%yamanashi%' OR
             address ILIKE '%長野%' OR address ILIKE '%nagano%' OR
             address ILIKE '%岐阜%' OR address ILIKE '%gifu%' OR
             address ILIKE '%静岡%' OR address ILIKE '%shizuoka%' OR
             address ILIKE '%愛知%' OR address ILIKE '%aichi%' THEN 'chubu'
        WHEN address ILIKE '%三重%' OR address ILIKE '%mie%' OR
             address ILIKE '%滋賀%' OR address ILIKE '%shiga%' OR
             address ILIKE '%京都%' OR address ILIKE '%kyoto%' OR
             address ILIKE '%大阪%' OR address ILIKE '%osaka%' OR
             address ILIKE '%兵庫%' OR address ILIKE '%hyogo%' OR
             address ILIKE '%奈良%' OR address ILIKE '%nara%' OR
             address ILIKE '%和歌山%' OR address ILIKE '%wakayama%' THEN 'kansai'
        WHEN address ILIKE '%鳥取%' OR address ILIKE '%tottori%' OR
             address ILIKE '%島根%' OR address ILIKE '%shimane%' OR
             address ILIKE '%岡山%' OR address ILIKE '%okayama%' OR
             address ILIKE '%広島%' OR address ILIKE '%hiroshima%' OR
             address ILIKE '%山口%' OR address ILIKE '%yamaguchi%' THEN 'chugoku'
        WHEN address ILIKE '%徳島%' OR address ILIKE '%tokushima%' OR
             address ILIKE '%香川%' OR address ILIKE '%kagawa%' OR
             address ILIKE '%愛媛%' OR address ILIKE '%ehime%' OR
             address ILIKE '%高知%' OR address ILIKE '%kochi%' THEN 'shikoku'
        WHEN address ILIKE '%福岡%' OR address ILIKE '%fukuoka%' OR
             address ILIKE '%佐賀%' OR address ILIKE '%saga%' OR
             address ILIKE '%長崎%' OR address ILIKE '%nagasaki%' OR
             address ILIKE '%熊本%' OR address ILIKE '%kumamoto%' OR
             address ILIKE '%大分%' OR address ILIKE '%oita%' OR
             address ILIKE '%宮崎%' OR address ILIKE '%miyazaki%' OR
             address ILIKE '%鹿児島%' OR address ILIKE '%kagoshima%' OR
             address ILIKE '%沖縄%' OR address ILIKE '%okinawa%' THEN 'kyushu_okinawa'
        ELSE 'unknown'
    END AS region_key,
    COUNT(*) AS shop_count
FROM shops
WHERE owner_user_id IS NULL
AND (claim_status IS NULL OR claim_status != 'hidden')
AND (deleted_at IS NULL OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
))
AND address IS NOT NULL 
AND address != ''
GROUP BY region_key
ORDER BY shop_count DESC;

-- Query 5: Count shops grouped by prefecture (extracted from address)
SELECT 
    'Shops by Prefecture (Extracted)' AS report_type,
    CASE
        WHEN address ILIKE '%東京都%' OR address ILIKE '%tokyo%' OR address ILIKE '%東京%' THEN 'tokyo'
        WHEN address ILIKE '%大阪府%' OR address ILIKE '%osaka%' OR address ILIKE '%大阪%' THEN 'osaka'
        WHEN address ILIKE '%京都府%' OR address ILIKE '%kyoto%' OR address ILIKE '%京都%' THEN 'kyoto'
        WHEN address ILIKE '%神奈川県%' OR address ILIKE '%kanagawa%' OR address ILIKE '%神奈川%' THEN 'kanagawa'
        WHEN address ILIKE '%埼玉県%' OR address ILIKE '%saitama%' OR address ILIKE '%埼玉%' THEN 'saitama'
        WHEN address ILIKE '%千葉県%' OR address ILIKE '%chiba%' OR address ILIKE '%千葉%' THEN 'chiba'
        WHEN address ILIKE '%北海道%' OR address ILIKE '%hokkaido%' THEN 'hokkaido'
        WHEN address ILIKE '%愛知県%' OR address ILIKE '%aichi%' OR address ILIKE '%愛知%' THEN 'aichi'
        WHEN address ILIKE '%福岡県%' OR address ILIKE '%fukuoka%' OR address ILIKE '%福岡%' THEN 'fukuoka'
        WHEN address ILIKE '%兵庫県%' OR address ILIKE '%hyogo%' OR address ILIKE '%兵庫%' THEN 'hyogo'
        WHEN address ILIKE '%茨城県%' OR address ILIKE '%ibaraki%' OR address ILIKE '%茨城%' THEN 'ibaraki'
        WHEN address ILIKE '%栃木県%' OR address ILIKE '%tochigi%' OR address ILIKE '%栃木%' THEN 'tochigi'
        WHEN address ILIKE '%群馬県%' OR address ILIKE '%gunma%' OR address ILIKE '%群馬%' THEN 'gunma'
        ELSE 'unknown'
    END AS prefecture_key,
    COUNT(*) AS shop_count
FROM shops
WHERE owner_user_id IS NULL
AND (claim_status IS NULL OR claim_status != 'hidden')
AND (deleted_at IS NULL OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
))
AND address IS NOT NULL 
AND address != ''
GROUP BY prefecture_key
ORDER BY shop_count DESC
LIMIT 15;

-- Query 6: Sample shops to see actual data structure
SELECT 
    'Sample Unclaimed Shops Data' AS report_type,
    id,
    name,
    address,
    prefecture,
    category_id,
    owner_user_id,
    claim_status
FROM shops
WHERE owner_user_id IS NULL
AND (claim_status IS NULL OR claim_status != 'hidden')
AND (deleted_at IS NULL OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shops' AND column_name = 'deleted_at'
))
AND address IS NOT NULL 
AND address != ''
LIMIT 5;

-- Query 7: Check what columns exist in shops table
SELECT 
    'Shops Table Columns' AS report_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'shops'
AND column_name IN ('region', 'prefecture', 'category_id', 'owner_user_id', 'claim_status', 'deleted_at')
ORDER BY column_name;

