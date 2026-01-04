-- ============================================
-- VERIFY COMPLETE GEOGRAPHIC DATA FOR SHOPS
-- Checks: Postal Code, normalized_city, prefecture, region
-- ============================================

-- Step 1: Create function to map prefecture to region
CREATE OR REPLACE FUNCTION get_region_from_prefecture(pref_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE pref_key
    -- Hokkaido Region
    WHEN 'hokkaido' THEN 'Hokkaido'
    
    -- Tohoku Region
    WHEN 'aomori' THEN 'Tohoku'
    WHEN 'iwate' THEN 'Tohoku'
    WHEN 'miyagi' THEN 'Tohoku'
    WHEN 'akita' THEN 'Tohoku'
    WHEN 'yamagata' THEN 'Tohoku'
    WHEN 'fukushima' THEN 'Tohoku'
    
    -- Kanto Region
    WHEN 'ibaraki' THEN 'Kanto'
    WHEN 'tochigi' THEN 'Kanto'
    WHEN 'gunma' THEN 'Kanto'
    WHEN 'saitama' THEN 'Kanto'
    WHEN 'chiba' THEN 'Kanto'
    WHEN 'tokyo' THEN 'Kanto'
    WHEN 'kanagawa' THEN 'Kanto'
    
    -- Chubu Region
    WHEN 'niigata' THEN 'Chubu'
    WHEN 'toyama' THEN 'Chubu'
    WHEN 'ishikawa' THEN 'Chubu'
    WHEN 'fukui' THEN 'Chubu'
    WHEN 'yamanashi' THEN 'Chubu'
    WHEN 'nagano' THEN 'Chubu'
    WHEN 'gifu' THEN 'Chubu'
    WHEN 'shizuoka' THEN 'Chubu'
    WHEN 'aichi' THEN 'Chubu'
    
    -- Kansai Region
    WHEN 'mie' THEN 'Kansai'
    WHEN 'shiga' THEN 'Kansai'
    WHEN 'kyoto' THEN 'Kansai'
    WHEN 'osaka' THEN 'Kansai'
    WHEN 'hyogo' THEN 'Kansai'
    WHEN 'nara' THEN 'Kansai'
    WHEN 'wakayama' THEN 'Kansai'
    
    -- Chugoku Region
    WHEN 'tottori' THEN 'Chugoku'
    WHEN 'shimane' THEN 'Chugoku'
    WHEN 'okayama' THEN 'Chugoku'
    WHEN 'hiroshima' THEN 'Chugoku'
    WHEN 'yamaguchi' THEN 'Chugoku'
    
    -- Shikoku Region
    WHEN 'tokushima' THEN 'Shikoku'
    WHEN 'kagawa' THEN 'Shikoku'
    WHEN 'ehime' THEN 'Shikoku'
    WHEN 'kochi' THEN 'Shikoku'
    
    -- Kyushu Region
    WHEN 'fukuoka' THEN 'Kyushu'
    WHEN 'saga' THEN 'Kyushu'
    WHEN 'nagasaki' THEN 'Kyushu'
    WHEN 'kumamoto' THEN 'Kyushu'
    WHEN 'oita' THEN 'Kyushu'
    WHEN 'miyazaki' THEN 'Kyushu'
    WHEN 'kagoshima' THEN 'Kyushu'
    WHEN 'okinawa' THEN 'Kyushu'
    
    ELSE NULL
  END;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Extract postal code from address
CREATE OR REPLACE FUNCTION extract_postal_code(address_text TEXT)
RETURNS TEXT AS $$
DECLARE
  postal_code TEXT;
BEGIN
  IF address_text IS NULL OR address_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- Extract postal code pattern: XXX-XXXX or XXXXXXX
  postal_code := regexp_replace(address_text, '.*([0-9]{3}-?[0-9]{4}).*', '\1');
  
  -- If no match, try to find standalone postal code
  IF postal_code IS NULL OR postal_code = '' OR postal_code = address_text THEN
    -- Check if entire address is a postal code
    IF address_text ~ '^[0-9]{3}-?[0-9]{4}$' THEN
      RETURN address_text;
    END IF;
    RETURN NULL;
  END IF;
  
  RETURN postal_code;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Comprehensive geographic data analysis
WITH shop_geo AS (
  SELECT 
    s.id,
    s.name,
    s.address,
    s.prefecture,
    s.normalized_city,
    extract_postal_code(s.address) AS postal_code,
    get_region_from_prefecture(s.prefecture) AS region,
    CASE 
      WHEN extract_postal_code(s.address) IS NOT NULL THEN 1 ELSE 0 
    END AS has_postal_code,
    CASE 
      WHEN s.normalized_city IS NOT NULL AND s.normalized_city != '' THEN 1 ELSE 0 
    END AS has_normalized_city,
    CASE 
      WHEN s.prefecture IS NOT NULL AND s.prefecture != '' THEN 1 ELSE 0 
    END AS has_prefecture,
    CASE 
      WHEN get_region_from_prefecture(s.prefecture) IS NOT NULL THEN 1 ELSE 0 
    END AS has_region
  FROM shops s
  WHERE s.address IS NOT NULL
    AND s.address != ''
)
SELECT 
  'COMPLETE GEOGRAPHIC DATA SUMMARY' AS report_type,
  COUNT(*) AS total_shops,
  SUM(has_postal_code) AS shops_with_postal_code,
  SUM(has_normalized_city) AS shops_with_normalized_city,
  SUM(has_prefecture) AS shops_with_prefecture,
  SUM(has_region) AS shops_with_region,
  SUM(
    CASE 
      WHEN has_postal_code = 1 
        AND has_normalized_city = 1 
        AND has_prefecture = 1 
        AND has_region = 1 
      THEN 1 
      ELSE 0 
    END
  ) AS shops_with_all_data,
  ROUND(
    SUM(
      CASE 
        WHEN has_postal_code = 1 
          AND has_normalized_city = 1 
          AND has_prefecture = 1 
          AND has_region = 1 
        THEN 1 
        ELSE 0 
      END
    )::numeric / COUNT(*)::numeric * 100, 
    2
  ) AS percentage_complete
FROM shop_geo;

-- Step 4: Breakdown by prefecture
WITH shop_geo AS (
  SELECT 
    s.id,
    s.prefecture,
    s.normalized_city,
    extract_postal_code(s.address) AS postal_code,
    get_region_from_prefecture(s.prefecture) AS region,
    CASE 
      WHEN extract_postal_code(s.address) IS NOT NULL THEN 1 ELSE 0 
    END AS has_postal_code,
    CASE 
      WHEN s.normalized_city IS NOT NULL AND s.normalized_city != '' THEN 1 ELSE 0 
    END AS has_normalized_city,
    CASE 
      WHEN s.prefecture IS NOT NULL AND s.prefecture != '' THEN 1 ELSE 0 
    END AS has_prefecture,
    CASE 
      WHEN get_region_from_prefecture(s.prefecture) IS NOT NULL THEN 1 ELSE 0 
    END AS has_region
  FROM shops s
  WHERE s.address IS NOT NULL
    AND s.address != ''
)
SELECT 
  'BY PREFECTURE' AS report_type,
  prefecture,
  COUNT(*) AS total_shops,
  SUM(has_postal_code) AS with_postal_code,
  SUM(has_normalized_city) AS with_normalized_city,
  SUM(has_prefecture) AS with_prefecture,
  SUM(has_region) AS with_region,
  SUM(
    CASE 
      WHEN has_postal_code = 1 
        AND has_normalized_city = 1 
        AND has_prefecture = 1 
        AND has_region = 1 
      THEN 1 
      ELSE 0 
    END
  ) AS with_all_data,
  ROUND(
    SUM(
      CASE 
        WHEN has_postal_code = 1 
          AND has_normalized_city = 1 
          AND has_prefecture = 1 
          AND has_region = 1 
        THEN 1 
        ELSE 0 
      END
    )::numeric / COUNT(*)::numeric * 100, 
    2
  ) AS percentage_complete
FROM shop_geo
WHERE prefecture IS NOT NULL
GROUP BY prefecture
ORDER BY total_shops DESC;

-- Step 5: Breakdown by region
WITH shop_geo AS (
  SELECT 
    s.id,
    s.prefecture,
    s.normalized_city,
    extract_postal_code(s.address) AS postal_code,
    get_region_from_prefecture(s.prefecture) AS region,
    CASE 
      WHEN extract_postal_code(s.address) IS NOT NULL THEN 1 ELSE 0 
    END AS has_postal_code,
    CASE 
      WHEN s.normalized_city IS NOT NULL AND s.normalized_city != '' THEN 1 ELSE 0 
    END AS has_normalized_city,
    CASE 
      WHEN s.prefecture IS NOT NULL AND s.prefecture != '' THEN 1 ELSE 0 
    END AS has_prefecture,
    CASE 
      WHEN get_region_from_prefecture(s.prefecture) IS NOT NULL THEN 1 ELSE 0 
    END AS has_region
  FROM shops s
  WHERE s.address IS NOT NULL
    AND s.address != ''
)
SELECT 
  'BY REGION' AS report_type,
  region,
  COUNT(*) AS total_shops,
  SUM(has_postal_code) AS with_postal_code,
  SUM(has_normalized_city) AS with_normalized_city,
  SUM(has_prefecture) AS with_prefecture,
  SUM(has_region) AS with_region,
  SUM(
    CASE 
      WHEN has_postal_code = 1 
        AND has_normalized_city = 1 
        AND has_prefecture = 1 
        AND has_region = 1 
      THEN 1 
      ELSE 0 
    END
  ) AS with_all_data,
  ROUND(
    SUM(
      CASE 
        WHEN has_postal_code = 1 
          AND has_normalized_city = 1 
          AND has_prefecture = 1 
          AND has_region = 1 
        THEN 1 
        ELSE 0 
      END
    )::numeric / COUNT(*)::numeric * 100, 
    2
  ) AS percentage_complete
FROM shop_geo
WHERE region IS NOT NULL
GROUP BY region
ORDER BY total_shops DESC;

-- Step 6: Missing data breakdown
WITH shop_geo AS (
  SELECT 
    s.id,
    s.name,
    s.address,
    s.prefecture,
    s.normalized_city,
    extract_postal_code(s.address) AS postal_code,
    get_region_from_prefecture(s.prefecture) AS region,
    CASE 
      WHEN extract_postal_code(s.address) IS NOT NULL THEN 1 ELSE 0 
    END AS has_postal_code,
    CASE 
      WHEN s.normalized_city IS NOT NULL AND s.normalized_city != '' THEN 1 ELSE 0 
    END AS has_normalized_city,
    CASE 
      WHEN s.prefecture IS NOT NULL AND s.prefecture != '' THEN 1 ELSE 0 
    END AS has_prefecture,
    CASE 
      WHEN get_region_from_prefecture(s.prefecture) IS NOT NULL THEN 1 ELSE 0 
    END AS has_region
  FROM shops s
  WHERE s.address IS NOT NULL
    AND s.address != ''
)
SELECT 
  'MISSING DATA BREAKDOWN' AS report_type,
  'Missing Postal Code' AS missing_field,
  COUNT(*) AS count
FROM shop_geo
WHERE has_postal_code = 0

UNION ALL

SELECT 
  'MISSING DATA BREAKDOWN' AS report_type,
  'Missing normalized_city' AS missing_field,
  COUNT(*) AS count
FROM shop_geo
WHERE has_normalized_city = 0

UNION ALL

SELECT 
  'MISSING DATA BREAKDOWN' AS report_type,
  'Missing prefecture' AS missing_field,
  COUNT(*) AS count
FROM shop_geo
WHERE has_prefecture = 0

UNION ALL

SELECT 
  'MISSING DATA BREAKDOWN' AS report_type,
  'Missing region' AS missing_field,
  COUNT(*) AS count
FROM shop_geo
WHERE has_region = 0

UNION ALL

SELECT 
  'MISSING DATA BREAKDOWN' AS report_type,
  'Missing postal_code AND normalized_city' AS missing_field,
  COUNT(*) AS count
FROM shop_geo
WHERE has_postal_code = 0 AND has_normalized_city = 0

UNION ALL

SELECT 
  'MISSING DATA BREAKDOWN' AS report_type,
  'Complete (all fields present)' AS missing_field,
  COUNT(*) AS count
FROM shop_geo
WHERE has_postal_code = 1 
  AND has_normalized_city = 1 
  AND has_prefecture = 1 
  AND has_region = 1;

-- Step 7: Sample shops with complete data
WITH shop_geo AS (
  SELECT 
    s.id,
    s.name,
    s.address,
    s.prefecture,
    s.normalized_city,
    extract_postal_code(s.address) AS postal_code,
    get_region_from_prefecture(s.prefecture) AS region
  FROM shops s
  WHERE s.address IS NOT NULL
    AND s.address != ''
    AND extract_postal_code(s.address) IS NOT NULL
    AND s.normalized_city IS NOT NULL
    AND s.prefecture IS NOT NULL
    AND get_region_from_prefecture(s.prefecture) IS NOT NULL
)
SELECT 
  'SAMPLE COMPLETE SHOPS' AS report_type,
  id,
  name,
  address,
  postal_code,
  normalized_city,
  prefecture,
  region
FROM shop_geo
ORDER BY prefecture, normalized_city
LIMIT 50;

-- Step 8: Sample shops missing normalized_city (but have postal code)
WITH shop_geo AS (
  SELECT 
    s.id,
    s.name,
    s.address,
    s.prefecture,
    s.normalized_city,
    extract_postal_code(s.address) AS postal_code,
    get_region_from_prefecture(s.prefecture) AS region
  FROM shops s
  WHERE s.address IS NOT NULL
    AND s.address != ''
    AND extract_postal_code(s.address) IS NOT NULL
    AND (s.normalized_city IS NULL OR s.normalized_city = '')
    AND s.prefecture IS NOT NULL
)
SELECT 
  'SAMPLE SHOPS WITH POSTAL CODE BUT NO CITY' AS report_type,
  id,
  name,
  address,
  postal_code,
  prefecture,
  region,
  'Has postal code but normalized_city is NULL' AS issue
FROM shop_geo
ORDER BY prefecture, postal_code
LIMIT 50;

-- Step 9: Shops with just numbers (cannot extract)
SELECT 
  'SHOPS WITH JUST NUMBERS (CANNOT EXTRACT)' AS report_type,
  COUNT(*) AS total_count,
  COUNT(DISTINCT prefecture) AS affected_prefectures
FROM shops
WHERE address IS NOT NULL
  AND address != ''
  AND address ~ '^[0-9-]+$'  -- Just numbers
  AND (normalized_city IS NULL OR normalized_city = '');

