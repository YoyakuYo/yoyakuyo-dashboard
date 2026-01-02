-- ============================================================================
-- NORMALIZE PREFECTURE VALUES - FIX CASE SENSITIVITY AND INCONSISTENCIES
-- ============================================================================
-- This migration normalizes prefecture values to fix:
-- 1. Case sensitivity issues (tokyo vs Tokyo)
-- 2. Inconsistent naming (osaka vs Osaka)
-- 3. Standardizes to proper case format
-- ============================================================================

-- ============================================================================
-- STEP 1: Create function to normalize prefecture names
-- ============================================================================
CREATE OR REPLACE FUNCTION normalize_prefecture_name(pref_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Handle NULL or empty
    IF pref_name IS NULL OR TRIM(pref_name) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Convert to lowercase for comparison
    pref_name := LOWER(TRIM(pref_name));
    
    -- Map common variations to standard names (using proper case)
    CASE pref_name
        -- Tokyo variations
        WHEN 'tokyo' THEN RETURN 'Tokyo';
        WHEN '東京都' THEN RETURN 'Tokyo';
        WHEN '東京' THEN RETURN 'Tokyo';
        
        -- Osaka variations
        WHEN 'osaka' THEN RETURN 'Osaka';
        WHEN 'osaka-fu' THEN RETURN 'Osaka';
        WHEN '大阪府' THEN RETURN 'Osaka';
        WHEN '大阪' THEN RETURN 'Osaka';
        
        -- Kyoto variations
        WHEN 'kyoto' THEN RETURN 'Kyoto';
        WHEN 'kyoto-fu' THEN RETURN 'Kyoto';
        WHEN '京都府' THEN RETURN 'Kyoto';
        WHEN '京都' THEN RETURN 'Kyoto';
        
        -- Hokkaido variations
        WHEN 'hokkaido' THEN RETURN 'Hokkaido';
        WHEN 'hokkaidō' THEN RETURN 'Hokkaido';
        WHEN '北海道' THEN RETURN 'Hokkaido';
        
        -- Aichi variations
        WHEN 'aichi' THEN RETURN 'Aichi';
        WHEN '愛知県' THEN RETURN 'Aichi';
        WHEN '愛知' THEN RETURN 'Aichi';
        
        -- Kanagawa variations
        WHEN 'kanagawa' THEN RETURN 'Kanagawa';
        WHEN '神奈川県' THEN RETURN 'Kanagawa';
        WHEN '神奈川' THEN RETURN 'Kanagawa';
        
        -- Saitama variations
        WHEN 'saitama' THEN RETURN 'Saitama';
        WHEN '埼玉県' THEN RETURN 'Saitama';
        WHEN '埼玉' THEN RETURN 'Saitama';
        
        -- Chiba variations
        WHEN 'chiba' THEN RETURN 'Chiba';
        WHEN '千葉県' THEN RETURN 'Chiba';
        WHEN '千葉' THEN RETURN 'Chiba';
        
        -- Fukuoka variations
        WHEN 'fukuoka' THEN RETURN 'Fukuoka';
        WHEN '福岡県' THEN RETURN 'Fukuoka';
        WHEN '福岡' THEN RETURN 'Fukuoka';
        
        -- Hyogo variations
        WHEN 'hyogo' THEN RETURN 'Hyogo';
        WHEN 'hyōgo' THEN RETURN 'Hyogo';
        WHEN '兵庫県' THEN RETURN 'Hyogo';
        WHEN '兵庫' THEN RETURN 'Hyogo';
        
        -- Shizuoka variations
        WHEN 'shizuoka' THEN RETURN 'Shizuoka';
        WHEN '静岡県' THEN RETURN 'Shizuoka';
        WHEN '静岡' THEN RETURN 'Shizuoka';
        
        -- Aomori
        WHEN 'aomori' THEN RETURN 'Aomori';
        WHEN '青森県' THEN RETURN 'Aomori';
        WHEN '青森' THEN RETURN 'Aomori';
        
        -- Iwate
        WHEN 'iwate' THEN RETURN 'Iwate';
        WHEN '岩手県' THEN RETURN 'Iwate';
        WHEN '岩手' THEN RETURN 'Iwate';
        
        -- Miyagi
        WHEN 'miyagi' THEN RETURN 'Miyagi';
        WHEN '宮城県' THEN RETURN 'Miyagi';
        WHEN '宮城' THEN RETURN 'Miyagi';
        
        -- Akita
        WHEN 'akita' THEN RETURN 'Akita';
        WHEN '秋田県' THEN RETURN 'Akita';
        WHEN '秋田' THEN RETURN 'Akita';
        
        -- Yamagata
        WHEN 'yamagata' THEN RETURN 'Yamagata';
        WHEN '山形県' THEN RETURN 'Yamagata';
        WHEN '山形' THEN RETURN 'Yamagata';
        
        -- Fukushima
        WHEN 'fukushima' THEN RETURN 'Fukushima';
        WHEN '福島県' THEN RETURN 'Fukushima';
        WHEN '福島' THEN RETURN 'Fukushima';
        
        -- Ibaraki
        WHEN 'ibaraki' THEN RETURN 'Ibaraki';
        WHEN '茨城県' THEN RETURN 'Ibaraki';
        WHEN '茨城' THEN RETURN 'Ibaraki';
        
        -- Tochigi
        WHEN 'tochigi' THEN RETURN 'Tochigi';
        WHEN '栃木県' THEN RETURN 'Tochigi';
        WHEN '栃木' THEN RETURN 'Tochigi';
        
        -- Gunma
        WHEN 'gunma' THEN RETURN 'Gunma';
        WHEN '群馬県' THEN RETURN 'Gunma';
        WHEN '群馬' THEN RETURN 'Gunma';
        
        -- Niigata
        WHEN 'niigata' THEN RETURN 'Niigata';
        WHEN '新潟県' THEN RETURN 'Niigata';
        WHEN '新潟' THEN RETURN 'Niigata';
        
        -- Toyama
        WHEN 'toyama' THEN RETURN 'Toyama';
        WHEN '富山県' THEN RETURN 'Toyama';
        WHEN '富山' THEN RETURN 'Toyama';
        
        -- Ishikawa
        WHEN 'ishikawa' THEN RETURN 'Ishikawa';
        WHEN '石川県' THEN RETURN 'Ishikawa';
        WHEN '石川' THEN RETURN 'Ishikawa';
        
        -- Fukui
        WHEN 'fukui' THEN RETURN 'Fukui';
        WHEN '福井県' THEN RETURN 'Fukui';
        WHEN '福井' THEN RETURN 'Fukui';
        
        -- Yamanashi
        WHEN 'yamanashi' THEN RETURN 'Yamanashi';
        WHEN '山梨県' THEN RETURN 'Yamanashi';
        WHEN '山梨' THEN RETURN 'Yamanashi';
        
        -- Nagano
        WHEN 'nagano' THEN RETURN 'Nagano';
        WHEN '長野県' THEN RETURN 'Nagano';
        WHEN '長野' THEN RETURN 'Nagano';
        
        -- Gifu
        WHEN 'gifu' THEN RETURN 'Gifu';
        WHEN '岐阜県' THEN RETURN 'Gifu';
        WHEN '岐阜' THEN RETURN 'Gifu';
        
        -- Mie
        WHEN 'mie' THEN RETURN 'Mie';
        WHEN '三重県' THEN RETURN 'Mie';
        WHEN '三重' THEN RETURN 'Mie';
        
        -- Shiga
        WHEN 'shiga' THEN RETURN 'Shiga';
        WHEN '滋賀県' THEN RETURN 'Shiga';
        WHEN '滋賀' THEN RETURN 'Shiga';
        
        -- Nara
        WHEN 'nara' THEN RETURN 'Nara';
        WHEN '奈良県' THEN RETURN 'Nara';
        WHEN '奈良' THEN RETURN 'Nara';
        
        -- Wakayama
        WHEN 'wakayama' THEN RETURN 'Wakayama';
        WHEN '和歌山県' THEN RETURN 'Wakayama';
        WHEN '和歌山' THEN RETURN 'Wakayama';
        
        -- Tottori
        WHEN 'tottori' THEN RETURN 'Tottori';
        WHEN '鳥取県' THEN RETURN 'Tottori';
        WHEN '鳥取' THEN RETURN 'Tottori';
        
        -- Shimane
        WHEN 'shimane' THEN RETURN 'Shimane';
        WHEN '島根県' THEN RETURN 'Shimane';
        WHEN '島根' THEN RETURN 'Shimane';
        
        -- Okayama
        WHEN 'okayama' THEN RETURN 'Okayama';
        WHEN '岡山県' THEN RETURN 'Okayama';
        WHEN '岡山' THEN RETURN 'Okayama';
        
        -- Hiroshima
        WHEN 'hiroshima' THEN RETURN 'Hiroshima';
        WHEN '広島県' THEN RETURN 'Hiroshima';
        WHEN '広島' THEN RETURN 'Hiroshima';
        
        -- Yamaguchi
        WHEN 'yamaguchi' THEN RETURN 'Yamaguchi';
        WHEN '山口県' THEN RETURN 'Yamaguchi';
        WHEN '山口' THEN RETURN 'Yamaguchi';
        
        -- Tokushima
        WHEN 'tokushima' THEN RETURN 'Tokushima';
        WHEN '徳島県' THEN RETURN 'Tokushima';
        WHEN '徳島' THEN RETURN 'Tokushima';
        
        -- Kagawa
        WHEN 'kagawa' THEN RETURN 'Kagawa';
        WHEN '香川県' THEN RETURN 'Kagawa';
        WHEN '香川' THEN RETURN 'Kagawa';
        
        -- Ehime
        WHEN 'ehime' THEN RETURN 'Ehime';
        WHEN '愛媛県' THEN RETURN 'Ehime';
        WHEN '愛媛' THEN RETURN 'Ehime';
        
        -- Kochi
        WHEN 'kochi' THEN RETURN 'Kochi';
        WHEN '高知県' THEN RETURN 'Kochi';
        WHEN '高知' THEN RETURN 'Kochi';
        
        -- Saga
        WHEN 'saga' THEN RETURN 'Saga';
        WHEN '佐賀県' THEN RETURN 'Saga';
        WHEN '佐賀' THEN RETURN 'Saga';
        
        -- Nagasaki
        WHEN 'nagasaki' THEN RETURN 'Nagasaki';
        WHEN '長崎県' THEN RETURN 'Nagasaki';
        WHEN '長崎' THEN RETURN 'Nagasaki';
        
        -- Kumamoto
        WHEN 'kumamoto' THEN RETURN 'Kumamoto';
        WHEN '熊本県' THEN RETURN 'Kumamoto';
        WHEN '熊本' THEN RETURN 'Kumamoto';
        
        -- Oita
        WHEN 'oita' THEN RETURN 'Oita';
        WHEN '大分県' THEN RETURN 'Oita';
        WHEN '大分' THEN RETURN 'Oita';
        
        -- Miyazaki
        WHEN 'miyazaki' THEN RETURN 'Miyazaki';
        WHEN '宮崎県' THEN RETURN 'Miyazaki';
        WHEN '宮崎' THEN RETURN 'Miyazaki';
        
        -- Kagoshima
        WHEN 'kagoshima' THEN RETURN 'Kagoshima';
        WHEN '鹿児島県' THEN RETURN 'Kagoshima';
        WHEN '鹿児島' THEN RETURN 'Kagoshima';
        
        -- Okinawa
        WHEN 'okinawa' THEN RETURN 'Okinawa';
        WHEN '沖縄県' THEN RETURN 'Okinawa';
        WHEN '沖縄' THEN RETURN 'Okinawa';
        
        -- Unknown variations
        WHEN 'unknown' THEN RETURN 'Unknown';
        
        -- Other prefectures (capitalize first letter)
        ELSE
            -- Capitalize first letter, lowercase rest
            RETURN INITCAP(pref_name);
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 2: Normalize all existing prefecture values
-- ============================================================================
UPDATE shops
SET prefecture = normalize_prefecture_name(prefecture)
WHERE prefecture IS NOT NULL
AND prefecture != normalize_prefecture_name(prefecture);

-- ============================================================================
-- STEP 3: Extract prefecture from address for shops with NULL or 'Unknown' prefecture
-- ============================================================================
-- This attempts to extract prefecture from address field for shops that don't have it set
-- Uses same patterns as backend extractPrefecture function
UPDATE shops
SET prefecture = normalize_prefecture_name(
    CASE 
        -- Hokkaido (check first to avoid conflicts)
        WHEN address ~* '(北海道|hokkaido)' THEN 'hokkaido'
        -- Tokyo (check before other patterns)
        WHEN address ~* '(東京都|東京|tokyo)' THEN 'tokyo'
        -- Osaka
        WHEN address ~* '(大阪府|大阪|osaka)' THEN 'osaka'
        -- Kyoto
        WHEN address ~* '(京都府|京都|kyoto)' THEN 'kyoto'
        -- Aomori
        WHEN address ~* '(青森県|青森|aomori)' THEN 'aomori'
        -- Iwate
        WHEN address ~* '(岩手県|岩手|iwate)' THEN 'iwate'
        -- Miyagi
        WHEN address ~* '(宮城県|宮城|miyagi)' THEN 'miyagi'
        -- Akita
        WHEN address ~* '(秋田県|秋田|akita)' THEN 'akita'
        -- Yamagata
        WHEN address ~* '(山形県|山形|yamagata)' THEN 'yamagata'
        -- Fukushima
        WHEN address ~* '(福島県|福島|fukushima)' THEN 'fukushima'
        -- Ibaraki
        WHEN address ~* '(茨城県|茨城|ibaraki)' THEN 'ibaraki'
        -- Tochigi
        WHEN address ~* '(栃木県|栃木|tochigi)' THEN 'tochigi'
        -- Gunma
        WHEN address ~* '(群馬県|群馬|gunma)' THEN 'gunma'
        -- Saitama
        WHEN address ~* '(埼玉県|埼玉|saitama)' THEN 'saitama'
        -- Chiba
        WHEN address ~* '(千葉県|千葉|chiba)' THEN 'chiba'
        -- Kanagawa
        WHEN address ~* '(神奈川県|神奈川|kanagawa)' THEN 'kanagawa'
        -- Niigata
        WHEN address ~* '(新潟県|新潟|niigata)' THEN 'niigata'
        -- Toyama
        WHEN address ~* '(富山県|富山|toyama)' THEN 'toyama'
        -- Ishikawa
        WHEN address ~* '(石川県|石川|ishikawa)' THEN 'ishikawa'
        -- Fukui
        WHEN address ~* '(福井県|福井|fukui)' THEN 'fukui'
        -- Yamanashi
        WHEN address ~* '(山梨県|山梨|yamanashi)' THEN 'yamanashi'
        -- Nagano
        WHEN address ~* '(長野県|長野|nagano)' THEN 'nagano'
        -- Gifu
        WHEN address ~* '(岐阜県|岐阜|gifu)' THEN 'gifu'
        -- Shizuoka
        WHEN address ~* '(静岡県|静岡|shizuoka)' THEN 'shizuoka'
        -- Aichi
        WHEN address ~* '(愛知県|愛知|aichi)' THEN 'aichi'
        -- Mie
        WHEN address ~* '(三重県|三重|mie)' THEN 'mie'
        -- Shiga
        WHEN address ~* '(滋賀県|滋賀|shiga)' THEN 'shiga'
        -- Hyogo
        WHEN address ~* '(兵庫県|兵庫|hyogo|hyōgo)' THEN 'hyogo'
        -- Nara
        WHEN address ~* '(奈良県|奈良|nara)' THEN 'nara'
        -- Wakayama
        WHEN address ~* '(和歌山県|和歌山|wakayama)' THEN 'wakayama'
        -- Tottori
        WHEN address ~* '(鳥取県|鳥取|tottori)' THEN 'tottori'
        -- Shimane
        WHEN address ~* '(島根県|島根|shimane)' THEN 'shimane'
        -- Okayama
        WHEN address ~* '(岡山県|岡山|okayama)' THEN 'okayama'
        -- Hiroshima
        WHEN address ~* '(広島県|広島|hiroshima)' THEN 'hiroshima'
        -- Yamaguchi
        WHEN address ~* '(山口県|山口|yamaguchi)' THEN 'yamaguchi'
        -- Tokushima
        WHEN address ~* '(徳島県|徳島|tokushima)' THEN 'tokushima'
        -- Kagawa
        WHEN address ~* '(香川県|香川|kagawa)' THEN 'kagawa'
        -- Ehime
        WHEN address ~* '(愛媛県|愛媛|ehime)' THEN 'ehime'
        -- Kochi
        WHEN address ~* '(高知県|高知|kochi)' THEN 'kochi'
        -- Fukuoka
        WHEN address ~* '(福岡県|福岡|fukuoka)' THEN 'fukuoka'
        -- Saga
        WHEN address ~* '(佐賀県|佐賀|saga)' THEN 'saga'
        -- Nagasaki
        WHEN address ~* '(長崎県|長崎|nagasaki)' THEN 'nagasaki'
        -- Kumamoto
        WHEN address ~* '(熊本県|熊本|kumamoto)' THEN 'kumamoto'
        -- Oita
        WHEN address ~* '(大分県|大分|oita)' THEN 'oita'
        -- Miyazaki
        WHEN address ~* '(宮崎県|宮崎|miyazaki)' THEN 'miyazaki'
        -- Kagoshima
        WHEN address ~* '(鹿児島県|鹿児島|kagoshima)' THEN 'kagoshima'
        -- Okinawa
        WHEN address ~* '(沖縄県|沖縄|okinawa)' THEN 'okinawa'
        ELSE NULL
    END
)
WHERE (prefecture IS NULL OR prefecture = 'Unknown' OR LOWER(prefecture) = 'unknown')
AND address IS NOT NULL
AND address != '';

-- ============================================================================
-- VERIFICATION: Show normalized prefecture counts
-- ============================================================================
SELECT 
    'Normalized Prefecture Counts' AS report_type,
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
-- VERIFICATION: Show shops that still have NULL/Unknown prefecture
-- ============================================================================
SELECT 
    'Shops with NULL/Unknown Prefecture' AS report_type,
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

