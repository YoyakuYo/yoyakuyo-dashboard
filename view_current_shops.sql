-- ============================================
-- VIEW CURRENT SHOPS AFTER CLEANUP
-- Shows shops with their geographic data completeness
-- ============================================

-- Step 1: Overall statistics
SELECT 
  'OVERALL STATISTICS' AS report_type,
  COUNT(*) AS total_shops,
  COUNT(DISTINCT prefecture) AS prefectures,
  COUNT(DISTINCT normalized_city) AS cities,
  COUNT(CASE WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN 1 END) AS shops_with_city,
  COUNT(CASE WHEN prefecture IS NOT NULL AND prefecture != '' THEN 1 END) AS shops_with_prefecture,
  COUNT(CASE WHEN address IS NOT NULL AND address != '' THEN 1 END) AS shops_with_address,
  ROUND(
    COUNT(CASE WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) AS city_completion_percentage
FROM shops
WHERE address IS NOT NULL
  AND address != '';

-- Step 2: Breakdown by prefecture
SELECT 
  'BY PREFECTURE' AS report_type,
  prefecture,
  COUNT(*) AS total_shops,
  COUNT(CASE WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN 1 END) AS shops_with_city,
  COUNT(DISTINCT normalized_city) AS unique_cities,
  ROUND(
    COUNT(CASE WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) AS city_completion_percentage
FROM shops
WHERE address IS NOT NULL
  AND address != ''
  AND prefecture IS NOT NULL
GROUP BY prefecture
ORDER BY total_shops DESC
LIMIT 20;

-- Step 3: Sample shops with complete geographic data
SELECT 
  'SAMPLE SHOPS (COMPLETE DATA)' AS report_type,
  id,
  name,
  address,
  prefecture,
  normalized_city,
  CASE 
    WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN '✅ Complete'
    ELSE '❌ Missing city'
  END AS data_status
FROM shops
WHERE address IS NOT NULL
  AND address != ''
  AND prefecture IS NOT NULL
  AND normalized_city IS NOT NULL
  AND normalized_city != ''
ORDER BY prefecture, normalized_city, name
LIMIT 50;

-- Step 4: Shops missing normalized_city (if any)
SELECT 
  'SHOPS MISSING CITY' AS report_type,
  id,
  name,
  address,
  prefecture,
  normalized_city,
  CASE 
    WHEN address ~ '^[0-9-]+$' THEN 'Just numbers'
    WHEN address IS NULL OR address = '' THEN 'No address'
    ELSE 'Has address but no city'
  END AS issue_type
FROM shops
WHERE address IS NOT NULL
  AND address != ''
  AND (normalized_city IS NULL OR normalized_city = '')
ORDER BY prefecture, name
LIMIT 50;

-- Step 5: Top cities by shop count
SELECT 
  'TOP CITIES' AS report_type,
  normalized_city,
  prefecture,
  COUNT(*) AS shop_count
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND prefecture IS NOT NULL
GROUP BY normalized_city, prefecture
ORDER BY shop_count DESC
LIMIT 30;

-- Step 6: Breakdown by region (using prefecture mapping)
WITH shop_regions AS (
  SELECT 
    s.*,
    CASE s.prefecture
      WHEN 'hokkaido' THEN 'Hokkaido'
      WHEN 'aomori' THEN 'Tohoku'
      WHEN 'iwate' THEN 'Tohoku'
      WHEN 'miyagi' THEN 'Tohoku'
      WHEN 'akita' THEN 'Tohoku'
      WHEN 'yamagata' THEN 'Tohoku'
      WHEN 'fukushima' THEN 'Tohoku'
      WHEN 'ibaraki' THEN 'Kanto'
      WHEN 'tochigi' THEN 'Kanto'
      WHEN 'gunma' THEN 'Kanto'
      WHEN 'saitama' THEN 'Kanto'
      WHEN 'chiba' THEN 'Kanto'
      WHEN 'tokyo' THEN 'Kanto'
      WHEN 'kanagawa' THEN 'Kanto'
      WHEN 'niigata' THEN 'Chubu'
      WHEN 'toyama' THEN 'Chubu'
      WHEN 'ishikawa' THEN 'Chubu'
      WHEN 'fukui' THEN 'Chubu'
      WHEN 'yamanashi' THEN 'Chubu'
      WHEN 'nagano' THEN 'Chubu'
      WHEN 'gifu' THEN 'Chubu'
      WHEN 'shizuoka' THEN 'Chubu'
      WHEN 'aichi' THEN 'Chubu'
      WHEN 'mie' THEN 'Kansai'
      WHEN 'shiga' THEN 'Kansai'
      WHEN 'kyoto' THEN 'Kansai'
      WHEN 'osaka' THEN 'Kansai'
      WHEN 'hyogo' THEN 'Kansai'
      WHEN 'nara' THEN 'Kansai'
      WHEN 'wakayama' THEN 'Kansai'
      WHEN 'tottori' THEN 'Chugoku'
      WHEN 'shimane' THEN 'Chugoku'
      WHEN 'okayama' THEN 'Chugoku'
      WHEN 'hiroshima' THEN 'Chugoku'
      WHEN 'yamaguchi' THEN 'Chugoku'
      WHEN 'tokushima' THEN 'Shikoku'
      WHEN 'kagawa' THEN 'Shikoku'
      WHEN 'ehime' THEN 'Shikoku'
      WHEN 'kochi' THEN 'Shikoku'
      WHEN 'fukuoka' THEN 'Kyushu'
      WHEN 'saga' THEN 'Kyushu'
      WHEN 'nagasaki' THEN 'Kyushu'
      WHEN 'kumamoto' THEN 'Kyushu'
      WHEN 'oita' THEN 'Kyushu'
      WHEN 'miyazaki' THEN 'Kyushu'
      WHEN 'kagoshima' THEN 'Kyushu'
      WHEN 'okinawa' THEN 'Kyushu'
      ELSE NULL
    END AS region
  FROM shops s
  WHERE s.address IS NOT NULL
    AND s.address != ''
)
SELECT 
  'BY REGION' AS report_type,
  region,
  COUNT(*) AS total_shops,
  COUNT(CASE WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN 1 END) AS shops_with_city,
  COUNT(DISTINCT prefecture) AS prefectures,
  COUNT(DISTINCT normalized_city) AS cities,
  ROUND(
    COUNT(CASE WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) AS city_completion_percentage
FROM shop_regions
WHERE region IS NOT NULL
GROUP BY region
ORDER BY total_shops DESC;

-- Step 7: Address quality check
SELECT 
  'ADDRESS QUALITY' AS report_type,
  CASE 
    WHEN address ~ '^[0-9-]+$' THEN 'Just numbers (incomplete)'
    WHEN address IS NULL OR address = '' THEN 'No address'
    WHEN LENGTH(TRIM(address)) < 10 THEN 'Very short address'
    WHEN address ~ '[都道府県]' THEN 'Has prefecture in address'
    WHEN address ~ '[市区町村]' THEN 'Has city in address'
    WHEN address ~ '[0-9]{3}-[0-9]{4}' THEN 'Has postal code'
    ELSE 'Other format'
  END AS address_type,
  COUNT(*) AS shop_count
FROM shops
WHERE address IS NOT NULL
  AND address != ''
GROUP BY 
  CASE 
    WHEN address ~ '^[0-9-]+$' THEN 'Just numbers (incomplete)'
    WHEN address IS NULL OR address = '' THEN 'No address'
    WHEN LENGTH(TRIM(address)) < 10 THEN 'Very short address'
    WHEN address ~ '[都道府県]' THEN 'Has prefecture in address'
    WHEN address ~ '[市区町村]' THEN 'Has city in address'
    WHEN address ~ '[0-9]{3}-[0-9]{4}' THEN 'Has postal code'
    ELSE 'Other format'
  END
ORDER BY shop_count DESC;

