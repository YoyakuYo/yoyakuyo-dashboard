-- Verify All 5 Shop Filter Dropdowns
-- This script verifies that category, region, prefecture, city, and shop status filters work correctly

-- ============================================
-- 1. CATEGORY FILTER VERIFICATION
-- ============================================
SELECT 
  'CATEGORY FILTER' AS filter_type,
  COUNT(*) AS total_shops,
  COUNT(DISTINCT category_id) AS unique_categories,
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) AS shops_without_category
FROM shops
WHERE address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status != 'hidden');

-- Show category distribution
SELECT 
  'CATEGORY DISTRIBUTION' AS report_type,
  c.name AS category_name,
  c.slug AS category_slug,
  COUNT(s.id) AS shop_count
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
WHERE s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
GROUP BY c.id, c.name, c.slug
ORDER BY shop_count DESC
LIMIT 20;

-- ============================================
-- 2. REGION FILTER VERIFICATION
-- ============================================
-- Region is a frontend concept that maps to prefectures
-- Verify that prefectures are correctly extracted and can be mapped to regions

SELECT 
  'PREFECTURE EXTRACTION' AS report_type,
  prefecture,
  COUNT(*) AS shop_count
FROM shops
WHERE address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status != 'hidden')
  AND prefecture IS NOT NULL
GROUP BY prefecture
ORDER BY shop_count DESC
LIMIT 10;

-- Verify prefectures that should map to Kanto region (example)
SELECT 
  'KANTO REGION SHOPS' AS report_type,
  prefecture,
  COUNT(*) AS shop_count
FROM shops
WHERE address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status != 'hidden')
  AND prefecture IN ('ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa')
GROUP BY prefecture
ORDER BY shop_count DESC;

-- ============================================
-- 3. PREFECTURE FILTER VERIFICATION
-- ============================================
-- Verify prefecture data quality

SELECT 
  'PREFECTURE DATA QUALITY' AS report_type,
  COUNT(*) AS total_shops,
  COUNT(CASE WHEN prefecture IS NOT NULL THEN 1 END) AS shops_with_prefecture,
  COUNT(CASE WHEN prefecture IS NULL THEN 1 END) AS shops_without_prefecture,
  ROUND(100.0 * COUNT(CASE WHEN prefecture IS NOT NULL THEN 1 END) / COUNT(*), 2) AS prefecture_coverage_pct
FROM shops
WHERE address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status != 'hidden');

-- Sample shops by prefecture (Tokyo example)
SELECT 
  'TOKYO PREFECTURE SAMPLE' AS report_type,
  id,
  name,
  address,
  prefecture,
  normalized_city
FROM shops
WHERE prefecture = 'tokyo'
  AND address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status != 'hidden')
LIMIT 10;

-- ============================================
-- 4. CITY FILTER VERIFICATION
-- ============================================
-- Verify city data and city_id filtering capability

SELECT 
  'CITY DATA QUALITY' AS report_type,
  COUNT(*) AS total_shops,
  COUNT(CASE WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN 1 END) AS shops_with_city,
  COUNT(CASE WHEN normalized_city IS NULL OR normalized_city = '' THEN 1 END) AS shops_without_city,
  ROUND(100.0 * COUNT(CASE WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN 1 END) / COUNT(*), 2) AS city_coverage_pct
FROM shops
WHERE address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status != 'hidden');

-- Top cities by shop count
SELECT 
  'TOP CITIES BY SHOP COUNT' AS report_type,
  normalized_city,
  prefecture,
  COUNT(*) AS shop_count
FROM shops
WHERE normalized_city IS NOT NULL 
  AND normalized_city != ''
  AND address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status != 'hidden')
GROUP BY normalized_city, prefecture
ORDER BY shop_count DESC
LIMIT 20;

-- Verify cities table has matching data
SELECT 
  'CITIES TABLE VERIFICATION' AS report_type,
  COUNT(*) AS total_cities,
  COUNT(DISTINCT name) AS unique_city_names,
  COUNT(DISTINCT slug) AS unique_city_slugs
FROM cities;

-- Sample city matching (Shibuya example)
SELECT 
  'SHIBUYA CITY MATCHING' AS report_type,
  s.id,
  s.name,
  s.address,
  s.normalized_city,
  s.prefecture,
  c.name AS city_table_name,
  c.slug AS city_table_slug
FROM shops s
LEFT JOIN cities c ON LOWER(s.normalized_city) = LOWER(c.name) OR LOWER(s.normalized_city) = LOWER(c.slug)
WHERE (s.address ILIKE '%渋谷%' OR s.address ILIKE '%shibuya%' OR s.normalized_city ILIKE '%渋谷%' OR s.normalized_city ILIKE '%shibuya%')
  AND s.prefecture = 'tokyo'
  AND s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
LIMIT 10;

-- ============================================
-- 5. SHOP STATUS (is_verified) FILTER VERIFICATION
-- ============================================
SELECT 
  'SHOP STATUS DISTRIBUTION' AS report_type,
  COUNT(*) AS total_shops,
  COUNT(CASE WHEN is_verified = true THEN 1 END) AS verified_shops,
  COUNT(CASE WHEN is_verified = false OR is_verified IS NULL THEN 1 END) AS unverified_shops,
  ROUND(100.0 * COUNT(CASE WHEN is_verified = true THEN 1 END) / COUNT(*), 2) AS verified_percentage
FROM shops
WHERE address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status != 'hidden');

-- Sample verified shops
SELECT 
  'VERIFIED SHOPS SAMPLE' AS report_type,
  id,
  name,
  address,
  prefecture,
  normalized_city,
  is_verified
FROM shops
WHERE is_verified = true
  AND address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status != 'hidden')
LIMIT 10;

-- ============================================
-- COMBINED FILTER TEST
-- ============================================
-- Test a combination: Category + Prefecture + City + Verified
-- Example: Barbershop in Tokyo, Shibuya, Verified

SELECT 
  'COMBINED FILTER TEST' AS report_type,
  COUNT(*) AS matching_shops
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE s.prefecture = 'tokyo'
  AND (s.address ILIKE '%渋谷%' OR s.address ILIKE '%shibuya%' OR s.normalized_city ILIKE '%渋谷%' OR s.normalized_city ILIKE '%shibuya%')
  AND s.is_verified = true
  AND (c.slug = 'barbershop' OR c.slug = 'barber_shop')
  AND s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status != 'hidden');

-- Show the actual shops matching the combined filter
SELECT 
  'COMBINED FILTER RESULTS' AS report_type,
  s.id,
  s.name,
  s.address,
  s.prefecture,
  s.normalized_city,
  s.is_verified,
  c.name AS category_name,
  c.slug AS category_slug
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE s.prefecture = 'tokyo'
  AND (s.address ILIKE '%渋谷%' OR s.address ILIKE '%shibuya%' OR s.normalized_city ILIKE '%渋谷%' OR s.normalized_city ILIKE '%shibuya%')
  AND s.is_verified = true
  AND (c.slug = 'barbershop' OR c.slug = 'barber_shop')
  AND s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
LIMIT 20;

-- ============================================
-- FILTER COVERAGE SUMMARY
-- ============================================
SELECT 
  'FILTER COVERAGE SUMMARY' AS report_type,
  COUNT(*) AS total_shops,
  COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) AS has_category,
  COUNT(CASE WHEN prefecture IS NOT NULL THEN 1 END) AS has_prefecture,
  COUNT(CASE WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN 1 END) AS has_city,
  COUNT(CASE WHEN is_verified IS NOT NULL THEN 1 END) AS has_verification_status,
  -- Shops with all filters available
  COUNT(CASE 
    WHEN category_id IS NOT NULL 
      AND prefecture IS NOT NULL 
      AND normalized_city IS NOT NULL 
      AND normalized_city != ''
      AND is_verified IS NOT NULL
    THEN 1 
  END) AS shops_with_all_filters
FROM shops
WHERE address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status != 'hidden');

