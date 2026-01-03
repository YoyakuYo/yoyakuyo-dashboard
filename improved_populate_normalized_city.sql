-- ============================================
-- IMPROVED: POPULATE normalized_city FOR ALL SHOPS
-- Better extraction logic based on Japanese address patterns
-- ============================================

-- Step 1: Create improved function to extract city from address
CREATE OR REPLACE FUNCTION extract_city_from_address_improved(address_text TEXT)
RETURNS TEXT AS $$
DECLARE
  city_name TEXT;
  address_lower TEXT;
BEGIN
  IF address_text IS NULL OR address_text = '' THEN
    RETURN NULL;
  END IF;

  address_lower := LOWER(address_text);

  -- Pattern 1: Japanese city suffixes (区, 市, 町, 村, 郡)
  -- Match: "渋谷区", "横浜市", "三鷹市", etc.
  SELECT regexp_replace(
    (regexp_match(address_text, '([^都道府県\s,]+[区市町村郡])'))[1],
    '[区市町村郡]', ''
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' AND LENGTH(TRIM(city_name)) > 0 THEN
    RETURN TRIM(city_name);
  END IF;
  
  -- Pattern 2: Romanized format with suffixes
  -- Match: "Shibuya-ku", "Yokohama-shi", "Mitaka City", etc.
  SELECT regexp_replace(
    (regexp_match(address_lower, '([a-z]+)[-\s](ku|shi|cho|son|city|ward)', 'i'))[1],
    '[-\s]', '', 'g'
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' AND LENGTH(TRIM(city_name)) > 2 THEN
    -- Capitalize first letter
    RETURN UPPER(SUBSTRING(TRIM(city_name), 1, 1)) || SUBSTRING(TRIM(city_name), 2);
  END IF;
  
  -- Pattern 3: Extract word before prefecture name
  -- Match patterns like "Shibuya, Tokyo" or "渋谷 東京"
  -- Common prefecture patterns to split on
  IF address_text ~* '(tokyo|osaka|kyoto|yokohama|nagoya|sapporo|fukuoka|kobe|kawasaki|sendai)' THEN
    SELECT regexp_replace(
      (regexp_match(address_text, '([^,\s]+)[,\s]+(tokyo|osaka|kyoto|yokohama|nagoya|sapporo|fukuoka|kobe|kawasaki|sendai)', 'i'))[1],
      '[,\s]+', '', 'g'
    ) INTO city_name;
    
    IF city_name IS NOT NULL AND city_name != '' AND LENGTH(TRIM(city_name)) > 2 THEN
      RETURN TRIM(city_name);
    END IF;
  END IF;
  
  -- Pattern 4: Extract from common Japanese address format
  -- Format: "X区Y丁目" or "X市Y" - extract X
  SELECT regexp_replace(
    (regexp_match(address_text, '([^都道府県\s,]+)[区市][^区市]*'))[1],
    '[区市].*', ''
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' AND LENGTH(TRIM(city_name)) > 0 THEN
    RETURN TRIM(city_name);
  END IF;
  
  -- Pattern 5: Try to extract meaningful word (3+ characters) before common separators
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

-- Step 2: Update all shops with missing normalized_city using improved function
UPDATE shops
SET normalized_city = extract_city_from_address_improved(address)
WHERE (normalized_city IS NULL OR normalized_city = '')
  AND address IS NOT NULL
  AND address != '';

-- Step 3: Verification - Check results
SELECT 
  'After Improved Update' AS status,
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

-- Step 5: Sample of successfully extracted cities
SELECT 
  name,
  address,
  prefecture,
  normalized_city
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND prefecture = 'tokyo'
ORDER BY normalized_city
LIMIT 20;

-- Step 6: Shops that still need manual review
SELECT 
  id,
  name,
  address,
  prefecture,
  normalized_city
FROM shops
WHERE (normalized_city IS NULL OR normalized_city = '')
  AND address IS NOT NULL
  AND address != ''
  AND prefecture IS NOT NULL
ORDER BY prefecture
LIMIT 100;

