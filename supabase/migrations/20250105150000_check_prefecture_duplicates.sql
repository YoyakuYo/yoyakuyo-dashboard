-- ============================================================================
-- CHECK FOR PREFECTURE DUPLICATES AND INCONSISTENCIES
-- ============================================================================
-- This migration checks for:
-- 1. Case inconsistencies (Tokyo vs tokyo)
-- 2. Duplicate variations (Tokyo, TOKYO, tokyo)
-- 3. Invalid prefecture values
-- 4. Shops with multiple prefecture matches in address
-- ============================================================================

-- Query 1: Check for case variations of the same prefecture
SELECT 
    'Case Variations Check' AS report_type,
    LOWER(prefecture) AS normalized_prefecture,
    COUNT(DISTINCT prefecture) AS case_variations,
    STRING_AGG(DISTINCT prefecture, ', ' ORDER BY prefecture) AS variations_found,
    COUNT(*) AS total_shops
FROM shops
WHERE prefecture IS NOT NULL
AND prefecture != ''
GROUP BY LOWER(prefecture)
HAVING COUNT(DISTINCT prefecture) > 1
ORDER BY total_shops DESC;

-- Query 2: Check for invalid prefecture values (not in standard list)
WITH valid_prefectures AS (
    SELECT unnest(ARRAY[
        'hokkaido', 'aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima',
        'ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa',
        'niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu', 'shizuoka', 'aichi',
        'mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama',
        'tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi',
        'tokushima', 'kagawa', 'ehime', 'kochi',
        'fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa'
    ]) AS valid_pref
)
SELECT 
    'Invalid Prefecture Values' AS report_type,
    s.prefecture,
    COUNT(*) AS shop_count
FROM shops s
LEFT JOIN valid_prefectures v ON LOWER(s.prefecture) = v.valid_pref
WHERE s.prefecture IS NOT NULL
AND s.prefecture != ''
AND v.valid_pref IS NULL
GROUP BY s.prefecture
ORDER BY shop_count DESC;

-- Query 3: Check for shops with multiple prefecture patterns in address (potential conflicts)
SELECT 
    'Shops with Multiple Prefecture Matches' AS report_type,
    id,
    name,
    address,
    prefecture,
    (
        SELECT COUNT(*) FROM (
            SELECT 1 WHERE address ILIKE '%東京%' OR address ILIKE '%tokyo%'
            UNION SELECT 1 WHERE address ILIKE '%大阪%' OR address ILIKE '%osaka%'
            UNION SELECT 1 WHERE address ILIKE '%京都%' OR address ILIKE '%kyoto%'
            UNION SELECT 1 WHERE address ILIKE '%神奈川%' OR address ILIKE '%kanagawa%'
            UNION SELECT 1 WHERE address ILIKE '%埼玉%' OR address ILIKE '%saitama%'
            UNION SELECT 1 WHERE address ILIKE '%千葉%' OR address ILIKE '%chiba%'
        ) AS matches
    ) AS match_count
FROM shops
WHERE address IS NOT NULL
AND address != ''
AND (
    (address ILIKE '%東京%' OR address ILIKE '%tokyo%') AND
    (address ILIKE '%大阪%' OR address ILIKE '%osaka%' OR
     address ILIKE '%京都%' OR address ILIKE '%kyoto%' OR
     address ILIKE '%神奈川%' OR address ILIKE '%kanagawa%' OR
     address ILIKE '%埼玉%' OR address ILIKE '%saitama%' OR
     address ILIKE '%千葉%' OR address ILIKE '%chiba%')
)
LIMIT 10;

-- Query 4: Summary of all prefecture values (case-sensitive)
SELECT 
    'All Prefecture Values (Case-Sensitive)' AS report_type,
    prefecture,
    COUNT(*) AS shop_count
FROM shops
WHERE prefecture IS NOT NULL
AND prefecture != ''
GROUP BY prefecture
ORDER BY shop_count DESC;

