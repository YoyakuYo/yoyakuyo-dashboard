-- Count Verified Shops
SELECT 
  'VERIFIED SHOPS COUNT' AS report_type,
  COUNT(*) AS total_shops,
  COUNT(CASE WHEN is_verified = true THEN 1 END) AS verified_shops,
  COUNT(CASE WHEN is_verified = false OR is_verified IS NULL THEN 1 END) AS unverified_shops,
  ROUND(100.0 * COUNT(CASE WHEN is_verified = true THEN 1 END) / COUNT(*), 2) AS verified_percentage,
  ROUND(100.0 * COUNT(CASE WHEN is_verified = false OR is_verified IS NULL THEN 1 END) / COUNT(*), 2) AS unverified_percentage
FROM shops
WHERE address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status != 'hidden');

