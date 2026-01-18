-- ============================================================================
-- ANALYZE REMAINING UNKNOWN SHOPS - IDENTIFY PATTERNS
-- ============================================================================
-- This query analyzes the remaining Unknown shops to identify patterns
-- that can be used for further categorization
-- ============================================================================

-- ============================================================================
-- ANALYSIS 1: Sample of Unknown shops with their names
-- ============================================================================
SELECT 
    'Sample Unknown Shops' AS analysis_type,
    s.id,
    s.name AS shop_name,
    s.address,
    s.city,
    s.subcategory AS current_subcategory,
    LENGTH(s.name) AS name_length
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name = 'Unknown'
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

-- ============================================================================
-- ANALYSIS 2: Common words/patterns in Unknown shop names
-- ============================================================================
SELECT 
    'Common Words in Unknown Shop Names' AS analysis_type,
    word,
    COUNT(*) AS occurrence_count
FROM (
    SELECT 
        s.id,
        UNNEST(STRING_TO_ARRAY(LOWER(REGEXP_REPLACE(s.name, '[^a-z0-9\s]', ' ', 'g')), ' ')) AS word
    FROM shops s
    JOIN categories c ON s.category_id = c.id
    WHERE c.name = 'Unknown'
    AND (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'deleted_at'
        )
        OR s.deleted_at IS NULL
    )
    AND s.address IS NOT NULL 
    AND s.address != ''
    AND s.name IS NOT NULL
) word_list
WHERE word != ''
AND LENGTH(word) > 2
GROUP BY word
ORDER BY occurrence_count DESC
LIMIT 50;

-- ============================================================================
-- ANALYSIS 3: Address patterns in Unknown shops
-- ============================================================================
SELECT 
    'Address Patterns in Unknown Shops' AS analysis_type,
    CASE 
        WHEN address ~* 'restaurant|レストラン|食堂|料理' THEN 'Contains restaurant pattern'
        WHEN address ~* 'hotel|ホテル|旅館|inn' THEN 'Contains hotel pattern'
        WHEN address ~* 'salon|サロン|美容|ヘア' THEN 'Contains salon pattern'
        WHEN address ~* 'clinic|クリニック|医院|診療' THEN 'Contains clinic pattern'
        WHEN address ~* 'spa|スパ|温泉|onsen' THEN 'Contains spa/onsen pattern'
        WHEN address ~* 'golf|ゴルフ' THEN 'Contains golf pattern'
        WHEN address ~* 'izakaya|居酒屋|bar|バー' THEN 'Contains izakaya/bar pattern'
        ELSE 'No clear pattern'
    END AS address_pattern,
    COUNT(*) AS shop_count
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name = 'Unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
GROUP BY 
    CASE 
        WHEN address ~* 'restaurant|レストラン|食堂|料理' THEN 'Contains restaurant pattern'
        WHEN address ~* 'hotel|ホテル|旅館|inn' THEN 'Contains hotel pattern'
        WHEN address ~* 'salon|サロン|美容|ヘア' THEN 'Contains salon pattern'
        WHEN address ~* 'clinic|クリニック|医院|診療' THEN 'Contains clinic pattern'
        WHEN address ~* 'spa|スパ|温泉|onsen' THEN 'Contains spa/onsen pattern'
        WHEN address ~* 'golf|ゴルフ' THEN 'Contains golf pattern'
        WHEN address ~* 'izakaya|居酒屋|bar|バー' THEN 'Contains izakaya/bar pattern'
        ELSE 'No clear pattern'
    END
ORDER BY shop_count DESC;

-- ============================================================================
-- ANALYSIS 4: Shop names with very short or very long names
-- ============================================================================
SELECT 
    'Name Length Distribution' AS analysis_type,
    CASE 
        WHEN LENGTH(s.name) < 5 THEN 'Very short (< 5 chars)'
        WHEN LENGTH(s.name) < 10 THEN 'Short (5-9 chars)'
        WHEN LENGTH(s.name) < 20 THEN 'Medium (10-19 chars)'
        WHEN LENGTH(s.name) < 30 THEN 'Long (20-29 chars)'
        ELSE 'Very long (30+ chars)'
    END AS name_length_category,
    COUNT(*) AS shop_count,
    AVG(LENGTH(s.name)) AS avg_length
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name = 'Unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
GROUP BY 
    CASE 
        WHEN LENGTH(s.name) < 5 THEN 'Very short (< 5 chars)'
        WHEN LENGTH(s.name) < 10 THEN 'Short (5-9 chars)'
        WHEN LENGTH(s.name) < 20 THEN 'Medium (10-19 chars)'
        WHEN LENGTH(s.name) < 30 THEN 'Long (20-29 chars)'
        ELSE 'Very long (30+ chars)'
    END
ORDER BY shop_count DESC;

-- ============================================================================
-- ANALYSIS 5: Shops with NULL or empty names
-- ============================================================================
SELECT 
    'Shops with NULL/Empty Names' AS analysis_type,
    COUNT(*) AS shop_count
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name = 'Unknown'
AND (s.name IS NULL OR s.name = '' OR TRIM(s.name) = '')
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
-- ANALYSIS 6: Summary of Unknown shops
-- ============================================================================
SELECT 
    'Unknown Shops Summary' AS analysis_type,
    COUNT(*) AS total_unknown_shops,
    COUNT(CASE WHEN s.name IS NOT NULL AND s.name != '' THEN 1 END) AS shops_with_name,
    COUNT(CASE WHEN s.name IS NULL OR s.name = '' THEN 1 END) AS shops_without_name,
    COUNT(CASE WHEN s.address IS NOT NULL AND s.address != '' THEN 1 END) AS shops_with_address,
    COUNT(CASE WHEN s.city IS NOT NULL AND s.city != '' THEN 1 END) AS shops_with_city,
    COUNT(CASE WHEN s.subcategory IS NOT NULL AND s.subcategory != '' THEN 1 END) AS shops_with_subcategory
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name = 'Unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != '';

