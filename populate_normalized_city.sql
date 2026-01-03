-- ============================================
-- POPULATE normalized_city FOR ALL SHOPS
-- This script extracts city from address and populates normalized_city
-- ============================================

-- Step 1: Create a function to extract city from address
CREATE OR REPLACE FUNCTION extract_city_from_address(address_text TEXT)
RETURNS TEXT AS $$
DECLARE
  city_name TEXT;
BEGIN
  IF address_text IS NULL OR address_text = '' THEN
    RETURN NULL;
  END IF;

  -- Try to extract city patterns:
  -- Pattern 1: "X区", "X市", "X町", "X村" (Japanese format)
  -- Pattern 2: "X-ku", "X-shi", "X-cho", "X-son" (Romanized format)
  -- Pattern 3: "X ku", "X shi", "X city", "X ward" (English format)
  
  -- Pattern 1: Japanese city suffixes (区, 市, 町, 村)
  SELECT regexp_replace(
    regexp_match(address_text, '([^\s,]+)[区市町村]')::TEXT,
    '[{}"]', '', 'g'
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' THEN
    RETURN TRIM(city_name);
  END IF;
  
  -- Pattern 2: Romanized format (X-ku, X-shi, etc.)
  SELECT regexp_replace(
    regexp_match(address_text, '([^\s,]+)[-\s](ku|shi|cho|son|city|ward)', 'i')::TEXT,
    '[{}"]', '', 'g'
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' THEN
    RETURN TRIM(city_name);
  END IF;
  
  -- Pattern 3: Try to get meaningful word before common separators
  -- Look for patterns like "Shibuya, Tokyo" or "Shibuya Tokyo"
  SELECT regexp_replace(
    regexp_match(address_text, '([A-Za-z]+)[,\s]+[A-Za-z]+')::TEXT,
    '[{}",]', '', 'g'
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' AND LENGTH(city_name) > 2 THEN
    RETURN TRIM(city_name);
  END IF;
  
  -- Fallback: Get first meaningful word (skip numbers, single chars)
  SELECT regexp_replace(
    regexp_match(address_text, '([A-Za-z]{3,})')::TEXT,
    '[{}"]', '', 'g'
  ) INTO city_name;
  
  IF city_name IS NOT NULL AND city_name != '' THEN
    RETURN TRIM(city_name);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Update all shops with missing normalized_city
UPDATE shops
SET normalized_city = extract_city_from_address(address)
WHERE (normalized_city IS NULL OR normalized_city = '')
  AND address IS NOT NULL
  AND address != '';

-- Step 3: Verification - Check how many were updated
SELECT 
  'After Update' AS status,
  COUNT(*) AS total_shops,
  COUNT(normalized_city) AS shops_with_normalized_city,
  COUNT(*) - COUNT(normalized_city) AS shops_still_missing_city,
  ROUND(COUNT(normalized_city)::numeric / COUNT(*)::numeric * 100, 2) AS percentage_populated
FROM shops
WHERE address IS NOT NULL
  AND address != '';

-- Step 4: Show sample of populated cities
SELECT 
  normalized_city,
  prefecture,
  COUNT(*) AS shop_count
FROM shops
WHERE normalized_city IS NOT NULL
  AND normalized_city != ''
  AND address IS NOT NULL
GROUP BY normalized_city, prefecture
ORDER BY shop_count DESC
LIMIT 30;

-- Step 5: Show shops that still couldn't be extracted (for manual review)
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
LIMIT 50;

