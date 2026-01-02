-- ============================================================================
-- ANALYZE UNKNOWN PREFECTURES - DIAGNOSTIC QUERIES
-- ============================================================================
-- This migration provides diagnostic queries to understand why shops have
-- NULL or 'Unknown' prefecture values
-- ============================================================================

-- ============================================================================
-- QUERY 1: Sample addresses from shops with Unknown prefecture
-- ============================================================================
SELECT 
    'Sample Unknown Prefecture Addresses' AS query_type,
    id,
    name,
    address,
    city,
    prefecture,
    SUBSTRING(address, 1, 100) AS address_sample
FROM shops
WHERE (prefecture IS NULL OR prefecture = 'Unknown' OR LOWER(prefecture) = 'unknown')
AND address IS NOT NULL 
AND address != ''
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
LIMIT 50;

-- ============================================================================
-- QUERY 2: Address patterns that might indicate prefecture
-- ============================================================================
SELECT 
    'Address Patterns Analysis' AS query_type,
    CASE 
        WHEN address ~* '東京都|tokyo' THEN 'Contains Tokyo pattern'
        WHEN address ~* '大阪府|osaka' THEN 'Contains Osaka pattern'
        WHEN address ~* '京都府|kyoto' THEN 'Contains Kyoto pattern'
        WHEN address ~* '北海道|hokkaido' THEN 'Contains Hokkaido pattern'
        WHEN address ~* '県' THEN 'Contains 県 (prefecture kanji)'
        WHEN address ~* '都' THEN 'Contains 都 (metropolis kanji)'
        WHEN address ~* '府' THEN 'Contains 府 (urban prefecture kanji)'
        WHEN address ~* '道' THEN 'Contains 道 (circuit kanji)'
        ELSE 'No prefecture pattern found'
    END AS address_pattern,
    COUNT(*) AS shop_count
FROM shops
WHERE (prefecture IS NULL OR prefecture = 'Unknown' OR LOWER(prefecture) = 'unknown')
AND address IS NOT NULL 
AND address != ''
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
GROUP BY 
    CASE 
        WHEN address ~* '東京都|tokyo' THEN 'Contains Tokyo pattern'
        WHEN address ~* '大阪府|osaka' THEN 'Contains Osaka pattern'
        WHEN address ~* '京都府|kyoto' THEN 'Contains Kyoto pattern'
        WHEN address ~* '北海道|hokkaido' THEN 'Contains Hokkaido pattern'
        WHEN address ~* '県' THEN 'Contains 県 (prefecture kanji)'
        WHEN address ~* '都' THEN 'Contains 都 (metropolis kanji)'
        WHEN address ~* '府' THEN 'Contains 府 (urban prefecture kanji)'
        WHEN address ~* '道' THEN 'Contains 道 (circuit kanji)'
        ELSE 'No prefecture pattern found'
    END
ORDER BY shop_count DESC;

-- ============================================================================
-- QUERY 3: Check if city field has prefecture information
-- ============================================================================
SELECT 
    'City Field Analysis' AS query_type,
    CASE 
        WHEN city IS NULL OR city = '' THEN 'City is NULL or empty'
        WHEN city ~* 'tokyo|osaka|kyoto|hokkaido' THEN 'City contains prefecture name'
        WHEN city ~* '県|都|府|道' THEN 'City contains prefecture kanji'
        ELSE 'City exists but no prefecture pattern'
    END AS city_status,
    COUNT(*) AS shop_count
FROM shops
WHERE (prefecture IS NULL OR prefecture = 'Unknown' OR LOWER(prefecture) = 'unknown')
AND address IS NOT NULL 
AND address != ''
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
GROUP BY 
    CASE 
        WHEN city IS NULL OR city = '' THEN 'City is NULL or empty'
        WHEN city ~* 'tokyo|osaka|kyoto|hokkaido' THEN 'City contains prefecture name'
        WHEN city ~* '県|都|府|道' THEN 'City contains prefecture kanji'
        ELSE 'City exists but no prefecture pattern'
    END
ORDER BY shop_count DESC;

-- ============================================================================
-- QUERY 4: Address length distribution for Unknown prefectures
-- ============================================================================
SELECT 
    'Address Length Distribution' AS query_type,
    CASE 
        WHEN LENGTH(address) < 10 THEN 'Very short (< 10 chars)'
        WHEN LENGTH(address) < 20 THEN 'Short (10-19 chars)'
        WHEN LENGTH(address) < 50 THEN 'Medium (20-49 chars)'
        WHEN LENGTH(address) < 100 THEN 'Long (50-99 chars)'
        ELSE 'Very long (100+ chars)'
    END AS address_length_category,
    COUNT(*) AS shop_count,
    AVG(LENGTH(address)) AS avg_length,
    MIN(LENGTH(address)) AS min_length,
    MAX(LENGTH(address)) AS max_length
FROM shops
WHERE (prefecture IS NULL OR prefecture = 'Unknown' OR LOWER(prefecture) = 'unknown')
AND address IS NOT NULL 
AND address != ''
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
GROUP BY 
    CASE 
        WHEN LENGTH(address) < 10 THEN 'Very short (< 10 chars)'
        WHEN LENGTH(address) < 20 THEN 'Short (10-19 chars)'
        WHEN LENGTH(address) < 50 THEN 'Medium (20-49 chars)'
        WHEN LENGTH(address) < 100 THEN 'Long (50-99 chars)'
        ELSE 'Very long (100+ chars)'
    END
ORDER BY shop_count DESC;

-- ============================================================================
-- QUERY 5: Top 20 addresses that should have prefecture extracted
-- ============================================================================
SELECT 
    'Top Addresses Needing Prefecture Extraction' AS query_type,
    id,
    name,
    address,
    city,
    CASE 
        WHEN address ~* '東京都|tokyo' THEN 'Tokyo'
        WHEN address ~* '大阪府|osaka' THEN 'Osaka'
        WHEN address ~* '京都府|kyoto' THEN 'Kyoto'
        WHEN address ~* '北海道|hokkaido' THEN 'Hokkaido'
        WHEN address ~* '愛知県|aichi' THEN 'Aichi'
        WHEN address ~* '神奈川県|kanagawa' THEN 'Kanagawa'
        WHEN address ~* '埼玉県|saitama' THEN 'Saitama'
        WHEN address ~* '千葉県|chiba' THEN 'Chiba'
        WHEN address ~* '福岡県|fukuoka' THEN 'Fukuoka'
        WHEN address ~* '兵庫県|hyogo' THEN 'Hyogo'
        ELSE 'Could not extract'
    END AS suggested_prefecture
FROM shops
WHERE (prefecture IS NULL OR prefecture = 'Unknown' OR LOWER(prefecture) = 'unknown')
AND address IS NOT NULL 
AND address != ''
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND (
    address ~* '東京都|tokyo|大阪府|osaka|京都府|kyoto|北海道|hokkaido|愛知県|aichi|神奈川県|kanagawa|埼玉県|saitama|千葉県|chiba|福岡県|fukuoka|兵庫県|hyogo'
)
LIMIT 20;

