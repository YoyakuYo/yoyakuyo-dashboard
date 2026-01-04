-- ============================================
-- EXECUTE SHOP CLEANUP
-- Removes walk-in shops and shops with incomplete addresses
-- ============================================

-- Step 1: Show final summary before deletion
SELECT 
  'FINAL SUMMARY BEFORE DELETION' AS report_type,
  'Walk-in restaurants / Fast food' AS category,
  COUNT(*) AS shop_count
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
  'FINAL SUMMARY BEFORE DELETION' AS report_type,
  'Incomplete addresses (just numbers)' AS category,
  COUNT(*) AS shop_count
FROM shops
WHERE 
  address IS NOT NULL
  AND address != ''
  AND address ~ '^[0-9-]+$'
  AND LENGTH(TRIM(address)) <= 20
  AND NOT (address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(address) = 8)

UNION ALL

SELECT 
  'FINAL SUMMARY BEFORE DELETION' AS report_type,
  'TOTAL TO DELETE' AS category,
  COUNT(*) AS shop_count
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
  );

-- Step 2: Ensure backup table exists
CREATE TABLE IF NOT EXISTS shops_deleted_backup (
  LIKE shops INCLUDING ALL
);

-- Step 3: Backup shops to be deleted
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

-- Step 4: Verify backup count
SELECT 
  'BACKUP VERIFICATION' AS report_type,
  COUNT(*) AS shops_backed_up
FROM shops_deleted_backup;

-- Step 5: DELETE shops
-- ⚠️ WARNING: This will permanently delete shops from the main table
-- The shops are already backed up in shops_deleted_backup
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

-- Step 6: Verification after deletion
SELECT 
  'AFTER DELETION' AS report_type,
  COUNT(*) AS remaining_shops,
  COUNT(DISTINCT prefecture) AS remaining_prefectures,
  COUNT(DISTINCT normalized_city) AS remaining_cities
FROM shops
WHERE address IS NOT NULL
  AND address != '';

-- Step 7: Show breakdown of deleted shops by prefecture
SELECT 
  'DELETED SHOPS BY PREFECTURE' AS report_type,
  prefecture,
  COUNT(*) AS deleted_count
FROM shops_deleted_backup
GROUP BY prefecture
ORDER BY deleted_count DESC;

