-- ============================================================================
-- COMPREHENSIVE SHOP STRUCTURE VERIFICATION
-- ============================================================================
-- This query checks how shops are structured after migrations
-- Run this in Supabase SQL Editor to understand your shop data
-- ============================================================================

-- 1. TOTAL SHOPS OVERVIEW
SELECT 
  COUNT(*) as total_shops,
  COUNT(CASE WHEN address IS NOT NULL AND address != '' THEN 1 END) as shops_with_address,
  COUNT(CASE WHEN claim_status = 'approved' THEN 1 END) as shops_approved,
  COUNT(CASE WHEN claim_status IS NULL THEN 1 END) as shops_null_claim_status,
  COUNT(CASE WHEN claim_status = 'unclaimed' THEN 1 END) as shops_unclaimed,
  COUNT(CASE WHEN claim_status = 'pending' THEN 1 END) as shops_pending,
  COUNT(CASE WHEN claim_status = 'hidden' THEN 1 END) as shops_hidden,
  COUNT(CASE WHEN claim_status != 'hidden' OR claim_status IS NULL THEN 1 END) as shops_visible,
  COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) as shops_with_category
FROM shops;

-- 2. SHOPS BY CLAIM STATUS
SELECT 
  COALESCE(claim_status, 'NULL') as claim_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM shops), 2) as percentage
FROM shops
GROUP BY claim_status
ORDER BY count DESC;

-- 3. SHOPS BY MAIN CATEGORY (main categories are identified by name)
SELECT 
  COALESCE(c.name, 'No Category') as main_category,
  COUNT(DISTINCT s.id) as shop_count,
  COUNT(CASE WHEN s.address IS NOT NULL AND s.address != '' THEN 1 END) as shops_with_address,
  COUNT(CASE WHEN s.claim_status != 'hidden' OR s.claim_status IS NULL THEN 1 END) as visible_shops
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
WHERE c.name IN (
  'Beauty Services',
  'Spa, Onsen & Relaxation',
  'Hotels & Stays',
  'Dining & Izakaya',
  'Clinics & Medical Care',
  'Activities & Sports',
  'Unknown'
)
GROUP BY c.id, c.name
ORDER BY shop_count DESC;

-- 4. SHOPS BY SUBCATEGORY (direct category assignment)
SELECT 
  COALESCE(c.name, 'No Category') as subcategory_name,
  COUNT(DISTINCT s.id) as shop_count,
  COUNT(CASE WHEN s.address IS NOT NULL AND s.address != '' THEN 1 END) as shops_with_address,
  COUNT(CASE WHEN s.claim_status != 'hidden' OR s.claim_status IS NULL THEN 1 END) as visible_shops
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
WHERE c.name IN (
  'Hair Salon', 'Nail Salon', 'Eyelash / Eyebrow', 'Beauty Salon', 'General Salon', 'Barbershop', 'Waxing',
  'Spa', 'Massages', 'Onsen', 'Ryokan Onsen',
  'Hotel', 'Boutique Hotel', 'Guest House', 'Ryokan Stay',
  'Restaurant', 'Izakaya', 'Karaoke',
  'Dental Clinic', 'Eye Clinic', 'Women''s Clinic', 'Wellness Clinic',
  'Golf', 'Golf Practice Range', 'Pilates', 'Yoga'
)
GROUP BY c.id, c.name
ORDER BY shop_count DESC
LIMIT 30;

-- 5. SHOPS THAT SHOULD APPEAR IN LINE APP
-- (Based on LINE app search query logic: address required, claim_status not hidden)
SELECT 
  COUNT(*) as shops_visible_in_line_app,
  COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) as shops_with_category,
  COUNT(CASE WHEN prefecture IS NOT NULL THEN 1 END) as shops_with_prefecture,
  COUNT(CASE WHEN city IS NOT NULL OR normalized_city IS NOT NULL THEN 1 END) as shops_with_city
FROM shops
WHERE 
  address IS NOT NULL 
  AND address != ''
  AND (claim_status IS NULL OR claim_status = 'approved' OR claim_status = 'unclaimed' OR claim_status = 'pending')
  AND claim_status != 'hidden';

-- 6. SAMPLE SHOPS BY CATEGORY (for LINE app)
-- Shows both main categories and subcategories
SELECT 
  c.name as category_name,
  CASE 
    WHEN c.name IN ('Beauty Services', 'Spa, Onsen & Relaxation', 'Hotels & Stays', 
                    'Dining & Izakaya', 'Clinics & Medical Care', 'Activities & Sports', 'Unknown') 
    THEN 'Main Category'
    ELSE 'Subcategory'
  END as category_type,
  COUNT(s.id) as shop_count
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
WHERE 
  s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
  AND s.claim_status != 'hidden'
GROUP BY c.id, c.name
ORDER BY shop_count DESC
LIMIT 20;

-- 7. CHECK FOR SHOPS STILL ASSIGNED TO MAIN CATEGORIES (should be minimal)
SELECT 
  c.name as main_category_name,
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

-- 8. SHOPS WITHOUT ADDRESSES (won't appear in LINE app)
SELECT 
  COUNT(*) as shops_without_address,
  COUNT(CASE WHEN claim_status != 'hidden' OR claim_status IS NULL THEN 1 END) as visible_shops_without_address
FROM shops
WHERE address IS NULL OR address = '';

-- 9. SHOPS BY PREFECTURE (top 10)
SELECT 
  COALESCE(prefecture, 'No Prefecture') as prefecture,
  COUNT(*) as shop_count,
  COUNT(CASE WHEN address IS NOT NULL AND address != '' THEN 1 END) as shops_with_address
FROM shops
WHERE claim_status != 'hidden' OR claim_status IS NULL
GROUP BY prefecture
ORDER BY shop_count DESC
LIMIT 10;

-- 10. CATEGORY STRUCTURE CHECK
-- Shows main categories and subcategories (flat structure - no parent_id)
-- Main categories are identified by their names
SELECT 
  CASE 
    WHEN c.name IN ('Beauty Services', 'Spa, Onsen & Relaxation', 'Hotels & Stays', 
                    'Dining & Izakaya', 'Clinics & Medical Care', 'Activities & Sports', 'Unknown') 
    THEN c.name
    ELSE NULL
  END as main_category,
  CASE 
    WHEN c.name IN ('Beauty Services', 'Spa, Onsen & Relaxation', 'Hotels & Stays', 
                    'Dining & Izakaya', 'Clinics & Medical Care', 'Activities & Sports', 'Unknown') 
    THEN NULL
    ELSE c.name
  END as subcategory,
  COUNT(s.id) as shop_count
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
WHERE c.name IN (
  -- Main categories
  'Beauty Services',
  'Spa, Onsen & Relaxation',
  'Hotels & Stays',
  'Dining & Izakaya',
  'Clinics & Medical Care',
  'Activities & Sports',
  'Unknown',
  -- Subcategories
  'Hair Salon', 'Nail Salon', 'Eyelash / Eyebrow', 'Beauty Salon', 'General Salon', 'Barbershop', 'Waxing',
  'Spa', 'Massages', 'Onsen', 'Ryokan Onsen',
  'Hotel', 'Boutique Hotel', 'Guest House', 'Ryokan Stay',
  'Restaurant', 'Izakaya', 'Karaoke',
  'Dental Clinic', 'Eye Clinic', 'Women''s Clinic', 'Wellness Clinic',
  'Golf', 'Golf Practice Range', 'Pilates', 'Yoga'
)
GROUP BY c.id, c.name
ORDER BY 
  CASE 
    WHEN c.name IN ('Beauty Services', 'Spa, Onsen & Relaxation', 'Hotels & Stays', 
                    'Dining & Izakaya', 'Clinics & Medical Care', 'Activities & Sports', 'Unknown') 
    THEN 0 ELSE 1 
  END,
  c.name,
  shop_count DESC;

