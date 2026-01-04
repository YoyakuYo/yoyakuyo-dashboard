-- ============================================
-- REMOVE REMAINING SHOPS WITH INCOMPLETE ADDRESSES
-- Removes the final 20 shops with addresses that are just numbers
-- ============================================

-- Step 1: Show shops to be deleted
SELECT 
  'SHOPS TO DELETE' AS report_type,
  id,
  name,
  address,
  prefecture,
  normalized_city,
  'Incomplete address (just numbers)' AS deletion_reason
FROM shops
WHERE 
  address IS NOT NULL
  AND address != ''
  AND address ~ '^[0-9-]+$'
  AND LENGTH(TRIM(address)) <= 20
  AND NOT (address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(address) = 8)
ORDER BY prefecture, name;

-- Step 2: Summary before deletion
SELECT 
  'SUMMARY BEFORE DELETION' AS report_type,
  COUNT(*) AS shop_count,
  COUNT(DISTINCT prefecture) AS affected_prefectures,
  STRING_AGG(DISTINCT prefecture, ', ' ORDER BY prefecture) AS prefectures
FROM shops
WHERE 
  address IS NOT NULL
  AND address != ''
  AND address ~ '^[0-9-]+$'
  AND LENGTH(TRIM(address)) <= 20
  AND NOT (address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(address) = 8);

-- Step 3: Backup remaining shops to be deleted
INSERT INTO shops_deleted_backup
SELECT s.*
FROM shops s
WHERE 
  s.address IS NOT NULL
  AND s.address != ''
  AND s.address ~ '^[0-9-]+$'
  AND LENGTH(TRIM(s.address)) <= 20
  AND NOT (s.address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(s.address) = 8)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Verify backup count
SELECT 
  'BACKUP VERIFICATION' AS report_type,
  COUNT(*) AS shops_backed_up
FROM shops_deleted_backup
WHERE 
  address IS NOT NULL
  AND address != ''
  AND address ~ '^[0-9-]+$'
  AND LENGTH(TRIM(address)) <= 20
  AND NOT (address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(address) = 8);

-- Step 5: DELETE remaining shops with incomplete addresses
DELETE FROM shops
WHERE 
  address IS NOT NULL
  AND address != ''
  AND address ~ '^[0-9-]+$'
  AND LENGTH(TRIM(address)) <= 20
  AND NOT (address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(address) = 8);

-- Step 6: Verification after deletion
SELECT 
  'AFTER DELETION' AS report_type,
  COUNT(*) AS remaining_shops_with_incomplete_addresses
FROM shops
WHERE 
  address IS NOT NULL
  AND address != ''
  AND address ~ '^[0-9-]+$'
  AND LENGTH(TRIM(address)) <= 20
  AND NOT (address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(address) = 8);

-- Step 7: Final shop count
SELECT 
  'FINAL SHOP COUNT' AS report_type,
  COUNT(*) AS total_shops,
  COUNT(DISTINCT prefecture) AS prefectures,
  COUNT(DISTINCT normalized_city) AS cities,
  COUNT(CASE WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN 1 END) AS shops_with_city
FROM shops
WHERE address IS NOT NULL
  AND address != '';

-- Step 8: Breakdown by prefecture (showing which prefectures still have incomplete addresses)
SELECT 
  'REMAINING INCOMPLETE BY PREFECTURE' AS report_type,
  prefecture,
  COUNT(*) AS incomplete_count
FROM shops
WHERE 
  address IS NOT NULL
  AND address != ''
  AND address ~ '^[0-9-]+$'
  AND LENGTH(TRIM(address)) <= 20
  AND NOT (address ~ '^[0-9]{3}-[0-9]{4}$' AND LENGTH(address) = 8)
GROUP BY prefecture
ORDER BY incomplete_count DESC;

