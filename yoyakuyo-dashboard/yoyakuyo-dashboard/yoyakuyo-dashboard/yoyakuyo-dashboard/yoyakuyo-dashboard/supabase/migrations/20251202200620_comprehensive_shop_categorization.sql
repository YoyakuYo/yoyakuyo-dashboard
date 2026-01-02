-- Comprehensive Shop Categorization Migration
-- This migration expands categories and matches 30,000+ shops to proper categories
-- Uses pattern matching on shop names, descriptions, and handles both English and Japanese keywords

-- ============================================================================
-- STEP 1: Expand Categories Table
-- ============================================================================

-- Insert all necessary categories (if they don't exist)
INSERT INTO categories (name, description) VALUES
    -- Beauty Services
    ('Nail Salon', 'Nail care and manicure services'),
    ('Barbershop', 'Men''s haircuts and grooming'),
    ('Hair Salon', 'Hair styling and coloring services'),
    ('Eyelash', 'Eyelash extensions and treatments'),
    ('Beauty Salon', 'General beauty and cosmetic services'),
    ('General Salon', 'Multi-service salon'),
    
    -- Spa, Onsen & Relaxation
    ('Spa & Massage', 'Spa treatments and massage therapy'),
    ('Onsen', 'Traditional Japanese hot springs'),
    ('Ryokan', 'Traditional Japanese inns'),
    ('Relaxation', 'Relaxation and wellness services'),
    
    -- Hotels & Stays
    ('Hotel', 'Hotels and accommodations'),
    ('Ryokan Stay', 'Traditional Japanese inn accommodations'),
    ('Guesthouse', 'Guesthouses and budget accommodations'),
    ('Boutique Hotel', 'Boutique and design hotels'),
    
    -- Dining & Izakaya
    ('Restaurant', 'Restaurants and dining establishments'),
    ('Izakaya', 'Japanese casual dining and drinking establishments'),
    ('Cafe', 'Cafes and coffee shops'),
    ('Bar', 'Bars and nightlife'),
    
    -- Clinics & Medical Care
    ('Dental Clinic', 'Dental care and dental clinics'),
    ('Medical Clinic', 'General medical clinics'),
    ('Aesthetic Clinic', 'Aesthetic and cosmetic medical services'),
    ('Women''s Clinic', 'Women''s health and care clinics'),
    ('Wellness Clinic', 'Wellness and preventive care clinics'),
    
    -- Activities & Sports
    ('Golf Course', 'Golf courses and practice ranges'),
    ('Sports Facility', 'Sports and fitness facilities'),
    ('Activity Center', 'Recreational activity centers'),
    ('Indoor Sports', 'Indoor sports facilities'),
    ('Outdoor Sports', 'Outdoor sports and activities'),
    
    -- Fallback
    ('Unknown', 'Uncategorized shops')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 2: Reset all category assignments (optional - comment out if you want to keep existing)
-- ============================================================================
-- UPDATE shops SET category_id = NULL;

-- ============================================================================
-- STEP 3: Categorize Shops by Pattern Matching
-- Order matters: most specific patterns first, general patterns last
-- ============================================================================

-- 3.1 EYELASH (very specific - must come first)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Eyelash')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%eyelash%' OR
    LOWER(name) LIKE '%lash%' OR
    LOWER(name) LIKE '%extension%' OR
    LOWER(name) LIKE '%まつげ%' OR
    LOWER(name) LIKE '%エクステ%' OR
    LOWER(name) LIKE '%まつ毛%' OR
    LOWER(COALESCE(description, '')) LIKE '%eyelash%' OR
    LOWER(COALESCE(description, '')) LIKE '%lash%'
  );

-- 3.2 NAIL SALON
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Nail Salon')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%nail%' OR
    LOWER(name) LIKE '%nails%' OR
    LOWER(name) LIKE '%manicure%' OR
    LOWER(name) LIKE '%pedicure%' OR
    LOWER(name) LIKE '%ネイル%' OR
    LOWER(name) LIKE '%マニキュア%' OR
    LOWER(name) LIKE '%ネイルサロン%' OR
    LOWER(COALESCE(description, '')) LIKE '%nail%' OR
    LOWER(COALESCE(description, '')) LIKE '%manicure%'
  );

-- 3.3 BARBERSHOP
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Barbershop')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%barber%' OR
    LOWER(name) LIKE '%barbershop%' OR
    LOWER(name) LIKE '%men''s%' OR
    LOWER(name) LIKE '%mens%' OR
    LOWER(name) LIKE '%理髪%' OR
    LOWER(name) LIKE '%理容%' OR
    LOWER(name) LIKE '%理髪店%' OR
    LOWER(name) LIKE '%理容室%' OR
    LOWER(name) LIKE '%バーバー%' OR
    LOWER(COALESCE(description, '')) LIKE '%barber%'
  );

-- 3.4 ONSEN (specific - before Spa)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Onsen')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%onsen%' OR
    LOWER(name) LIKE '%hot spring%' OR
    LOWER(name) LIKE '%hotspring%' OR
    LOWER(name) LIKE '%温泉%' OR
    LOWER(name) LIKE '%露天風呂%' OR
    LOWER(COALESCE(description, '')) LIKE '%onsen%' OR
    LOWER(COALESCE(description, '')) LIKE '%hot spring%'
  );

-- 3.5 RYOKAN (specific - before Hotel)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Ryokan')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%ryokan%' OR
    LOWER(name) LIKE '%旅館%' OR
    LOWER(name) LIKE '%和風旅館%' OR
    LOWER(COALESCE(description, '')) LIKE '%ryokan%'
  );

-- 3.6 IZAKAYA (specific - before Restaurant)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Izakaya')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%izakaya%' OR
    LOWER(name) LIKE '%居酒屋%' OR
    LOWER(name) LIKE '%いざかや%' OR
    LOWER(COALESCE(description, '')) LIKE '%izakaya%'
  );

-- 3.7 DENTAL CLINIC (specific - before Medical Clinic)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Dental Clinic')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%dental%' OR
    LOWER(name) LIKE '%dentist%' OR
    LOWER(name) LIKE '%歯科%' OR
    LOWER(name) LIKE '%歯医者%' OR
    LOWER(name) LIKE '%デンタル%' OR
    LOWER(COALESCE(description, '')) LIKE '%dental%' OR
    LOWER(COALESCE(description, '')) LIKE '%dentist%'
  );

-- 3.8 AESTHETIC CLINIC (specific - before Medical Clinic)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Aesthetic Clinic')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%aesthetic%' OR
    LOWER(name) LIKE '%esthetic%' OR
    LOWER(name) LIKE '%美容外科%' OR
    LOWER(name) LIKE '%美容皮膚科%' OR
    LOWER(name) LIKE '%エステ%' OR
    LOWER(COALESCE(description, '')) LIKE '%aesthetic%'
  );

-- 3.9 WOMEN'S CLINIC
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Women''s Clinic')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%women%' OR
    LOWER(name) LIKE '%woman%' OR
    LOWER(name) LIKE '%婦人科%' OR
    LOWER(name) LIKE '%女性%' OR
    LOWER(COALESCE(description, '')) LIKE '%women%' OR
    LOWER(COALESCE(description, '')) LIKE '%婦人科%'
  );

-- 3.10 GOLF COURSE
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Golf Course')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%golf%' OR
    LOWER(name) LIKE '%ゴルフ%' OR
    LOWER(name) LIKE '%ゴルフ場%' OR
    LOWER(name) LIKE '%ゴルフ練習場%' OR
    LOWER(COALESCE(description, '')) LIKE '%golf%'
  );

-- 3.11 SPA & MASSAGE
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Spa & Massage')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%spa%' OR
    LOWER(name) LIKE '%massage%' OR
    LOWER(name) LIKE '%therapy%' OR
    LOWER(name) LIKE '%relaxation%' OR
    LOWER(name) LIKE '%スパ%' OR
    LOWER(name) LIKE '%マッサージ%' OR
    LOWER(name) LIKE '%リラクゼーション%' OR
    LOWER(COALESCE(description, '')) LIKE '%spa%' OR
    LOWER(COALESCE(description, '')) LIKE '%massage%'
  );

-- 3.12 HAIR SALON
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Hair Salon')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%hair%' OR
    LOWER(name) LIKE '%salon%' OR
    LOWER(name) LIKE '%haircut%' OR
    LOWER(name) LIKE '%hair color%' OR
    LOWER(name) LIKE '%haircolor%' OR
    LOWER(name) LIKE '%ヘア%' OR
    LOWER(name) LIKE '%サロン%' OR
    LOWER(name) LIKE '%美容室%' OR
    LOWER(name) LIKE '%ヘアサロン%' OR
    LOWER(COALESCE(description, '')) LIKE '%hair%' OR
    LOWER(COALESCE(description, '')) LIKE '%salon%'
  );

-- 3.13 MEDICAL CLINIC
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Medical Clinic')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%clinic%' OR
    LOWER(name) LIKE '%medical%' OR
    LOWER(name) LIKE '%hospital%' OR
    LOWER(name) LIKE '%クリニック%' OR
    LOWER(name) LIKE '%医院%' OR
    LOWER(name) LIKE '%病院%' OR
    LOWER(COALESCE(description, '')) LIKE '%clinic%' OR
    LOWER(COALESCE(description, '')) LIKE '%medical%'
  );

-- 3.14 WELLNESS CLINIC
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Wellness Clinic')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%wellness%' OR
    LOWER(name) LIKE '%健康%' OR
    LOWER(name) LIKE '%ヘルス%' OR
    LOWER(COALESCE(description, '')) LIKE '%wellness%'
  );

-- 3.15 HOTEL
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Hotel')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%hotel%' OR
    LOWER(name) LIKE '%ホテル%' OR
    LOWER(name) LIKE '%resort%' OR
    LOWER(name) LIKE '%リゾート%' OR
    LOWER(COALESCE(description, '')) LIKE '%hotel%' OR
    LOWER(COALESCE(description, '')) LIKE '%accommodation%'
  );

-- 3.16 RYOKAN STAY
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Ryokan Stay')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%ryokan%' OR
    LOWER(name) LIKE '%旅館%' OR
    LOWER(COALESCE(description, '')) LIKE '%ryokan%'
  );

-- 3.17 GUESTHOUSE
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Guesthouse')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%guesthouse%' OR
    LOWER(name) LIKE '%guest house%' OR
    LOWER(name) LIKE '%民宿%' OR
    LOWER(name) LIKE '%ゲストハウス%' OR
    LOWER(COALESCE(description, '')) LIKE '%guesthouse%'
  );

-- 3.18 BOUTIQUE HOTEL
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Boutique Hotel')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%boutique%' OR
    LOWER(name) LIKE '%ブティック%' OR
    LOWER(COALESCE(description, '')) LIKE '%boutique%'
  );

-- 3.19 RESTAURANT
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Restaurant')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%restaurant%' OR
    LOWER(name) LIKE '%レストラン%' OR
    LOWER(name) LIKE '%dining%' OR
    LOWER(name) LIKE '%diner%' OR
    LOWER(name) LIKE '%食堂%' OR
    LOWER(COALESCE(description, '')) LIKE '%restaurant%' OR
    LOWER(COALESCE(description, '')) LIKE '%dining%'
  );

-- 3.20 CAFE
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Cafe')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%cafe%' OR
    LOWER(name) LIKE '%café%' OR
    LOWER(name) LIKE '%coffee%' OR
    LOWER(name) LIKE '%カフェ%' OR
    LOWER(name) LIKE '%コーヒー%' OR
    LOWER(COALESCE(description, '')) LIKE '%cafe%' OR
    LOWER(COALESCE(description, '')) LIKE '%coffee%'
  );

-- 3.21 BAR
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Bar')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%bar%' OR
    LOWER(name) LIKE '%pub%' OR
    LOWER(name) LIKE '%バー%' OR
    LOWER(name) LIKE '%パブ%' OR
    LOWER(COALESCE(description, '')) LIKE '%bar%' OR
    LOWER(COALESCE(description, '')) LIKE '%pub%'
  );

-- 3.22 SPORTS FACILITY
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Sports Facility')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%sports%' OR
    LOWER(name) LIKE '%sport%' OR
    LOWER(name) LIKE '%fitness%' OR
    LOWER(name) LIKE '%gym%' OR
    LOWER(name) LIKE '%スポーツ%' OR
    LOWER(name) LIKE '%フィットネス%' OR
    LOWER(name) LIKE '%ジム%' OR
    LOWER(COALESCE(description, '')) LIKE '%sports%' OR
    LOWER(COALESCE(description, '')) LIKE '%fitness%'
  );

-- 3.23 ACTIVITY CENTER
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Activity Center')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%activity%' OR
    LOWER(name) LIKE '%activities%' OR
    LOWER(name) LIKE '%recreation%' OR
    LOWER(name) LIKE '%アクティビティ%' OR
    LOWER(name) LIKE '%レクリエーション%' OR
    LOWER(COALESCE(description, '')) LIKE '%activity%'
  );

-- 3.24 INDOOR SPORTS
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Indoor Sports')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%indoor%' OR
    LOWER(name) LIKE '%屋内%' OR
    LOWER(COALESCE(description, '')) LIKE '%indoor%'
  );

-- 3.25 OUTDOOR SPORTS
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Outdoor Sports')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%outdoor%' OR
    LOWER(name) LIKE '%屋外%' OR
    LOWER(COALESCE(description, '')) LIKE '%outdoor%'
  );

-- 3.26 BEAUTY SALON (general - after specific beauty categories)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Beauty Salon')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%beauty%' OR
    LOWER(name) LIKE '%cosmetic%' OR
    LOWER(name) LIKE '%makeup%' OR
    LOWER(name) LIKE '%make-up%' OR
    LOWER(name) LIKE '%美容%' OR
    LOWER(name) LIKE '%コスメ%' OR
    LOWER(COALESCE(description, '')) LIKE '%beauty%' OR
    LOWER(COALESCE(description, '')) LIKE '%cosmetic%'
  );

-- 3.27 RELAXATION (general - after specific spa/onsen)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Relaxation')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%relaxation%' OR
    LOWER(name) LIKE '%リラクゼーション%' OR
    LOWER(COALESCE(description, '')) LIKE '%relaxation%'
  );

-- 3.28 GENERAL SALON (catch-all for salons)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'General Salon')
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%salon%' OR
    LOWER(name) LIKE '%サロン%'
  );

-- 3.29 UNKNOWN (fallback for uncategorized shops)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Unknown')
WHERE category_id IS NULL;

-- ============================================================================
-- STEP 4: Create summary report
-- ============================================================================

-- This query shows the distribution of shops by category
-- Run this after the migration to verify results:
/*
SELECT 
    c.name AS category_name,
    COUNT(s.id) AS shop_count,
    ROUND(COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM shops), 2) AS percentage
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
GROUP BY c.id, c.name
ORDER BY shop_count DESC;
*/

