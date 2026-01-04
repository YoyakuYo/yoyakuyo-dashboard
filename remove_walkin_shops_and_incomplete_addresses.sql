-- ============================================
-- REMOVE SHOPS THAT DON'T REQUIRE APPOINTMENTS
-- AND SHOPS WITH INCOMPLETE ADDRESSES (JUST NUMBERS)
-- ============================================

-- Step 1: Create backup table for shops to be deleted (for safety)
CREATE TABLE IF NOT EXISTS shops_deleted_backup (
  LIKE shops INCLUDING ALL
);

-- Step 2: Identify shops to delete
-- Category A: Walk-in restaurants / Fast food / No appointment needed
-- Category B: Shops with addresses that are just numbers

WITH shops_to_delete AS (
  SELECT 
    id,
    name,
    address,
    category_id,
    prefecture,
    normalized_city,
    'Walk-in restaurant / Fast food / No appointment needed' AS deletion_reason
  FROM shops
  WHERE 
    -- Fast food and walk-in restaurants (Japanese and English patterns)
    (
      LOWER(name || ' ' || COALESCE(address, '')) ~ 'fast food|takeout|take.out|drive.through|drive.thru|ファストフード|テイクアウト|食堂|shokudo|ラーメン|ramen|うどん|udon|そば|soba|立ち食い|立ち飲み|立ち喰い|立ち呑み'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ 'コンビニ|コンビニエンスストア|konbini|convenience store|convenience'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ 'スーパーマーケット|スーパーストア|supermarket|grocery store|grocery'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(shop|store|retail|小売|販売店|雑貨店|ドラッグストア|drugstore|pharmacy|薬局)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(hospital|病院|総合病院|大学病院)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(gym|fitness|ジム|フィットネス|スポーツクラブ|sports club|fitness centre|fitness center)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(swimming pool|プール|水泳場|water park|ウォーターパーク)\b'
    )
    -- Exclude beauty/salon shops (they need appointments)
    AND NOT LOWER(name || ' ' || COALESCE(address, '')) ~ '(beauty|salon|hairdresser|nail|ネイル|美容|ヘア|サロン)'
    -- Exclude super sento (they might need appointments)
    AND NOT LOWER(name || ' ' || COALESCE(address, '')) ~ '(スーパー銭湯|super.*sento|super.*sentō)'
    
  UNION ALL
  
  SELECT 
    id,
    name,
    address,
    category_id,
    prefecture,
    normalized_city,
    'Address is just numbers (incomplete address)' AS deletion_reason
  FROM shops
  WHERE 
    -- Address is just numbers (with or without hyphens)
    address IS NOT NULL
    AND address != ''
    AND address ~ '^[0-9-]+$'  -- Only numbers and hyphens
    AND LENGTH(TRIM(address)) <= 20  -- Short addresses (like "1", "14", "13-1", "266-0031")
    -- Exclude valid postal codes (XXX-XXXX format)
    AND NOT (address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(address) = 8)
)
SELECT * FROM shops_to_delete
ORDER BY deletion_reason, prefecture, name;

-- Step 3: Show summary before deletion
SELECT 
  'SUMMARY BEFORE DELETION' AS report_type,
  deletion_reason,
  COUNT(*) AS shop_count,
  COUNT(DISTINCT prefecture) AS affected_prefectures
FROM (
  SELECT 
    id,
    'Walk-in restaurant / Fast food / No appointment needed' AS deletion_reason
  FROM shops
  WHERE 
    (
      LOWER(name || ' ' || COALESCE(address, '')) ~ 'fast food|takeout|take.out|drive.through|drive.thru|ファストフード|テイクアウト|食堂|shokudo|ラーメン|ramen|うどん|udon|そば|soba|立ち食い|立ち飲み|立ち喰い|立ち呑み'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ 'コンビニ|コンビニエンスストア|konbini|convenience store|convenience'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ 'スーパーマーケット|スーパーストア|supermarket|grocery store|grocery'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(shop|store|retail|小売|販売店|雑貨店|ドラッグストア|drugstore|pharmacy|薬局)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(hospital|病院|総合病院|大学病院)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(gym|fitness|ジム|フィットネス|スポーツクラブ|sports club|fitness centre|fitness center)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(swimming pool|プール|水泳場|water park|ウォーターパーク)\b'
    )
    AND NOT LOWER(name || ' ' || COALESCE(address, '')) ~ '(beauty|salon|hairdresser|nail|ネイル|美容|ヘア|サロン)'
    AND NOT LOWER(name || ' ' || COALESCE(address, '')) ~ '(スーパー銭湯|super.*sento|super.*sentō)'
    
  UNION ALL
  
  SELECT 
    id,
    'Address is just numbers (incomplete address)' AS deletion_reason
  FROM shops
  WHERE 
    address IS NOT NULL
    AND address != ''
    AND address ~ '^[0-9-]+$'
    AND LENGTH(TRIM(address)) <= 20
    AND NOT (address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(address) = 8)
) AS combined
GROUP BY deletion_reason;

-- Step 4: Backup shops to be deleted
INSERT INTO shops_deleted_backup
SELECT s.*
FROM shops s
WHERE s.id IN (
  -- Walk-in restaurants
  SELECT id FROM shops
  WHERE 
    (
      LOWER(name || ' ' || COALESCE(address, '')) ~ 'fast food|takeout|take.out|drive.through|drive.thru|ファストフード|テイクアウト|食堂|shokudo|ラーメン|ramen|うどん|udon|そば|soba|立ち食い|立ち飲み|立ち喰い|立ち呑み'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ 'コンビニ|コンビニエンスストア|konbini|convenience store|convenience'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ 'スーパーマーケット|スーパーストア|supermarket|grocery store|grocery'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(shop|store|retail|小売|販売店|雑貨店|ドラッグストア|drugstore|pharmacy|薬局)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(hospital|病院|総合病院|大学病院)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(gym|fitness|ジム|フィットネス|スポーツクラブ|sports club|fitness centre|fitness center)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(swimming pool|プール|水泳場|water park|ウォーターパーク)\b'
    )
    AND NOT LOWER(name || ' ' || COALESCE(address, '')) ~ '(beauty|salon|hairdresser|nail|ネイル|美容|ヘア|サロン)'
    AND NOT LOWER(name || ' ' || COALESCE(address, '')) ~ '(スーパー銭湯|super.*sento|super.*sentō)'
    
  UNION
  
  -- Incomplete addresses
  SELECT id FROM shops
  WHERE 
    address IS NOT NULL
    AND address != ''
    AND address ~ '^[0-9-]+$'
    AND LENGTH(TRIM(address)) <= 20
    AND NOT (address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(address) = 8)
)
ON CONFLICT (id) DO NOTHING;

-- Step 5: DELETE shops (COMMENTED OUT FOR SAFETY - UNCOMMENT TO EXECUTE)
-- ⚠️ WARNING: This will permanently delete shops. Make sure you've reviewed the backup first!
/*
DELETE FROM shops
WHERE id IN (
  -- Walk-in restaurants
  SELECT id FROM shops
  WHERE 
    (
      LOWER(name || ' ' || COALESCE(address, '')) ~ 'fast food|takeout|take.out|drive.through|drive.thru|ファストフード|テイクアウト|食堂|shokudo|ラーメン|ramen|うどん|udon|そば|soba|立ち食い|立ち飲み|立ち喰い|立ち呑み'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ 'コンビニ|コンビニエンスストア|konbini|convenience store|convenience'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ 'スーパーマーケット|スーパーストア|supermarket|grocery store|grocery'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(shop|store|retail|小売|販売店|雑貨店|ドラッグストア|drugstore|pharmacy|薬局)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(hospital|病院|総合病院|大学病院)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(gym|fitness|ジム|フィットネス|スポーツクラブ|sports club|fitness centre|fitness center)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(swimming pool|プール|水泳場|water park|ウォーターパーク)\b'
    )
    AND NOT LOWER(name || ' ' || COALESCE(address, '')) ~ '(beauty|salon|hairdresser|nail|ネイル|美容|ヘア|サロン)'
    AND NOT LOWER(name || ' ' || COALESCE(address, '')) ~ '(スーパー銭湯|super.*sento|super.*sentō)'
    
  UNION
  
  -- Incomplete addresses
  SELECT id FROM shops
  WHERE 
    address IS NOT NULL
    AND address != ''
    AND address ~ '^[0-9-]+$'
    AND LENGTH(TRIM(address)) <= 20
    AND NOT (address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(address) = 8)
);
*/

-- Step 6: Verification after deletion (run this after uncommenting DELETE)
/*
SELECT 
  'REMAINING SHOPS AFTER DELETION' AS report_type,
  COUNT(*) AS total_shops,
  COUNT(DISTINCT prefecture) AS prefectures,
  COUNT(DISTINCT normalized_city) AS cities
FROM shops
WHERE address IS NOT NULL
  AND address != '';
*/

-- Step 7: Sample of shops that will be deleted (for review)
SELECT 
  'SAMPLE SHOPS TO BE DELETED' AS report_type,
  id,
  name,
  address,
  prefecture,
  normalized_city,
  CASE 
    WHEN (
      LOWER(name || ' ' || COALESCE(address, '')) ~ 'fast food|takeout|take.out|drive.through|drive.thru|ファストフード|テイクアウト|食堂|shokudo|ラーメン|ramen|うどん|udon|そば|soba|立ち食い|立ち飲み|立ち喰い|立ち呑み'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ 'コンビニ|コンビニエンスストア|konbini|convenience store|convenience'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ 'スーパーマーケット|スーパーストア|supermarket|grocery store|grocery'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(shop|store|retail|小売|販売店|雑貨店|ドラッグストア|drugstore|pharmacy|薬局)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(hospital|病院|総合病院|大学病院)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(gym|fitness|ジム|フィットネス|スポーツクラブ|sports club|fitness centre|fitness center)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(swimming pool|プール|水泳場|water park|ウォーターパーク)\b'
    ) AND NOT LOWER(name || ' ' || COALESCE(address, '')) ~ '(beauty|salon|hairdresser|nail|ネイル|美容|ヘア|サロン)'
      AND NOT LOWER(name || ' ' || COALESCE(address, '')) ~ '(スーパー銭湯|super.*sento|super.*sentō)'
    THEN 'Walk-in restaurant / Fast food'
    WHEN address IS NOT NULL
      AND address != ''
      AND address ~ '^[0-9-]+$'
      AND LENGTH(TRIM(address)) <= 20
      AND NOT (address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(address) = 8)
    THEN 'Incomplete address (just numbers)'
    ELSE 'Other'
  END AS deletion_reason
FROM shops
WHERE 
  (
    -- Walk-in restaurants
    (
      LOWER(name || ' ' || COALESCE(address, '')) ~ 'fast food|takeout|take.out|drive.through|drive.thru|ファストフード|テイクアウト|食堂|shokudo|ラーメン|ramen|うどん|udon|そば|soba|立ち食い|立ち飲み|立ち喰い|立ち呑み'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ 'コンビニ|コンビニエンスストア|konbini|convenience store|convenience'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ 'スーパーマーケット|スーパーストア|supermarket|grocery store|grocery'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(shop|store|retail|小売|販売店|雑貨店|ドラッグストア|drugstore|pharmacy|薬局)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(hospital|病院|総合病院|大学病院)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(gym|fitness|ジム|フィットネス|スポーツクラブ|sports club|fitness centre|fitness center)\b'
      OR LOWER(name || ' ' || COALESCE(address, '')) ~ '\b(swimming pool|プール|水泳場|water park|ウォーターパーク)\b'
    )
    AND NOT LOWER(name || ' ' || COALESCE(address, '')) ~ '(beauty|salon|hairdresser|nail|ネイル|美容|ヘア|サロン)'
    AND NOT LOWER(name || ' ' || COALESCE(address, '')) ~ '(スーパー銭湯|super.*sento|super.*sentō)'
  )
  OR 
  (
    -- Incomplete addresses
    address IS NOT NULL
    AND address != ''
    AND address ~ '^[0-9-]+$'
    AND LENGTH(TRIM(address)) <= 20
    AND NOT (address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(address) = 8)
  )
ORDER BY deletion_reason, prefecture, name
LIMIT 100;

