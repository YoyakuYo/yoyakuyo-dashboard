-- ============================================================================
-- FIX PREFECTURE CASE CONSISTENCY
-- ============================================================================
-- The prefecture field should use lowercase keys (e.g., 'tokyo', 'osaka')
-- to match what the API expects. This migration fixes any capitalized values.
-- ============================================================================

-- Fix case inconsistency: convert all prefecture values to lowercase
UPDATE shops
SET prefecture = LOWER(prefecture)
WHERE prefecture IS NOT NULL
AND prefecture != ''
AND prefecture != LOWER(prefecture); -- Only update if not already lowercase

-- Verification: Check for any remaining capitalized prefectures
SELECT 
    'Case Check - Capitalized Prefectures' AS report_type,
    prefecture,
    COUNT(*) AS shop_count
FROM shops
WHERE prefecture IS NOT NULL
AND prefecture != ''
AND prefecture != LOWER(prefecture)
GROUP BY prefecture
ORDER BY shop_count DESC;

-- Show corrected distribution (should all be lowercase now)
SELECT 
    'Prefecture Distribution (Corrected)' AS report_type,
    prefecture,
    COUNT(*) AS shop_count
FROM shops
WHERE prefecture IS NOT NULL
AND prefecture != ''
GROUP BY prefecture
ORDER BY shop_count DESC
LIMIT 15;

-- Check for any NULL or empty prefectures that still need population
SELECT 
    'Shops Still Missing Prefecture' AS report_type,
    COUNT(*) AS shops_without_prefecture
FROM shops
WHERE (prefecture IS NULL OR prefecture = '')
AND address IS NOT NULL 
AND address != '';

