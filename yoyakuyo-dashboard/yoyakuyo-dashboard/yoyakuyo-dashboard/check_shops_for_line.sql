-- Diagnostic query to check shops for LINE app
-- Run this in Supabase SQL Editor to see what shops are available

-- 1. Check total shops count
SELECT 
  COUNT(*) as total_shops,
  COUNT(CASE WHEN address IS NOT NULL AND address != '' THEN 1 END) as shops_with_address,
  COUNT(CASE WHEN claim_status = 'approved' THEN 1 END) as shops_approved,
  COUNT(CASE WHEN claim_status IS NULL THEN 1 END) as shops_null_claim_status,
  COUNT(CASE WHEN claim_status != 'hidden' THEN 1 END) as shops_not_hidden
FROM shops;

-- 2. Check claim_status distribution
SELECT 
  COALESCE(claim_status, 'NULL') as claim_status,
  COUNT(*) as count
FROM shops
GROUP BY claim_status
ORDER BY count DESC;

-- 3. Check shops that should appear in LINE app (based on our query logic)
SELECT 
  id,
  name,
  address,
  claim_status,
  owner_user_id,
  category_id
FROM shops
WHERE 
  address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status = 'approved' OR claim_status != 'hidden')
LIMIT 20;

-- 4. Check if shops have categories assigned
SELECT 
  COUNT(*) as shops_with_category,
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) as shops_without_category
FROM shops
WHERE 
  address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status = 'approved' OR claim_status != 'hidden');

-- 5. Sample shops by category
SELECT 
  c.name as category_name,
  COUNT(s.id) as shop_count
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
WHERE 
  s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status != 'hidden')
GROUP BY c.name
ORDER BY shop_count DESC
LIMIT 10;

