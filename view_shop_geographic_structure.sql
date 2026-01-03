-- ============================================
-- SHOP GEOGRAPHIC STRUCTURE QUERIES
-- Run these in Supabase SQL Editor to see the structure
-- ============================================

-- ============================================
-- 1. SHOP STRUCTURE OVERVIEW
-- ============================================
-- See what geographic fields shops have
SELECT 
  id,
  name,
  address,
  prefecture,
  normalized_city,
  city,
  city_id,
  category_id
FROM shops
WHERE address IS NOT NULL 
  AND address != ''
LIMIT 10;

-- ============================================
-- 2. CITIES TABLE STRUCTURE
-- ============================================
-- See all cities and their prefectures
SELECT 
  id,
  name,
  slug,
  prefecture_name,
  created_at
FROM cities
ORDER BY prefecture_name, name
LIMIT 50;

-- ============================================
-- 3. SHOPS WITH CITY REFERENCES
-- ============================================
-- See shops that have city_id references
SELECT 
  s.id,
  s.name,
  s.address,
  s.prefecture,
  s.normalized_city,
  s.city_id,
  c.name AS city_name,
  c.slug AS city_slug,
  c.prefecture_name AS city_prefecture
FROM shops s
LEFT JOIN cities c ON s.city_id = c.id
WHERE s.address IS NOT NULL 
  AND s.address != ''
  AND s.city_id IS NOT NULL
LIMIT 20;

-- ============================================
-- 4. PREFECTURE DISTRIBUTION
-- ============================================
-- Count shops by prefecture
SELECT 
  prefecture,
  COUNT(*) AS shop_count
FROM shops
WHERE prefecture IS NOT NULL 
  AND prefecture != ''
  AND address IS NOT NULL
  AND address != ''
GROUP BY prefecture
ORDER BY shop_count DESC;

-- ============================================
-- 5. CITY DISTRIBUTION (from normalized_city)
-- ============================================
-- Count shops by normalized_city
SELECT 
  normalized_city,
  prefecture,
  COUNT(*) AS shop_count
FROM shops
WHERE normalized_city IS NOT NULL 
  AND normalized_city != ''
  AND address IS NOT NULL
  AND address != ''
GROUP BY normalized_city, prefecture
ORDER BY shop_count DESC
LIMIT 30;

-- ============================================
-- 6. REGION MAPPING (Derived from Prefecture)
-- ============================================
-- Map prefectures to regions (frontend logic, shown here for reference)
SELECT 
  prefecture,
  CASE 
    WHEN prefecture = 'hokkaido' THEN 'Hokkaido (北海道)'
    WHEN prefecture IN ('aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima') THEN 'Tohoku (東北)'
    WHEN prefecture IN ('ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa') THEN 'Kanto (関東)'
    WHEN prefecture IN ('niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu', 'shizuoka', 'aichi') THEN 'Chubu (中部)'
    WHEN prefecture IN ('mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama') THEN 'Kansai (関西)'
    WHEN prefecture IN ('tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi') THEN 'Chugoku (中国)'
    WHEN prefecture IN ('tokushima', 'kagawa', 'ehime', 'kochi') THEN 'Shikoku (四国)'
    WHEN prefecture IN ('fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa') THEN 'Kyushu–Okinawa (九州・沖縄)'
    ELSE 'Unknown'
  END AS region,
  COUNT(*) AS shop_count
FROM shops
WHERE prefecture IS NOT NULL 
  AND prefecture != ''
  AND address IS NOT NULL
  AND address != ''
GROUP BY prefecture
ORDER BY shop_count DESC;

-- ============================================
-- 7. COMPLETE SHOP GEOGRAPHIC VIEW
-- ============================================
-- Full geographic structure for a sample of shops
SELECT 
  s.id,
  s.name AS shop_name,
  s.address,
  s.prefecture,
  s.normalized_city,
  s.city_id,
  c.name AS city_name_from_table,
  c.prefecture_name AS city_prefecture_name,
  CASE 
    WHEN s.prefecture = 'hokkaido' THEN 'Hokkaido'
    WHEN s.prefecture IN ('aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima') THEN 'Tohoku'
    WHEN s.prefecture IN ('ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa') THEN 'Kanto'
    WHEN s.prefecture IN ('niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu', 'shizuoka', 'aichi') THEN 'Chubu'
    WHEN s.prefecture IN ('mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama') THEN 'Kansai'
    WHEN s.prefecture IN ('tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi') THEN 'Chugoku'
    WHEN s.prefecture IN ('tokushima', 'kagawa', 'ehime', 'kochi') THEN 'Shikoku'
    WHEN s.prefecture IN ('fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa') THEN 'Kyushu–Okinawa'
    ELSE 'Unknown'
  END AS region
FROM shops s
LEFT JOIN cities c ON s.city_id = c.id
WHERE s.address IS NOT NULL 
  AND s.address != ''
  AND s.prefecture IS NOT NULL
ORDER BY s.prefecture, s.normalized_city
LIMIT 50;

-- ============================================
-- 8. SHOPS BY REGION SUMMARY
-- ============================================
-- Summary count by region
SELECT 
  CASE 
    WHEN prefecture = 'hokkaido' THEN 'Hokkaido (北海道)'
    WHEN prefecture IN ('aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima') THEN 'Tohoku (東北)'
    WHEN prefecture IN ('ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa') THEN 'Kanto (関東)'
    WHEN prefecture IN ('niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu', 'shizuoka', 'aichi') THEN 'Chubu (中部)'
    WHEN prefecture IN ('mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama') THEN 'Kansai (関西)'
    WHEN prefecture IN ('tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi') THEN 'Chugoku (中国)'
    WHEN prefecture IN ('tokushima', 'kagawa', 'ehime', 'kochi') THEN 'Shikoku (四国)'
    WHEN prefecture IN ('fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa') THEN 'Kyushu–Okinawa (九州・沖縄)'
    ELSE 'Unknown'
  END AS region,
  COUNT(*) AS total_shops,
  COUNT(DISTINCT prefecture) AS prefecture_count,
  COUNT(DISTINCT normalized_city) AS city_count
FROM shops
WHERE prefecture IS NOT NULL 
  AND prefecture != ''
  AND address IS NOT NULL
  AND address != ''
GROUP BY 
  CASE 
    WHEN prefecture = 'hokkaido' THEN 'Hokkaido (北海道)'
    WHEN prefecture IN ('aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima') THEN 'Tohoku (東北)'
    WHEN prefecture IN ('ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa') THEN 'Kanto (関東)'
    WHEN prefecture IN ('niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu', 'shizuoka', 'aichi') THEN 'Chubu (中部)'
    WHEN prefecture IN ('mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama') THEN 'Kansai (関西)'
    WHEN prefecture IN ('tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi') THEN 'Chugoku (中国)'
    WHEN prefecture IN ('tokushima', 'kagawa', 'ehime', 'kochi') THEN 'Shikoku (四国)'
    WHEN prefecture IN ('fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa') THEN 'Kyushu–Okinawa (九州・沖縄)'
    ELSE 'Unknown'
  END
ORDER BY total_shops DESC;

-- ============================================
-- 9. EXAMPLE: TOKYO SHOPS WITH CITY BREAKDOWN
-- ============================================
-- Detailed view of Tokyo shops showing city structure
SELECT 
  s.normalized_city,
  s.city_id,
  c.name AS city_name_from_table,
  COUNT(*) AS shop_count,
  STRING_AGG(DISTINCT SUBSTRING(s.address, 1, 50), ' | ') AS sample_addresses
FROM shops s
LEFT JOIN cities c ON s.city_id = c.id
WHERE s.prefecture = 'tokyo'
  AND s.address IS NOT NULL
  AND s.address != ''
GROUP BY s.normalized_city, s.city_id, c.name
ORDER BY shop_count DESC
LIMIT 30;

-- ============================================
-- 10. MISSING DATA CHECK
-- ============================================
-- Check for shops missing geographic data
SELECT 
  'Shops without prefecture' AS issue_type,
  COUNT(*) AS count
FROM shops
WHERE (prefecture IS NULL OR prefecture = '')
  AND address IS NOT NULL
  AND address != ''

UNION ALL

SELECT 
  'Shops without normalized_city' AS issue_type,
  COUNT(*) AS count
FROM shops
WHERE (normalized_city IS NULL OR normalized_city = '')
  AND address IS NOT NULL
  AND address != ''

UNION ALL

SELECT 
  'Shops with city_id but no matching city' AS issue_type,
  COUNT(*) AS count
FROM shops s
LEFT JOIN cities c ON s.city_id = c.id
WHERE s.city_id IS NOT NULL
  AND c.id IS NULL;

