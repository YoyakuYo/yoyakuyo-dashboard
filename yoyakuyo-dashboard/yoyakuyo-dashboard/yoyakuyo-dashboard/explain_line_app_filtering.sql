-- ============================================================================
-- EXPLAIN LINE APP FILTERING
-- ============================================================================
-- This query shows why only 35,911 shops are visible in LINE app
-- out of 86,334 total shops
-- ============================================================================

-- 1. Total shops breakdown
SELECT 
  'Total Shops' as metric,
  COUNT(*) as count
FROM shops;

-- 2. Shops WITHOUT addresses (excluded from LINE app)
SELECT 
  'Shops WITHOUT Address' as metric,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2) as percentage
FROM shops
WHERE address IS NULL OR address = '';

-- 3. Shops WITH addresses (potential for LINE app)
SELECT 
  'Shops WITH Address' as metric,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2) as percentage
FROM shops
WHERE address IS NOT NULL AND address != '';

-- 4. Shops by claim_status (shows which are excluded)
SELECT 
  'Shops by Claim Status' as metric,
  COALESCE(claim_status, 'NULL') as claim_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2) as percentage,
  CASE 
    WHEN COALESCE(claim_status, 'NULL') = 'hidden' THEN '❌ EXCLUDED from LINE app'
    WHEN COALESCE(claim_status, 'NULL') IN ('approved', 'unclaimed', 'pending') OR claim_status IS NULL THEN '✅ INCLUDED in LINE app'
    ELSE '⚠️ CHECK'
  END as line_app_status
FROM shops
GROUP BY claim_status
ORDER BY count DESC;

-- 5. Shops excluded from LINE app (no address OR hidden)
SELECT 
  'Shops EXCLUDED from LINE App' as metric,
  COUNT(*) as excluded_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2) as percentage
FROM shops
WHERE 
  address IS NULL 
  OR address = ''
  OR claim_status = 'hidden';

-- 6. Shops INCLUDED in LINE app (with address AND not hidden)
SELECT 
  'Shops INCLUDED in LINE App' as metric,
  COUNT(*) as included_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2) as percentage
FROM shops
WHERE 
  address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status = 'approved' OR claim_status = 'unclaimed' OR claim_status = 'pending')
  AND claim_status != 'hidden';

-- 7. Breakdown: Why shops are excluded
SELECT 
  'Exclusion Reason' as metric,
  CASE 
    WHEN address IS NULL OR address = '' THEN 'No Address'
    WHEN claim_status = 'hidden' THEN 'Hidden Status'
    WHEN address IS NULL OR address = '' AND claim_status = 'hidden' THEN 'No Address + Hidden'
    ELSE 'Other'
  END as reason,
  COUNT(*) as count
FROM shops
WHERE 
  address IS NULL 
  OR address = ''
  OR claim_status = 'hidden'
GROUP BY 
  CASE 
    WHEN address IS NULL OR address = '' THEN 'No Address'
    WHEN claim_status = 'hidden' THEN 'Hidden Status'
    WHEN address IS NULL OR address = '' AND claim_status = 'hidden' THEN 'No Address + Hidden'
    ELSE 'Other'
  END
ORDER BY count DESC;

-- 8. Visible shops by category (top 10)
SELECT 
  'Visible Shops by Category (Top 10)' as metric,
  c.name as category,
  COUNT(s.id) as visible_count
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE 
  s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
  AND s.claim_status != 'hidden'
GROUP BY c.id, c.name
ORDER BY visible_count DESC
LIMIT 10;

