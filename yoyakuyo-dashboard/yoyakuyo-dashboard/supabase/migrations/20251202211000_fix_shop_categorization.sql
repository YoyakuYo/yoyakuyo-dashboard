-- ============================================================================
-- FIX SHOP CATEGORIZATION - Ensure All Shops Are in Main Categories
-- ============================================================================
-- This migration:
--   1. Checks where all shops currently are
--   2. Reclassifies shops that are in "Unknown" or NULL
--   3. Ensures all shops are properly categorized into the 6 main categories
-- ============================================================================

-- ============================================================================
-- STEP 1: Diagnostic - See Current Distribution
-- ============================================================================

-- Show current category distribution (run this first to see the problem)
/*
SELECT 
    COALESCE(c.name, 'NULL/Unknown') AS category_name,
    COUNT(s.id) AS shop_count,
    ROUND(COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM shops), 2) AS percentage
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
GROUP BY c.id, c.name
ORDER BY shop_count DESC;
*/

-- ============================================================================
-- STEP 2: Reclassify Shops That Are NULL or in "Unknown" Category
-- ============================================================================

-- First, ensure main categories exist
INSERT INTO categories (name, description) VALUES
    ('Beauty Services', 'Hair salons, nail salons, barbershops, eyelash salons, beauty services'),
    ('Spa, Onsen & Relaxation', 'Spas, onsen (hot springs), massage, relaxation services, ryokan baths'),
    ('Hotels & Stays', 'Hotels, ryokan (traditional inns), guesthouses, accommodations'),
    ('Dining & Izakaya', 'Restaurants, izakaya (Japanese pubs), cafes, bars, dining establishments'),
    ('Clinics & Medical Care', 'Dental clinics, medical clinics, aesthetic clinics, women''s clinics, wellness clinics'),
    ('Activities & Sports', 'Golf courses, gyms, sports facilities, activity centers, recreational activities'),
    ('Unknown', 'Uncategorized shops')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 3: Reclassify NULL/Unknown Shops Using Keyword Matching
-- ============================================================================

-- 3.1 BEAUTY SERVICES
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
WHERE (category_id IS NULL OR category_id = (SELECT id FROM categories WHERE name = 'Unknown'))
  AND (
    LOWER(COALESCE(name, '')) LIKE '%hair%' OR
    LOWER(COALESCE(name, '')) LIKE '%nail%' OR
    LOWER(COALESCE(name, '')) LIKE '%barber%' OR
    LOWER(COALESCE(name, '')) LIKE '%eyelash%' OR
    LOWER(COALESCE(name, '')) LIKE '%lash%' OR
    LOWER(COALESCE(name, '')) LIKE '%beauty%' OR
    LOWER(COALESCE(name, '')) LIKE '%salon%' OR
    LOWER(COALESCE(name, '')) LIKE '%美容%' OR
    LOWER(COALESCE(name, '')) LIKE '%ネイル%' OR
    LOWER(COALESCE(name, '')) LIKE '%ヘア%' OR
    LOWER(COALESCE(name, '')) LIKE '%理髪%' OR
    LOWER(COALESCE(name, '')) LIKE '%まつげ%' OR
    LOWER(COALESCE(description, '')) LIKE '%hair%' OR
    LOWER(COALESCE(description, '')) LIKE '%nail%' OR
    LOWER(COALESCE(description, '')) LIKE '%barber%' OR
    LOWER(COALESCE(description, '')) LIKE '%beauty%' OR
    LOWER(COALESCE(description, '')) LIKE '%salon%'
  );

-- 3.2 SPA, ONSEN & RELAXATION
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Spa, Onsen & Relaxation')
WHERE (category_id IS NULL OR category_id = (SELECT id FROM categories WHERE name = 'Unknown'))
  AND (
    LOWER(COALESCE(name, '')) LIKE '%onsen%' OR
    LOWER(COALESCE(name, '')) LIKE '%hot spring%' OR
    LOWER(COALESCE(name, '')) LIKE '%spa%' OR
    LOWER(COALESCE(name, '')) LIKE '%massage%' OR
    LOWER(COALESCE(name, '')) LIKE '%relaxation%' OR
    LOWER(COALESCE(name, '')) LIKE '%ryokan%' OR
    LOWER(COALESCE(name, '')) LIKE '%温泉%' OR
    LOWER(COALESCE(name, '')) LIKE '%スパ%' OR
    LOWER(COALESCE(name, '')) LIKE '%マッサージ%' OR
    LOWER(COALESCE(name, '')) LIKE '%旅館%' OR
    LOWER(COALESCE(description, '')) LIKE '%onsen%' OR
    LOWER(COALESCE(description, '')) LIKE '%spa%' OR
    LOWER(COALESCE(description, '')) LIKE '%massage%' OR
    LOWER(COALESCE(description, '')) LIKE '%relaxation%'
  );

-- 3.3 HOTELS & STAYS
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Hotels & Stays')
WHERE (category_id IS NULL OR category_id = (SELECT id FROM categories WHERE name = 'Unknown'))
  AND (
    LOWER(COALESCE(name, '')) LIKE '%hotel%' OR
    LOWER(COALESCE(name, '')) LIKE '%ryokan%' OR
    LOWER(COALESCE(name, '')) LIKE '%resort%' OR
    LOWER(COALESCE(name, '')) LIKE '%guesthouse%' OR
    LOWER(COALESCE(name, '')) LIKE '%accommodation%' OR
    LOWER(COALESCE(name, '')) LIKE '%stay%' OR
    LOWER(COALESCE(name, '')) LIKE '%ホテル%' OR
    LOWER(COALESCE(name, '')) LIKE '%旅館%' OR
    LOWER(COALESCE(name, '')) LIKE '%宿泊%' OR
    LOWER(COALESCE(description, '')) LIKE '%hotel%' OR
    LOWER(COALESCE(description, '')) LIKE '%accommodation%' OR
    LOWER(COALESCE(description, '')) LIKE '%ホテル%'
  )
  AND NOT (
    LOWER(COALESCE(name, '')) LIKE '%restaurant%' OR
    LOWER(COALESCE(name, '')) LIKE '%レストラン%' OR
    LOWER(COALESCE(name, '')) LIKE '%dining%'
  );

-- 3.4 DINING & IZAKAYA
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Dining & Izakaya')
WHERE (category_id IS NULL OR category_id = (SELECT id FROM categories WHERE name = 'Unknown'))
  AND (
    LOWER(COALESCE(name, '')) LIKE '%restaurant%' OR
    LOWER(COALESCE(name, '')) LIKE '%izakaya%' OR
    LOWER(COALESCE(name, '')) LIKE '%dining%' OR
    LOWER(COALESCE(name, '')) LIKE '%cafe%' OR
    LOWER(COALESCE(name, '')) LIKE '%coffee%' OR
    LOWER(COALESCE(name, '')) LIKE '%bar%' OR
    LOWER(COALESCE(name, '')) LIKE '%pub%' OR
    LOWER(COALESCE(name, '')) LIKE '%sushi%' OR
    LOWER(COALESCE(name, '')) LIKE '%ramen%' OR
    LOWER(COALESCE(name, '')) LIKE '%yakitori%' OR
    LOWER(COALESCE(name, '')) LIKE '%レストラン%' OR
    LOWER(COALESCE(name, '')) LIKE '%居酒屋%' OR
    LOWER(COALESCE(name, '')) LIKE '%カフェ%' OR
    LOWER(COALESCE(name, '')) LIKE '%バー%' OR
    LOWER(COALESCE(name, '')) LIKE '%寿司%' OR
    LOWER(COALESCE(name, '')) LIKE '%ラーメン%' OR
    LOWER(COALESCE(description, '')) LIKE '%restaurant%' OR
    LOWER(COALESCE(description, '')) LIKE '%izakaya%' OR
    LOWER(COALESCE(description, '')) LIKE '%dining%' OR
    LOWER(COALESCE(description, '')) LIKE '%cafe%'
  );

-- 3.5 CLINICS & MEDICAL CARE
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Clinics & Medical Care')
WHERE (category_id IS NULL OR category_id = (SELECT id FROM categories WHERE name = 'Unknown'))
  AND (
    LOWER(COALESCE(name, '')) LIKE '%dental%' OR
    LOWER(COALESCE(name, '')) LIKE '%dentist%' OR
    LOWER(COALESCE(name, '')) LIKE '%clinic%' OR
    LOWER(COALESCE(name, '')) LIKE '%medical%' OR
    LOWER(COALESCE(name, '')) LIKE '%hospital%' OR
    LOWER(COALESCE(name, '')) LIKE '%aesthetic%' OR
    LOWER(COALESCE(name, '')) LIKE '%esthetic%' OR
    LOWER(COALESCE(name, '')) LIKE '%women%' OR
    LOWER(COALESCE(name, '')) LIKE '%woman%' OR
    LOWER(COALESCE(name, '')) LIKE '%クリニック%' OR
    LOWER(COALESCE(name, '')) LIKE '%医院%' OR
    LOWER(COALESCE(name, '')) LIKE '%病院%' OR
    LOWER(COALESCE(name, '')) LIKE '%歯科%' OR
    LOWER(COALESCE(name, '')) LIKE '%美容外科%' OR
    LOWER(COALESCE(name, '')) LIKE '%婦人科%' OR
    LOWER(COALESCE(description, '')) LIKE '%dental%' OR
    LOWER(COALESCE(description, '')) LIKE '%clinic%' OR
    LOWER(COALESCE(description, '')) LIKE '%medical%' OR
    LOWER(COALESCE(description, '')) LIKE '%hospital%'
  );

-- 3.6 ACTIVITIES & SPORTS
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Activities & Sports')
WHERE (category_id IS NULL OR category_id = (SELECT id FROM categories WHERE name = 'Unknown'))
  AND (
    LOWER(COALESCE(name, '')) LIKE '%golf%' OR
    LOWER(COALESCE(name, '')) LIKE '%sports%' OR
    LOWER(COALESCE(name, '')) LIKE '%fitness%' OR
    LOWER(COALESCE(name, '')) LIKE '%gym%' OR
    LOWER(COALESCE(name, '')) LIKE '%activity%' OR
    LOWER(COALESCE(name, '')) LIKE '%recreation%' OR
    LOWER(COALESCE(name, '')) LIKE '%yoga%' OR
    LOWER(COALESCE(name, '')) LIKE '%tennis%' OR
    LOWER(COALESCE(name, '')) LIKE '%swimming%' OR
    LOWER(COALESCE(name, '')) LIKE '%ゴルフ%' OR
    LOWER(COALESCE(name, '')) LIKE '%スポーツ%' OR
    LOWER(COALESCE(name, '')) LIKE '%フィットネス%' OR
    LOWER(COALESCE(name, '')) LIKE '%ジム%' OR
    LOWER(COALESCE(name, '')) LIKE '%アクティビティ%' OR
    LOWER(COALESCE(description, '')) LIKE '%golf%' OR
    LOWER(COALESCE(description, '')) LIKE '%sports%' OR
    LOWER(COALESCE(description, '')) LIKE '%fitness%' OR
    LOWER(COALESCE(description, '')) LIKE '%activity%'
  );

-- 3.7 UNKNOWN (fallback for anything that doesn't match)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Unknown')
WHERE category_id IS NULL;

-- ============================================================================
-- STEP 4: Final Report
-- ============================================================================

-- Show final category distribution
SELECT 
    c.name AS category_name,
    COUNT(s.id) AS shop_count,
    ROUND(COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM shops), 2) AS percentage
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
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

-- Show total shop count
SELECT 
    COUNT(*) AS total_shops,
    COUNT(category_id) AS shops_with_category,
    COUNT(*) - COUNT(category_id) AS shops_without_category
FROM shops;

