-- ============================================
-- VIEW SHOPS BY CITY (ACTUAL CITY NAMES)
-- Shows shops with real city names like Shibuya, Chofu, Tachikawa, Ikebukuro, etc.
-- ============================================

-- Step 1: Top cities by shop count (showing actual city names)
SELECT 
  'TOP CITIES BY SHOP COUNT' AS report_type,
  normalized_city,
  prefecture,
  COUNT(*) AS shop_count
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND prefecture IS NOT NULL
GROUP BY normalized_city, prefecture
ORDER BY shop_count DESC
LIMIT 100;

-- Step 2: Sample shops from major cities (Tokyo area)
SELECT 
  'SAMPLE SHOPS - TOKYO AREA' AS report_type,
  id,
  name,
  address,
  prefecture,
  normalized_city,
  'Tokyo area' AS region_note
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND prefecture = 'tokyo'
  AND normalized_city IN (
    '渋谷', 'Shibuya', 'shibuya',
    '調布', 'Chofu', 'chofu',
    '立川', 'Tachikawa', 'tachikawa',
    '池袋', 'Ikebukuro', 'ikebukuro',
    '新宿', 'Shinjuku', 'shinjuku',
    '原宿', 'Harajuku', 'harajuku',
    '表参道', 'Omotesando', 'omotesando',
    '六本木', 'Roppongi', 'roppongi',
    '銀座', 'Ginza', 'ginza',
    '上野', 'Ueno', 'ueno',
    '浅草', 'Asakusa', 'asakusa',
    '品川', 'Shinagawa', 'shinagawa',
    '目黒', 'Meguro', 'meguro',
    '世田谷', 'Setagaya', 'setagaya',
    '港', 'Minato', 'minato',
    '千代田', 'Chiyoda', 'chiyoda',
    '中央', 'Chuo', 'chuo',
    '台東', 'Taito', 'taito',
    '文京', 'Bunkyo', 'bunkyo',
    '墨田', 'Sumida', 'sumida',
    '江東', 'Koto', 'koto',
    '大田', 'Ota', 'ota',
    '中野', 'Nakano', 'nakano',
    '杉並', 'Suginami', 'suginami',
    '豊島', 'Toshima', 'toshima',
    '板橋', 'Itabashi', 'itabashi',
    '練馬', 'Nerima', 'nerima'
  )
ORDER BY normalized_city, name
LIMIT 200;

-- Step 3: Sample shops from major cities (all prefectures)
SELECT 
  'SAMPLE SHOPS - ALL MAJOR CITIES' AS report_type,
  id,
  name,
  address,
  prefecture,
  normalized_city
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND prefecture IS NOT NULL
  AND (
    -- Tokyo cities
    (prefecture = 'tokyo' AND normalized_city IN ('渋谷', '新宿', '池袋', '原宿', '表参道', '六本木', '銀座', '上野', '浅草', '品川', '目黒', '世田谷', '調布', '立川'))
    OR
    -- Osaka cities
    (prefecture = 'osaka' AND normalized_city IN ('大阪', '難波', '心斎橋', '梅田', '天王寺', '日本橋'))
    OR
    -- Kyoto cities
    (prefecture = 'kyoto' AND normalized_city IN ('京都市', '祇園', '清水', '嵐山'))
    OR
    -- Yokohama/Kanagawa
    (prefecture = 'kanagawa' AND normalized_city IN ('横浜', 'Yokohama', '鎌倉', 'Kamakura'))
    OR
    -- Chiba cities
    (prefecture = 'chiba' AND normalized_city IN ('千葉', 'Chiba', '松戸', 'Matsudo', '船橋', 'Funabashi', '柏', 'Kashiwa'))
    OR
    -- Saitama cities
    (prefecture = 'saitama' AND normalized_city IN ('さいたま', 'Saitama', '川越', 'Kawagoe'))
    OR
    -- Hyogo/Kobe cities
    (prefecture = 'hyogo' AND normalized_city IN ('神戸', 'Kobe', '姫路', 'Himeji', '三木', 'Miki', '加古川', 'Kakogawa'))
    OR
    -- Fukuoka cities
    (prefecture = 'fukuoka' AND normalized_city IN ('福岡', 'Fukuoka', '北九州', 'Kitakyushu'))
    OR
    -- Other major cities
    (normalized_city IN ('名古屋', 'Nagoya', '仙台', 'Sendai', '札幌', 'Sapporo', '広島', 'Hiroshima', '横浜', 'Yokohama'))
  )
ORDER BY prefecture, normalized_city, name
LIMIT 300;

-- Step 4: All shops with normalized_city (grouped by city)
SELECT 
  'ALL SHOPS BY CITY' AS report_type,
  normalized_city,
  prefecture,
  COUNT(*) AS shop_count,
  STRING_AGG(DISTINCT name, ', ' ORDER BY name) FILTER (WHERE ROW_NUMBER() OVER (PARTITION BY normalized_city, prefecture ORDER BY name) <= 5) AS sample_shop_names
FROM (
  SELECT 
    normalized_city,
    prefecture,
    name,
    ROW_NUMBER() OVER (PARTITION BY normalized_city, prefecture ORDER BY name) as rn
  FROM shops
  WHERE normalized_city IS NOT NULL
    AND normalized_city != ''
    AND prefecture IS NOT NULL
) AS ranked_shops
WHERE rn <= 5
GROUP BY normalized_city, prefecture
ORDER BY shop_count DESC, prefecture, normalized_city
LIMIT 200;

-- Step 5: Detailed list of shops with city names (paged)
SELECT 
  'DETAILED SHOP LIST' AS report_type,
  id,
  name,
  address,
  prefecture,
  normalized_city,
  CASE 
    WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN '✅ Has city'
    ELSE '❌ No city'
  END AS city_status
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND prefecture IS NOT NULL
ORDER BY prefecture, normalized_city, name
LIMIT 500;

-- Step 6: Cities with most shops (showing actual city names)
SELECT 
  'CITIES WITH MOST SHOPS' AS report_type,
  normalized_city,
  prefecture,
  COUNT(*) AS shop_count,
  MIN(name) AS example_shop_name,
  MIN(address) AS example_address
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND prefecture IS NOT NULL
GROUP BY normalized_city, prefecture
HAVING COUNT(*) >= 10  -- Cities with at least 10 shops
ORDER BY shop_count DESC
LIMIT 100;

-- Step 7: Search for specific cities (customize the city names here)
SELECT 
  'SEARCH SPECIFIC CITIES' AS report_type,
  id,
  name,
  address,
  prefecture,
  normalized_city
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND (
    -- Add your city names here (case-insensitive)
    LOWER(normalized_city) LIKE '%shibuya%'
    OR LOWER(normalized_city) LIKE '%渋谷%'
    OR LOWER(normalized_city) LIKE '%chofu%'
    OR LOWER(normalized_city) LIKE '%調布%'
    OR LOWER(normalized_city) LIKE '%tachikawa%'
    OR LOWER(normalized_city) LIKE '%立川%'
    OR LOWER(normalized_city) LIKE '%ikebukuro%'
    OR LOWER(normalized_city) LIKE '%池袋%'
    OR LOWER(normalized_city) LIKE '%shinjuku%'
    OR LOWER(normalized_city) LIKE '%新宿%'
    OR LOWER(normalized_city) LIKE '%harajuku%'
    OR LOWER(normalized_city) LIKE '%原宿%'
    OR LOWER(normalized_city) LIKE '%roppongi%'
    OR LOWER(normalized_city) LIKE '%六本木%'
    OR LOWER(normalized_city) LIKE '%ginza%'
    OR LOWER(normalized_city) LIKE '%銀座%'
    OR LOWER(normalized_city) LIKE '%ueno%'
    OR LOWER(normalized_city) LIKE '%上野%'
    OR LOWER(normalized_city) LIKE '%asakusa%'
    OR LOWER(normalized_city) LIKE '%浅草%'
  )
ORDER BY prefecture, normalized_city, name
LIMIT 500;

