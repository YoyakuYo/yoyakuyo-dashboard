-- ============================================================================
-- ENHANCED PREFECTURE EXTRACTION - EXTRACT FROM CITY FIELD AND GEOCODING
-- ============================================================================
-- This migration further reduces Unknown prefectures by:
-- 1. Extracting prefecture from city field
-- 2. Using geocoding (lat/lng) to infer prefecture
-- 3. Additional address pattern matching
-- ============================================================================

-- ============================================================================
-- STEP 1: Extract prefecture from city field for shops with Unknown prefecture
-- ============================================================================
UPDATE shops
SET prefecture = normalize_prefecture_name(
    CASE 
        -- Hokkaido (check first to avoid conflicts)
        WHEN city ~* '(北海道|hokkaido)' THEN 'hokkaido'
        -- Tokyo (check before other patterns)
        WHEN city ~* '(東京都|東京|tokyo)' THEN 'tokyo'
        -- Osaka
        WHEN city ~* '(大阪府|大阪|osaka)' THEN 'osaka'
        -- Kyoto
        WHEN city ~* '(京都府|京都|kyoto)' THEN 'kyoto'
        -- Aomori
        WHEN city ~* '(青森県|青森|aomori)' THEN 'aomori'
        -- Iwate
        WHEN city ~* '(岩手県|岩手|iwate)' THEN 'iwate'
        -- Miyagi
        WHEN city ~* '(宮城県|宮城|miyagi)' THEN 'miyagi'
        -- Akita
        WHEN city ~* '(秋田県|秋田|akita)' THEN 'akita'
        -- Yamagata
        WHEN city ~* '(山形県|山形|yamagata)' THEN 'yamagata'
        -- Fukushima
        WHEN city ~* '(福島県|福島|fukushima)' THEN 'fukushima'
        -- Ibaraki
        WHEN city ~* '(茨城県|茨城|ibaraki)' THEN 'ibaraki'
        -- Tochigi
        WHEN city ~* '(栃木県|栃木|tochigi)' THEN 'tochigi'
        -- Gunma
        WHEN city ~* '(群馬県|群馬|gunma)' THEN 'gunma'
        -- Saitama
        WHEN city ~* '(埼玉県|埼玉|saitama)' THEN 'saitama'
        -- Chiba
        WHEN city ~* '(千葉県|千葉|chiba)' THEN 'chiba'
        -- Kanagawa
        WHEN city ~* '(神奈川県|神奈川|kanagawa)' THEN 'kanagawa'
        -- Niigata
        WHEN city ~* '(新潟県|新潟|niigata)' THEN 'niigata'
        -- Toyama
        WHEN city ~* '(富山県|富山|toyama)' THEN 'toyama'
        -- Ishikawa
        WHEN city ~* '(石川県|石川|ishikawa)' THEN 'ishikawa'
        -- Fukui
        WHEN city ~* '(福井県|福井|fukui)' THEN 'fukui'
        -- Yamanashi
        WHEN city ~* '(山梨県|山梨|yamanashi)' THEN 'yamanashi'
        -- Nagano
        WHEN city ~* '(長野県|長野|nagano)' THEN 'nagano'
        -- Gifu
        WHEN city ~* '(岐阜県|岐阜|gifu)' THEN 'gifu'
        -- Shizuoka
        WHEN city ~* '(静岡県|静岡|shizuoka)' THEN 'shizuoka'
        -- Aichi
        WHEN city ~* '(愛知県|愛知|aichi)' THEN 'aichi'
        -- Mie
        WHEN city ~* '(三重県|三重|mie)' THEN 'mie'
        -- Shiga
        WHEN city ~* '(滋賀県|滋賀|shiga)' THEN 'shiga'
        -- Hyogo
        WHEN city ~* '(兵庫県|兵庫|hyogo|hyōgo)' THEN 'hyogo'
        -- Nara
        WHEN city ~* '(奈良県|奈良|nara)' THEN 'nara'
        -- Wakayama
        WHEN city ~* '(和歌山県|和歌山|wakayama)' THEN 'wakayama'
        -- Tottori
        WHEN city ~* '(鳥取県|鳥取|tottori)' THEN 'tottori'
        -- Shimane
        WHEN city ~* '(島根県|島根|shimane)' THEN 'shimane'
        -- Okayama
        WHEN city ~* '(岡山県|岡山|okayama)' THEN 'okayama'
        -- Hiroshima
        WHEN city ~* '(広島県|広島|hiroshima)' THEN 'hiroshima'
        -- Yamaguchi
        WHEN city ~* '(山口県|山口|yamaguchi)' THEN 'yamaguchi'
        -- Tokushima
        WHEN city ~* '(徳島県|徳島|tokushima)' THEN 'tokushima'
        -- Kagawa
        WHEN city ~* '(香川県|香川|kagawa)' THEN 'kagawa'
        -- Ehime
        WHEN city ~* '(愛媛県|愛媛|ehime)' THEN 'ehime'
        -- Kochi
        WHEN city ~* '(高知県|高知|kochi)' THEN 'kochi'
        -- Fukuoka
        WHEN city ~* '(福岡県|福岡|fukuoka)' THEN 'fukuoka'
        -- Saga
        WHEN city ~* '(佐賀県|佐賀|saga)' THEN 'saga'
        -- Nagasaki
        WHEN city ~* '(長崎県|長崎|nagasaki)' THEN 'nagasaki'
        -- Kumamoto
        WHEN city ~* '(熊本県|熊本|kumamoto)' THEN 'kumamoto'
        -- Oita
        WHEN city ~* '(大分県|大分|oita)' THEN 'oita'
        -- Miyazaki
        WHEN city ~* '(宮崎県|宮崎|miyazaki)' THEN 'miyazaki'
        -- Kagoshima
        WHEN city ~* '(鹿児島県|鹿児島|kagoshima)' THEN 'kagoshima'
        -- Okinawa
        WHEN city ~* '(沖縄県|沖縄|okinawa)' THEN 'okinawa'
        ELSE NULL
    END
)
WHERE (prefecture IS NULL OR prefecture = 'Unknown' OR LOWER(prefecture) = 'unknown')
AND city IS NOT NULL
AND city != ''
AND address IS NOT NULL
AND address != '';

-- ============================================================================
-- STEP 2: Use geocoding (lat/lng) to infer prefecture for remaining Unknown shops
-- ============================================================================
-- Japan prefecture boundaries (approximate lat/lng ranges)
-- This is a simplified approach - for production, use a proper geocoding service
UPDATE shops
SET prefecture = 
    CASE 
        -- Hokkaido (northernmost)
        WHEN latitude >= 41.0 AND latitude <= 45.5 AND longitude >= 139.0 AND longitude <= 146.0 THEN 'Hokkaido'
        
        -- Aomori
        WHEN latitude >= 40.0 AND latitude <= 41.5 AND longitude >= 139.0 AND longitude <= 141.5 THEN 'Aomori'
        
        -- Iwate
        WHEN latitude >= 38.5 AND latitude <= 40.5 AND longitude >= 140.5 AND longitude <= 142.0 THEN 'Iwate'
        
        -- Miyagi
        WHEN latitude >= 37.5 AND latitude <= 39.0 AND longitude >= 140.0 AND longitude <= 141.5 THEN 'Miyagi'
        
        -- Akita
        WHEN latitude >= 39.0 AND latitude <= 40.5 AND longitude >= 139.5 AND longitude <= 140.8 THEN 'Akita'
        
        -- Yamagata
        WHEN latitude >= 37.5 AND latitude <= 39.0 AND longitude >= 139.0 AND longitude <= 140.5 THEN 'Yamagata'
        
        -- Fukushima
        WHEN latitude >= 36.5 AND latitude <= 38.0 AND longitude >= 139.0 AND longitude <= 141.0 THEN 'Fukushima'
        
        -- Ibaraki
        WHEN latitude >= 35.8 AND latitude <= 36.8 AND longitude >= 139.5 AND longitude <= 140.8 THEN 'Ibaraki'
        
        -- Tochigi
        WHEN latitude >= 36.0 AND latitude <= 37.0 AND longitude >= 139.0 AND longitude <= 140.2 THEN 'Tochigi'
        
        -- Gunma
        WHEN latitude >= 36.0 AND latitude <= 36.8 AND longitude >= 138.5 AND longitude <= 139.5 THEN 'Gunma'
        
        -- Saitama
        WHEN latitude >= 35.5 AND latitude <= 36.5 AND longitude >= 138.5 AND longitude <= 139.8 THEN 'Saitama'
        
        -- Chiba
        WHEN latitude >= 35.0 AND latitude <= 36.0 AND longitude >= 139.5 AND longitude <= 140.8 THEN 'Chiba'
        
        -- Tokyo (most precise due to high shop density)
        WHEN latitude >= 35.4 AND latitude <= 35.9 AND longitude >= 139.0 AND longitude <= 139.9 THEN 'Tokyo'
        
        -- Kanagawa
        WHEN latitude >= 35.0 AND latitude <= 35.6 AND longitude >= 139.0 AND longitude <= 139.5 THEN 'Kanagawa'
        
        -- Niigata
        WHEN latitude >= 36.5 AND latitude <= 38.5 AND longitude >= 137.5 AND longitude <= 139.5 THEN 'Niigata'
        
        -- Toyama
        WHEN latitude >= 36.2 AND latitude <= 37.0 AND longitude >= 136.5 AND longitude <= 137.8 THEN 'Toyama'
        
        -- Ishikawa
        WHEN latitude >= 36.0 AND latitude <= 37.5 AND longitude >= 136.0 AND longitude <= 137.5 THEN 'Ishikawa'
        
        -- Fukui
        WHEN latitude >= 35.5 AND latitude <= 36.5 AND longitude >= 135.5 AND longitude <= 136.5 THEN 'Fukui'
        
        -- Yamanashi
        WHEN latitude >= 35.0 AND latitude <= 36.0 AND longitude >= 138.0 AND longitude <= 139.0 THEN 'Yamanashi'
        
        -- Nagano
        WHEN latitude >= 35.5 AND latitude <= 36.8 AND longitude >= 137.0 AND longitude <= 138.5 THEN 'Nagano'
        
        -- Gifu
        WHEN latitude >= 35.0 AND latitude <= 36.5 AND longitude >= 136.0 AND longitude <= 137.5 THEN 'Gifu'
        
        -- Shizuoka
        WHEN latitude >= 34.5 AND latitude <= 35.5 AND longitude >= 137.5 AND longitude <= 139.0 THEN 'Shizuoka'
        
        -- Aichi
        WHEN latitude >= 34.5 AND latitude <= 35.5 AND longitude >= 136.5 AND longitude <= 137.8 THEN 'Aichi'
        
        -- Mie
        WHEN latitude >= 33.8 AND latitude <= 35.2 AND longitude >= 135.8 AND longitude <= 136.8 THEN 'Mie'
        
        -- Shiga
        WHEN latitude >= 34.8 AND latitude <= 35.5 AND longitude >= 135.5 AND longitude <= 136.3 THEN 'Shiga'
        
        -- Kyoto
        WHEN latitude >= 34.5 AND latitude <= 35.5 AND longitude >= 135.0 AND longitude <= 135.8 THEN 'Kyoto'
        
        -- Osaka (most precise due to high shop density)
        WHEN latitude >= 34.3 AND latitude <= 34.9 AND longitude >= 135.2 AND longitude <= 135.7 THEN 'Osaka'
        
        -- Hyogo
        WHEN latitude >= 34.2 AND latitude <= 35.5 AND longitude >= 134.0 AND longitude <= 135.5 THEN 'Hyogo'
        
        -- Nara
        WHEN latitude >= 34.0 AND latitude <= 34.8 AND longitude >= 135.5 AND longitude <= 136.0 THEN 'Nara'
        
        -- Wakayama
        WHEN latitude >= 33.5 AND latitude <= 34.5 AND longitude >= 135.0 AND longitude <= 135.8 THEN 'Wakayama'
        
        -- Tottori
        WHEN latitude >= 35.0 AND latitude <= 35.8 AND longitude >= 133.0 AND longitude <= 134.5 THEN 'Tottori'
        
        -- Shimane
        WHEN latitude >= 34.5 AND latitude <= 35.5 AND longitude >= 131.5 AND longitude <= 133.5 THEN 'Shimane'
        
        -- Okayama
        WHEN latitude >= 34.2 AND latitude <= 35.2 AND longitude >= 133.0 AND longitude <= 134.5 THEN 'Okayama'
        
        -- Hiroshima
        WHEN latitude >= 34.0 AND latitude <= 34.8 AND longitude >= 132.0 AND longitude <= 133.5 THEN 'Hiroshima'
        
        -- Yamaguchi
        WHEN latitude >= 33.8 AND latitude <= 34.8 AND longitude >= 130.5 AND longitude <= 132.0 THEN 'Yamaguchi'
        
        -- Tokushima
        WHEN latitude >= 33.5 AND latitude <= 34.3 AND longitude >= 133.5 AND longitude <= 134.8 THEN 'Tokushima'
        
        -- Kagawa
        WHEN latitude >= 34.0 AND latitude <= 34.5 AND longitude >= 133.5 AND longitude <= 134.5 THEN 'Kagawa'
        
        -- Ehime
        WHEN latitude >= 33.0 AND latitude <= 34.2 AND longitude >= 132.0 AND longitude <= 133.5 THEN 'Ehime'
        
        -- Kochi
        WHEN latitude >= 32.8 AND latitude <= 33.8 AND longitude >= 132.5 AND longitude <= 134.0 THEN 'Kochi'
        
        -- Fukuoka
        WHEN latitude >= 33.0 AND latitude <= 34.0 AND longitude >= 130.0 AND longitude <= 131.0 THEN 'Fukuoka'
        
        -- Saga
        WHEN latitude >= 33.0 AND latitude <= 33.8 AND longitude >= 129.5 AND longitude <= 130.5 THEN 'Saga'
        
        -- Nagasaki
        WHEN latitude >= 32.5 AND latitude <= 34.5 AND longitude >= 128.5 AND longitude <= 130.5 THEN 'Nagasaki'
        
        -- Kumamoto
        WHEN latitude >= 32.0 AND latitude <= 33.5 AND longitude >= 130.0 AND longitude <= 131.5 THEN 'Kumamoto'
        
        -- Oita
        WHEN latitude >= 32.5 AND latitude <= 33.8 AND longitude >= 130.8 AND longitude <= 132.0 THEN 'Oita'
        
        -- Miyazaki
        WHEN latitude >= 31.5 AND latitude <= 32.5 AND longitude >= 130.5 AND longitude <= 131.8 THEN 'Miyazaki'
        
        -- Kagoshima
        WHEN latitude >= 30.5 AND latitude <= 32.0 AND longitude >= 129.5 AND longitude <= 131.5 THEN 'Kagoshima'
        
        -- Okinawa
        WHEN latitude >= 24.0 AND latitude <= 27.0 AND longitude >= 123.0 AND longitude <= 130.0 THEN 'Okinawa'
        
        ELSE NULL
    END
WHERE (prefecture IS NULL OR prefecture = 'Unknown' OR LOWER(prefecture) = 'unknown')
AND latitude IS NOT NULL
AND longitude IS NOT NULL
AND latitude BETWEEN 24.0 AND 46.0  -- Valid Japan coordinates
AND longitude BETWEEN 123.0 AND 146.0;  -- Valid Japan coordinates

-- ============================================================================
-- STEP 3: Try extracting from combined address + city field for remaining Unknown
-- ============================================================================
UPDATE shops
SET prefecture = normalize_prefecture_name(
    CASE 
        -- Hokkaido (check first to avoid conflicts)
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(北海道|hokkaido)' THEN 'hokkaido'
        -- Tokyo (check before other patterns)
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(東京都|東京|tokyo)' THEN 'tokyo'
        -- Osaka
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(大阪府|大阪|osaka)' THEN 'osaka'
        -- Kyoto
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(京都府|京都|kyoto)' THEN 'kyoto'
        -- Aomori
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(青森県|青森|aomori)' THEN 'aomori'
        -- Iwate
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(岩手県|岩手|iwate)' THEN 'iwate'
        -- Miyagi
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(宮城県|宮城|miyagi)' THEN 'miyagi'
        -- Akita
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(秋田県|秋田|akita)' THEN 'akita'
        -- Yamagata
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(山形県|山形|yamagata)' THEN 'yamagata'
        -- Fukushima
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(福島県|福島|fukushima)' THEN 'fukushima'
        -- Ibaraki
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(茨城県|茨城|ibaraki)' THEN 'ibaraki'
        -- Tochigi
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(栃木県|栃木|tochigi)' THEN 'tochigi'
        -- Gunma
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(群馬県|群馬|gunma)' THEN 'gunma'
        -- Saitama
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(埼玉県|埼玉|saitama)' THEN 'saitama'
        -- Chiba
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(千葉県|千葉|chiba)' THEN 'chiba'
        -- Kanagawa
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(神奈川県|神奈川|kanagawa)' THEN 'kanagawa'
        -- Niigata
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(新潟県|新潟|niigata)' THEN 'niigata'
        -- Toyama
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(富山県|富山|toyama)' THEN 'toyama'
        -- Ishikawa
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(石川県|石川|ishikawa)' THEN 'ishikawa'
        -- Fukui
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(福井県|福井|fukui)' THEN 'fukui'
        -- Yamanashi
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(山梨県|山梨|yamanashi)' THEN 'yamanashi'
        -- Nagano
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(長野県|長野|nagano)' THEN 'nagano'
        -- Gifu
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(岐阜県|岐阜|gifu)' THEN 'gifu'
        -- Shizuoka
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(静岡県|静岡|shizuoka)' THEN 'shizuoka'
        -- Aichi
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(愛知県|愛知|aichi)' THEN 'aichi'
        -- Mie
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(三重県|三重|mie)' THEN 'mie'
        -- Shiga
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(滋賀県|滋賀|shiga)' THEN 'shiga'
        -- Hyogo
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(兵庫県|兵庫|hyogo|hyōgo)' THEN 'hyogo'
        -- Nara
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(奈良県|奈良|nara)' THEN 'nara'
        -- Wakayama
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(和歌山県|和歌山|wakayama)' THEN 'wakayama'
        -- Tottori
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(鳥取県|鳥取|tottori)' THEN 'tottori'
        -- Shimane
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(島根県|島根|shimane)' THEN 'shimane'
        -- Okayama
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(岡山県|岡山|okayama)' THEN 'okayama'
        -- Hiroshima
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(広島県|広島|hiroshima)' THEN 'hiroshima'
        -- Yamaguchi
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(山口県|山口|yamaguchi)' THEN 'yamaguchi'
        -- Tokushima
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(徳島県|徳島|tokushima)' THEN 'tokushima'
        -- Kagawa
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(香川県|香川|kagawa)' THEN 'kagawa'
        -- Ehime
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(愛媛県|愛媛|ehime)' THEN 'ehime'
        -- Kochi
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(高知県|高知|kochi)' THEN 'kochi'
        -- Fukuoka
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(福岡県|福岡|fukuoka)' THEN 'fukuoka'
        -- Saga
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(佐賀県|佐賀|saga)' THEN 'saga'
        -- Nagasaki
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(長崎県|長崎|nagasaki)' THEN 'nagasaki'
        -- Kumamoto
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(熊本県|熊本|kumamoto)' THEN 'kumamoto'
        -- Oita
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(大分県|大分|oita)' THEN 'oita'
        -- Miyazaki
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(宮崎県|宮崎|miyazaki)' THEN 'miyazaki'
        -- Kagoshima
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(鹿児島県|鹿児島|kagoshima)' THEN 'kagoshima'
        -- Okinawa
        WHEN CONCAT(COALESCE(address, ''), ' ', COALESCE(city, '')) ~* '(沖縄県|沖縄|okinawa)' THEN 'okinawa'
        ELSE NULL
    END
)
WHERE (prefecture IS NULL OR prefecture = 'Unknown' OR LOWER(prefecture) = 'unknown')
AND (address IS NOT NULL OR city IS NOT NULL)
AND (address != '' OR city != '');

-- ============================================================================
-- VERIFICATION: Show final prefecture counts after enhanced extraction
-- ============================================================================
SELECT 
    'Final Prefecture Counts After Enhanced Extraction' AS report_type,
    COALESCE(prefecture, 'Unknown') AS prefecture,
    COUNT(*) AS shop_count
FROM shops
WHERE 
    (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'deleted_at'
        )
        OR deleted_at IS NULL
    )
    AND (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'claim_status'
        )
        OR claim_status IS NULL 
        OR claim_status != 'hidden'
    )
    AND address IS NOT NULL 
    AND address != ''
GROUP BY prefecture
ORDER BY shop_count DESC;

-- ============================================================================
-- VERIFICATION: Show remaining shops with NULL/Unknown prefecture
-- ============================================================================
SELECT 
    'Remaining Shops with NULL/Unknown Prefecture' AS report_type,
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
WHERE (prefecture IS NULL OR prefecture = 'Unknown' OR LOWER(prefecture) = 'unknown')
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != '';

-- ============================================================================
-- ANALYSIS: Breakdown of remaining Unknown shops by data availability
-- ============================================================================
SELECT 
    'Unknown Shops Data Availability Analysis' AS report_type,
    CASE 
        WHEN latitude IS NULL OR longitude IS NULL THEN 'No coordinates'
        WHEN city IS NULL OR city = '' THEN 'No city field'
        WHEN address IS NULL OR address = '' THEN 'No address'
        WHEN LENGTH(address) < 10 THEN 'Very short address'
        ELSE 'Has all data but no pattern match'
    END AS data_status,
    COUNT(*) AS shop_count
FROM shops
WHERE (prefecture IS NULL OR prefecture = 'Unknown' OR LOWER(prefecture) = 'unknown')
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
GROUP BY 
    CASE 
        WHEN latitude IS NULL OR longitude IS NULL THEN 'No coordinates'
        WHEN city IS NULL OR city = '' THEN 'No city field'
        WHEN address IS NULL OR address = '' THEN 'No address'
        WHEN LENGTH(address) < 10 THEN 'Very short address'
        ELSE 'Has all data but no pattern match'
    END
ORDER BY shop_count DESC;

