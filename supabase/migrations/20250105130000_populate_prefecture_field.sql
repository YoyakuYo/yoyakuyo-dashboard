-- ============================================================================
-- POPULATE PREFECTURE FIELD FOR ALL SHOPS
-- ============================================================================
-- This migration populates the prefecture field for all shops based on their address
-- This improves filtering performance and ensures prefecture filtering works correctly
-- ============================================================================

-- Update prefecture field for all shops based on address patterns
UPDATE shops
SET prefecture = CASE
    -- Hokkaido
    WHEN address ILIKE '%北海道%' OR address ILIKE '%hokkaido%' THEN 'hokkaido'
    
    -- Tohoku
    WHEN address ILIKE '%青森%' OR address ILIKE '%aomori%' THEN 'aomori'
    WHEN address ILIKE '%岩手%' OR address ILIKE '%iwate%' THEN 'iwate'
    WHEN address ILIKE '%宮城%' OR address ILIKE '%miyagi%' THEN 'miyagi'
    WHEN address ILIKE '%秋田%' OR address ILIKE '%akita%' THEN 'akita'
    WHEN address ILIKE '%山形%' OR address ILIKE '%yamagata%' THEN 'yamagata'
    WHEN address ILIKE '%福島%' OR address ILIKE '%fukushima%' THEN 'fukushima'
    
    -- Kanto
    WHEN address ILIKE '%茨城%' OR address ILIKE '%ibaraki%' THEN 'ibaraki'
    WHEN address ILIKE '%栃木%' OR address ILIKE '%tochigi%' THEN 'tochigi'
    WHEN address ILIKE '%群馬%' OR address ILIKE '%gunma%' THEN 'gunma'
    WHEN address ILIKE '%埼玉%' OR address ILIKE '%saitama%' THEN 'saitama'
    WHEN address ILIKE '%千葉%' OR address ILIKE '%chiba%' THEN 'chiba'
    WHEN address ILIKE '%東京%' OR address ILIKE '%tokyo%' OR address ILIKE '%東京都%' THEN 'tokyo'
    WHEN address ILIKE '%神奈川%' OR address ILIKE '%kanagawa%' THEN 'kanagawa'
    
    -- Chubu
    WHEN address ILIKE '%新潟%' OR address ILIKE '%niigata%' THEN 'niigata'
    WHEN address ILIKE '%富山%' OR address ILIKE '%toyama%' THEN 'toyama'
    WHEN address ILIKE '%石川%' OR address ILIKE '%ishikawa%' THEN 'ishikawa'
    WHEN address ILIKE '%福井%' OR address ILIKE '%fukui%' THEN 'fukui'
    WHEN address ILIKE '%山梨%' OR address ILIKE '%yamanashi%' THEN 'yamanashi'
    WHEN address ILIKE '%長野%' OR address ILIKE '%nagano%' THEN 'nagano'
    WHEN address ILIKE '%岐阜%' OR address ILIKE '%gifu%' THEN 'gifu'
    WHEN address ILIKE '%静岡%' OR address ILIKE '%shizuoka%' THEN 'shizuoka'
    WHEN address ILIKE '%愛知%' OR address ILIKE '%aichi%' THEN 'aichi'
    
    -- Kansai
    WHEN address ILIKE '%三重%' OR address ILIKE '%mie%' THEN 'mie'
    WHEN address ILIKE '%滋賀%' OR address ILIKE '%shiga%' THEN 'shiga'
    WHEN address ILIKE '%京都%' OR address ILIKE '%kyoto%' OR address ILIKE '%京都府%' THEN 'kyoto'
    WHEN address ILIKE '%大阪%' OR address ILIKE '%osaka%' OR address ILIKE '%大阪府%' THEN 'osaka'
    WHEN address ILIKE '%兵庫%' OR address ILIKE '%hyogo%' THEN 'hyogo'
    WHEN address ILIKE '%奈良%' OR address ILIKE '%nara%' THEN 'nara'
    WHEN address ILIKE '%和歌山%' OR address ILIKE '%wakayama%' THEN 'wakayama'
    
    -- Chugoku
    WHEN address ILIKE '%鳥取%' OR address ILIKE '%tottori%' THEN 'tottori'
    WHEN address ILIKE '%島根%' OR address ILIKE '%shimane%' THEN 'shimane'
    WHEN address ILIKE '%岡山%' OR address ILIKE '%okayama%' THEN 'okayama'
    WHEN address ILIKE '%広島%' OR address ILIKE '%hiroshima%' THEN 'hiroshima'
    WHEN address ILIKE '%山口%' OR address ILIKE '%yamaguchi%' THEN 'yamaguchi'
    
    -- Shikoku
    WHEN address ILIKE '%徳島%' OR address ILIKE '%tokushima%' THEN 'tokushima'
    WHEN address ILIKE '%香川%' OR address ILIKE '%kagawa%' THEN 'kagawa'
    WHEN address ILIKE '%愛媛%' OR address ILIKE '%ehime%' THEN 'ehime'
    WHEN address ILIKE '%高知%' OR address ILIKE '%kochi%' THEN 'kochi'
    
    -- Kyushu
    WHEN address ILIKE '%福岡%' OR address ILIKE '%fukuoka%' THEN 'fukuoka'
    WHEN address ILIKE '%佐賀%' OR address ILIKE '%saga%' THEN 'saga'
    WHEN address ILIKE '%長崎%' OR address ILIKE '%nagasaki%' THEN 'nagasaki'
    WHEN address ILIKE '%熊本%' OR address ILIKE '%kumamoto%' THEN 'kumamoto'
    WHEN address ILIKE '%大分%' OR address ILIKE '%oita%' THEN 'oita'
    WHEN address ILIKE '%宮崎%' OR address ILIKE '%miyazaki%' THEN 'miyazaki'
    WHEN address ILIKE '%鹿児島%' OR address ILIKE '%kagoshima%' THEN 'kagoshima'
    WHEN address ILIKE '%沖縄%' OR address ILIKE '%okinawa%' THEN 'okinawa'
    
    -- Keep existing value if already set
    ELSE prefecture
END
WHERE address IS NOT NULL 
AND address != ''
AND (prefecture IS NULL OR prefecture = '');

-- Verification query: Count shops with prefecture populated
SELECT 
    'Prefecture Population Results' AS report_type,
    COUNT(*) AS total_shops,
    COUNT(prefecture) AS shops_with_prefecture,
    COUNT(*) - COUNT(prefecture) AS shops_without_prefecture,
    ROUND(COUNT(prefecture)::numeric / COUNT(*)::numeric * 100, 2) AS percentage_populated
FROM shops
WHERE address IS NOT NULL 
AND address != '';

-- Show distribution by prefecture (top 15)
SELECT 
    'Prefecture Distribution' AS report_type,
    prefecture,
    COUNT(*) AS shop_count
FROM shops
WHERE prefecture IS NOT NULL
AND prefecture != ''
GROUP BY prefecture
ORDER BY shop_count DESC
LIMIT 15;

