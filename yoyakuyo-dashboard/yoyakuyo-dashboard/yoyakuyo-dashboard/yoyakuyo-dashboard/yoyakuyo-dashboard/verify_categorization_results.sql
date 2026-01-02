-- ============================================================================
-- VERIFY CATEGORIZATION RESULTS
-- ============================================================================
-- Run this after fix_shop_categorization.sql to verify the results
-- ============================================================================

-- 1. Check shops still in main categories (should be 0 or very few)
SELECT 
  'Shops in Main Categories (should be 0)' as check_type,
  c.name as main_category,
  COUNT(s.id) as shop_count
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name IN (
  'Beauty Services',
  'Spa, Onsen & Relaxation',
  'Hotels & Stays',
  'Dining & Izakaya',
  'Clinics & Medical Care',
  'Activities & Sports'
)
GROUP BY c.id, c.name
ORDER BY shop_count DESC;

-- 2. Check Unknown shops (should be minimal)
SELECT 
  'Unknown Shops (should be minimal)' as check_type,
  COUNT(*) as unknown_shops_count
FROM shops s
WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown');

-- 3. Top 20 subcategories with shop counts
SELECT 
  'Top Subcategories' as check_type,
  c.name as subcategory,
  COUNT(s.id) as shop_count,
  ROUND(COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM shops), 2) as percentage
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name NOT IN (
  'Beauty Services',
  'Spa, Onsen & Relaxation',
  'Hotels & Stays',
  'Dining & Izakaya',
  'Clinics & Medical Care',
  'Activities & Sports',
  'Unknown'
)
GROUP BY c.id, c.name
ORDER BY shop_count DESC
LIMIT 20;

-- 4. Category distribution summary
SELECT 
  'Category Distribution' as check_type,
  CASE 
    WHEN c.name IN ('Beauty Services', 'Spa, Onsen & Relaxation', 'Hotels & Stays', 
                    'Dining & Izakaya', 'Clinics & Medical Care', 'Activities & Sports', 'Unknown') 
    THEN 'Main Category or Unknown'
    ELSE 'Subcategory'
  END as category_type,
  COUNT(s.id) as shop_count,
  ROUND(COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM shops), 2) as percentage
FROM shops s
JOIN categories c ON s.category_id = c.id
GROUP BY 
  CASE 
    WHEN c.name IN ('Beauty Services', 'Spa, Onsen & Relaxation', 'Hotels & Stays', 
                    'Dining & Izakaya', 'Clinics & Medical Care', 'Activities & Sports', 'Unknown') 
    THEN 'Main Category or Unknown'
    ELSE 'Subcategory'
  END
ORDER BY shop_count DESC;

-- 5. Shops visible in LINE app (with address and not hidden)
SELECT 
  'Shops Visible in LINE App' as check_type,
  COUNT(*) as total_visible_shops,
  COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) as visible_shops_with_category,
  COUNT(CASE WHEN category_id IN (
    SELECT id FROM categories WHERE name NOT IN ('Unknown')
  ) THEN 1 END) as visible_shops_with_valid_category
FROM shops
WHERE 
  address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status = 'approved' OR claim_status = 'unclaimed' OR claim_status = 'pending')
  AND claim_status != 'hidden';

