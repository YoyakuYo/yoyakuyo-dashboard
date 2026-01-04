-- ============================================
-- FULL LIST OF SHOPS IN CHOFU (調布)
-- Run this query to see all 669 shops
-- ============================================

SELECT 
  id,
  name,
  address,
  prefecture,
  normalized_city,
  is_verified,
  created_at
FROM shops
WHERE 
  -- Match Chofu in various formats
  (
    normalized_city ILIKE '%調布%'
    OR normalized_city ILIKE '%chofu%'
    OR normalized_city ILIKE '%Chofu%'
    OR address ILIKE '%調布%'
    OR address ILIKE '%chofu%'
    OR address ILIKE '%Chofu%'
  )
  AND prefecture = 'tokyo'
ORDER BY 
  normalized_city,
  name;

-- ============================================
-- SUMMARY (Run separately if needed)
-- ============================================
-- SELECT 
--   'CHOFU SUMMARY' AS report_type,
--   COUNT(*) AS total_shops,
--   COUNT(CASE WHEN is_verified = true THEN 1 END) AS verified_shops,
--   COUNT(CASE WHEN is_verified = false OR is_verified IS NULL THEN 1 END) AS unverified_shops
-- FROM shops
-- WHERE 
--   (
--     normalized_city ILIKE '%調布%'
--     OR normalized_city ILIKE '%chofu%'
--     OR normalized_city ILIKE '%Chofu%'
--     OR address ILIKE '%調布%'
--     OR address ILIKE '%chofu%'
--     OR address ILIKE '%Chofu%'
--   )
--   AND prefecture = 'tokyo';

