-- ============================================
-- ADVANCED: POPULATE normalized_city FOR ALL SHOPS
-- Uses cities table to match city names in addresses
-- Handles incomplete addresses, postal codes, and road names
-- ============================================

-- Step 1: Create advanced function that uses cities table for matching
CREATE OR REPLACE FUNCTION extract_city_from_address_advanced(address_text TEXT, shop_prefecture TEXT)
RETURNS TEXT AS $$
DECLARE
  city_name TEXT;
  address_lower TEXT;
  matched_city RECORD;
BEGIN
  IF address_text IS NULL OR address_text = '' THEN
    RETURN NULL;
  END IF;

  address_lower := LOWER(address_text);

  -- First, try to find city from cities table that matches the address
  -- This handles cases like "松戸", "津田沼", "千葉" without suffixes
  IF shop_prefecture IS NOT NULL AND shop_prefecture != '' THEN
    -- Get prefecture name from prefecture key
    DECLARE
      pref_name TEXT;
    BEGIN
      pref_name := CASE shop_prefecture
        WHEN 'hokkaido' THEN 'Hokkaido'
        WHEN 'tokyo' THEN 'Tokyo'
        WHEN 'osaka' THEN 'Osaka'
        WHEN 'kyoto' THEN 'Kyoto'
        WHEN 'chiba' THEN 'Chiba'
        WHEN 'kanagawa' THEN 'Kanagawa'
        WHEN 'saitama' THEN 'Saitama'
        WHEN 'hyogo' THEN 'Hyogo'
        WHEN 'fukuoka' THEN 'Fukuoka'
        WHEN 'gunma' THEN 'Gunma'
        WHEN 'ibaraki' THEN 'Ibaraki'
        WHEN 'tochigi' THEN 'Tochigi'
        WHEN 'shiga' THEN 'Shiga'
        ELSE NULL
      END;
      
      -- Try to match city names from cities table in the address
      FOR matched_city IN 
        SELECT name, slug 
        FROM cities 
        WHERE prefecture_name = pref_name
          AND (address_text LIKE '%' || name || '%' OR address_lower LIKE '%' || LOWER(slug) || '%')
        ORDER BY LENGTH(name) DESC  -- Prefer longer matches
        LIMIT 1
      LOOP
        RETURN matched_city.name;
      END LOOP;
    END;
  END IF;

  -- Pattern 1: Japanese city suffixes (区, 市, 町, 村, 郡)
  -- Match: "渋谷区", "横浜市", "三鷹市", etc.
  SELECT regexp_replace(
    (regexp_match(address_text, '([^都道府県\s,]+[区市町村郡])'))[1],
    '[区市町村郡]', ''
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' AND LENGTH(TRIM(city_name)) > 0 THEN
    RETURN TRIM(city_name);
  END IF;
  
  -- Pattern 2: City name without suffix but with context
  -- Match patterns like "市松戸" (city prefix + name), "松戸" (standalone city name)
  -- Common city names in addresses
  SELECT regexp_replace(
    (regexp_match(address_text, '(市)?([^都道府県\s,線号通]+)(?=[\s,線号通])'))[2],
    '^市', ''
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' 
     AND LENGTH(TRIM(city_name)) > 1 
     AND city_name NOT SIMILAR TO '%[0-9]%'  -- Exclude if it's just numbers
     AND city_name NOT SIMILAR TO '%国道%'  -- Exclude road names
     AND city_name NOT SIMILAR TO '%号%' THEN
    RETURN TRIM(city_name);
  END IF;
  
  -- Pattern 3: Romanized format with suffixes
  SELECT regexp_replace(
    (regexp_match(address_lower, '([a-z]+)[-\s](ku|shi|cho|son|city|ward)', 'i'))[1],
    '[-\s]', '', 'g'
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' AND LENGTH(TRIM(city_name)) > 2 THEN
    RETURN UPPER(SUBSTRING(TRIM(city_name), 1, 1)) || SUBSTRING(TRIM(city_name), 2);
  END IF;
  
  -- Pattern 4: Extract word before prefecture name
  IF address_text ~* '(tokyo|osaka|kyoto|yokohama|nagoya|sapporo|fukuoka|kobe|kawasaki|sendai)' THEN
    SELECT regexp_replace(
      (regexp_match(address_text, '([^,\s]+)[,\s]+(tokyo|osaka|kyoto|yokohama|nagoya|sapporo|fukuoka|kobe|kawasaki|sendai)', 'i'))[1],
      '[,\s]+', '', 'g'
    ) INTO city_name;
    
    IF city_name IS NOT NULL AND city_name != '' AND LENGTH(TRIM(city_name)) > 2 THEN
      RETURN TRIM(city_name);
    END IF;
  END IF;
  
  -- Pattern 5: Common city names that appear without suffixes
  -- Check for known city names in the address
  IF address_text LIKE '%松戸%' OR address_text LIKE '%Matsudo%' THEN
    RETURN '松戸';
  END IF;
  
  IF address_text LIKE '%津田沼%' OR address_text LIKE '%Tsudanuma%' THEN
    RETURN '津田沼';
  END IF;
  
  IF address_text LIKE '%千葉%' OR address_text LIKE '%Chiba%' THEN
    RETURN '千葉';
  END IF;
  
  IF address_text LIKE '%新宿%' OR address_text LIKE '%Shinjuku%' THEN
    RETURN '新宿';
  END IF;
  
  IF address_text LIKE '%渋谷%' OR address_text LIKE '%Shibuya%' THEN
    RETURN '渋谷';
  END IF;
  
  IF address_text LIKE '%難波%' OR address_text LIKE '%Namba%' THEN
    RETURN '難波';
  END IF;
  
  IF address_text LIKE '%日本橋%' OR address_text LIKE '%Nihonbashi%' THEN
    RETURN '日本橋';
  END IF;
  
  IF address_text LIKE '%築地%' OR address_text LIKE '%Tsukiji%' THEN
    RETURN '築地';
  END IF;
  
  IF address_text LIKE '%神田%' OR address_text LIKE '%Kanda%' THEN
    RETURN '神田';
  END IF;
  
  -- Pattern 6: Extract meaningful word (3+ characters) before common separators
  SELECT regexp_replace(
    (regexp_match(address_text, '([A-Za-z]{3,})[,\s]'))[1],
    '[,\s]', '', 'g'
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' AND LENGTH(TRIM(city_name)) >= 3 THEN
    RETURN TRIM(city_name);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Update all shops with missing normalized_city using advanced function
UPDATE shops
SET normalized_city = extract_city_from_address_advanced(address, prefecture)
WHERE (normalized_city IS NULL OR normalized_city = '')
  AND address IS NOT NULL
  AND address != '';

-- Step 3: Verification - Check results
SELECT 
  'After Advanced Update' AS status,
  COUNT(*) AS total_shops,
  COUNT(normalized_city) AS shops_with_normalized_city,
  COUNT(*) - COUNT(normalized_city) AS shops_still_missing_city,
  ROUND(COUNT(normalized_city)::numeric / COUNT(*)::numeric * 100, 2) AS percentage_populated
FROM shops
WHERE address IS NOT NULL
  AND address != '';

-- Step 4: Show distribution of extracted cities
SELECT 
  normalized_city,
  prefecture,
  COUNT(*) AS shop_count
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND prefecture IS NOT NULL
GROUP BY normalized_city, prefecture
ORDER BY shop_count DESC
LIMIT 50;

-- Step 5: Sample of successfully extracted cities (including the problematic ones)
SELECT 
  name,
  address,
  prefecture,
  normalized_city
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND prefecture IN ('chiba', 'tokyo', 'osaka', 'kyoto', 'hyogo')
ORDER BY prefecture, normalized_city
LIMIT 50;

-- Step 6: Shops that still need manual review (addresses that are too incomplete)
SELECT 
  id,
  name,
  address,
  prefecture,
  normalized_city,
  CASE 
    WHEN address ~ '^[0-9-]+$' THEN 'Postal code only'
    WHEN address ~ '^[0-9]+$' THEN 'Number only'
    WHEN address ~ '国道|線|通り|バイパス' THEN 'Road name only'
    ELSE 'Other incomplete format'
  END AS address_type
FROM shops
WHERE (normalized_city IS NULL OR normalized_city = '')
  AND address IS NOT NULL
  AND address != ''
  AND prefecture IS NOT NULL
ORDER BY prefecture
LIMIT 100;

