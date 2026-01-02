-- ============================================================================
-- AUTOMATIC SHOP CLASSIFICATION TO 6 MAIN CATEGORIES
-- ============================================================================
-- This SQL script classifies ALL shops into 6 main categories using keyword matching
-- Run this directly in Supabase SQL Editor
--
-- Main Categories:
--   1. Beauty Services
--   2. Spa, Onsen & Relaxation
--   3. Hotels & Stays
--   4. Dining & Izakaya
--   5. Clinics & Medical Care
--   6. Activities & Sports
--   7. Unknown (fallback)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Main Categories (if they don't exist)
-- ============================================================================

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
-- STEP 2: Classification Logic
-- Order matters: most specific patterns first, general patterns last
-- ============================================================================

-- 2.1 BEAUTY SERVICES (very specific keywords first)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
WHERE (category_id IS NULL OR category_id != (SELECT id FROM categories WHERE name = 'Beauty Services'))
  AND (
    -- Eyelash (very specific)
    LOWER(name) LIKE '%eyelash%' OR
    LOWER(name) LIKE '%lash%' OR
    LOWER(name) LIKE '%extension%' OR
    LOWER(name) LIKE '%まつげ%' OR
    LOWER(name) LIKE '%エクステ%' OR
    LOWER(name) LIKE '%まつ毛%' OR
    -- Nail
    LOWER(name) LIKE '%nail%' OR
    LOWER(name) LIKE '%nails%' OR
    LOWER(name) LIKE '%manicure%' OR
    LOWER(name) LIKE '%pedicure%' OR
    LOWER(name) LIKE '%ネイル%' OR
    LOWER(name) LIKE '%マニキュア%' OR
    LOWER(name) LIKE '%ネイルサロン%' OR
    -- Barber
    LOWER(name) LIKE '%barber%' OR
    LOWER(name) LIKE '%barbershop%' OR
    LOWER(name) LIKE '%理髪%' OR
    LOWER(name) LIKE '%理容%' OR
    LOWER(name) LIKE '%理髪店%' OR
    LOWER(name) LIKE '%理容室%' OR
    LOWER(name) LIKE '%バーバー%' OR
    -- Hair
    LOWER(name) LIKE '%hair%' OR
    LOWER(name) LIKE '%haircut%' OR
    LOWER(name) LIKE '%hair color%' OR
    LOWER(name) LIKE '%haircolor%' OR
    LOWER(name) LIKE '%ヘア%' OR
    LOWER(name) LIKE '%ヘアサロン%' OR
    LOWER(name) LIKE '%美容室%' OR
    -- Beauty/Beauty Salon
    LOWER(name) LIKE '%beauty%' OR
    LOWER(name) LIKE '%cosmetic%' OR
    LOWER(name) LIKE '%makeup%' OR
    LOWER(name) LIKE '%make-up%' OR
    LOWER(name) LIKE '%美容%' OR
    LOWER(name) LIKE '%コスメ%' OR
    -- Salon (general, but not spa)
    (LOWER(name) LIKE '%salon%' OR LOWER(name) LIKE '%サロン%')
    AND NOT (
      LOWER(name) LIKE '%spa%' OR
      LOWER(name) LIKE '%スパ%' OR
      LOWER(name) LIKE '%massage%' OR
      LOWER(name) LIKE '%マッサージ%'
    )
    -- Description matches
    OR LOWER(COALESCE(description, '')) LIKE '%hair%' OR
    LOWER(COALESCE(description, '')) LIKE '%nail%' OR
    LOWER(COALESCE(description, '')) LIKE '%barber%' OR
    LOWER(COALESCE(description, '')) LIKE '%eyelash%' OR
    LOWER(COALESCE(description, '')) LIKE '%beauty%' OR
    LOWER(COALESCE(description, '')) LIKE '%salon%' OR
    LOWER(COALESCE(description, '')) LIKE '%美容%' OR
    LOWER(COALESCE(description, '')) LIKE '%ネイル%' OR
    LOWER(COALESCE(description, '')) LIKE '%ヘア%'
  );

-- 2.2 SPA, ONSEN & RELAXATION (specific - before Hotels)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Spa, Onsen & Relaxation')
WHERE (category_id IS NULL OR category_id != (SELECT id FROM categories WHERE name = 'Spa, Onsen & Relaxation'))
  AND (
    -- Onsen (very specific)
    LOWER(name) LIKE '%onsen%' OR
    LOWER(name) LIKE '%hot spring%' OR
    LOWER(name) LIKE '%hotspring%' OR
    LOWER(name) LIKE '%温泉%' OR
    LOWER(name) LIKE '%露天風呂%' OR
    LOWER(name) LIKE '%日帰り温泉%' OR
    -- Spa
    LOWER(name) LIKE '%spa%' OR
    LOWER(name) LIKE '%スパ%' OR
    -- Massage
    LOWER(name) LIKE '%massage%' OR
    LOWER(name) LIKE '%マッサージ%' OR
    -- Relaxation
    LOWER(name) LIKE '%relaxation%' OR
    LOWER(name) LIKE '%リラクゼーション%' OR
    LOWER(name) LIKE '%リラク%' OR
    -- Therapy/Wellness (spa context, not clinic)
    (LOWER(name) LIKE '%therapy%' OR LOWER(name) LIKE '%整体%')
    AND NOT LOWER(name) LIKE '%clinic%'
    AND NOT LOWER(name) LIKE '%クリニック%'
    -- Description matches
    OR LOWER(COALESCE(description, '')) LIKE '%onsen%' OR
    LOWER(COALESCE(description, '')) LIKE '%hot spring%' OR
    LOWER(COALESCE(description, '')) LIKE '%spa%' OR
    LOWER(COALESCE(description, '')) LIKE '%massage%' OR
    LOWER(COALESCE(description, '')) LIKE '%relaxation%' OR
    LOWER(COALESCE(description, '')) LIKE '%温泉%' OR
    LOWER(COALESCE(description, '')) LIKE '%スパ%' OR
    LOWER(COALESCE(description, '')) LIKE '%マッサージ%'
  );

-- 2.3 HOTELS & STAYS (specific - before general)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Hotels & Stays')
WHERE (category_id IS NULL OR category_id != (SELECT id FROM categories WHERE name = 'Hotels & Stays'))
  AND (
    -- Ryokan (specific - but not restaurant)
    (LOWER(name) LIKE '%ryokan%' OR LOWER(name) LIKE '%旅館%')
    AND NOT (
      LOWER(name) LIKE '%restaurant%' OR
      LOWER(name) LIKE '%レストラン%' OR
      LOWER(name) LIKE '%dining%' OR
      LOWER(name) LIKE '%diner%'
    )
    OR
    -- Hotel
    LOWER(name) LIKE '%hotel%' OR
    LOWER(name) LIKE '%ホテル%' OR
    -- Resort
    LOWER(name) LIKE '%resort%' OR
    LOWER(name) LIKE '%リゾート%' OR
    -- Guesthouse
    LOWER(name) LIKE '%guesthouse%' OR
    LOWER(name) LIKE '%guest house%' OR
    LOWER(name) LIKE '%民宿%' OR
    LOWER(name) LIKE '%ゲストハウス%' OR
    -- Boutique Hotel
    LOWER(name) LIKE '%boutique%' OR
    LOWER(name) LIKE '%ブティック%' OR
    -- Stay/Accommodation
    LOWER(name) LIKE '%stay%' OR
    LOWER(name) LIKE '%accommodation%' OR
    LOWER(name) LIKE '%宿泊%' OR
    LOWER(name) LIKE '%ビジネスホテル%' OR
    LOWER(name) LIKE '%カプセルホテル%' OR
    -- Description matches
    LOWER(COALESCE(description, '')) LIKE '%hotel%' OR
    LOWER(COALESCE(description, '')) LIKE '%ryokan%' OR
    LOWER(COALESCE(description, '')) LIKE '%accommodation%' OR
    LOWER(COALESCE(description, '')) LIKE '%ホテル%' OR
    LOWER(COALESCE(description, '')) LIKE '%旅館%' OR
    LOWER(COALESCE(description, '')) LIKE '%宿泊%'
  );

-- 2.4 DINING & IZAKAYA (specific - before general)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Dining & Izakaya')
WHERE (category_id IS NULL OR category_id != (SELECT id FROM categories WHERE name = 'Dining & Izakaya'))
  AND (
    -- Izakaya (very specific)
    LOWER(name) LIKE '%izakaya%' OR
    LOWER(name) LIKE '%居酒屋%' OR
    LOWER(name) LIKE '%いざかや%' OR
    -- Restaurant
    LOWER(name) LIKE '%restaurant%' OR
    LOWER(name) LIKE '%レストラン%' OR
    LOWER(name) LIKE '%dining%' OR
    LOWER(name) LIKE '%diner%' OR
    LOWER(name) LIKE '%食堂%' OR
    -- Cafe
    LOWER(name) LIKE '%cafe%' OR
    LOWER(name) LIKE '%café%' OR
    LOWER(name) LIKE '%coffee%' OR
    LOWER(name) LIKE '%カフェ%' OR
    LOWER(name) LIKE '%コーヒー%' OR
    -- Bar
    LOWER(name) LIKE '%bar%' OR
    LOWER(name) LIKE '%pub%' OR
    LOWER(name) LIKE '%バー%' OR
    LOWER(name) LIKE '%パブ%' OR
    -- Food types
    LOWER(name) LIKE '%sushi%' OR
    LOWER(name) LIKE '%ramen%' OR
    LOWER(name) LIKE '%yakitori%' OR
    LOWER(name) LIKE '%tempura%' OR
    LOWER(name) LIKE '%寿司%' OR
    LOWER(name) LIKE '%ラーメン%' OR
    LOWER(name) LIKE '%焼き鳥%' OR
    LOWER(name) LIKE '%天ぷら%' OR
    LOWER(name) LIKE '%和食%' OR
    LOWER(name) LIKE '%洋食%' OR
    LOWER(name) LIKE '%中華%' OR
    -- Description matches
    LOWER(COALESCE(description, '')) LIKE '%restaurant%' OR
    LOWER(COALESCE(description, '')) LIKE '%izakaya%' OR
    LOWER(COALESCE(description, '')) LIKE '%dining%' OR
    LOWER(COALESCE(description, '')) LIKE '%cafe%' OR
    LOWER(COALESCE(description, '')) LIKE '%coffee%' OR
    LOWER(COALESCE(description, '')) LIKE '%bar%' OR
    LOWER(COALESCE(description, '')) LIKE '%レストラン%' OR
    LOWER(COALESCE(description, '')) LIKE '%居酒屋%' OR
    LOWER(COALESCE(description, '')) LIKE '%カフェ%'
  );

-- 2.5 CLINICS & MEDICAL CARE (specific - before general)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Clinics & Medical Care')
WHERE (category_id IS NULL OR category_id != (SELECT id FROM categories WHERE name = 'Clinics & Medical Care'))
  AND (
    -- Dental (very specific)
    LOWER(name) LIKE '%dental%' OR
    LOWER(name) LIKE '%dentist%' OR
    LOWER(name) LIKE '%歯科%' OR
    LOWER(name) LIKE '%歯医者%' OR
    LOWER(name) LIKE '%デンタル%' OR
    -- Aesthetic Clinic (specific)
    (LOWER(name) LIKE '%aesthetic%' OR LOWER(name) LIKE '%esthetic%' OR LOWER(name) LIKE '%美容外科%' OR LOWER(name) LIKE '%美容皮膚科%')
    AND (LOWER(name) LIKE '%clinic%' OR LOWER(name) LIKE '%クリニック%')
    OR
    -- Women's Clinic
    (LOWER(name) LIKE '%women%' OR LOWER(name) LIKE '%woman%' OR LOWER(name) LIKE '%婦人科%' OR LOWER(name) LIKE '%女性%')
    AND (LOWER(name) LIKE '%clinic%' OR LOWER(name) LIKE '%クリニック%')
    OR
    -- Medical Clinic
    LOWER(name) LIKE '%clinic%' OR
    LOWER(name) LIKE '%medical%' OR
    LOWER(name) LIKE '%hospital%' OR
    LOWER(name) LIKE '%クリニック%' OR
    LOWER(name) LIKE '%医院%' OR
    LOWER(name) LIKE '%病院%' OR
    -- Wellness Clinic
    (LOWER(name) LIKE '%wellness%' OR LOWER(name) LIKE '%健康%' OR LOWER(name) LIKE '%ヘルス%')
    AND (LOWER(name) LIKE '%clinic%' OR LOWER(name) LIKE '%クリニック%')
    OR
    -- Skin/Dermatology
    (LOWER(name) LIKE '%skin%' OR LOWER(name) LIKE '%dermatology%' OR LOWER(name) LIKE '%皮膚科%')
    AND (LOWER(name) LIKE '%clinic%' OR LOWER(name) LIKE '%クリニック%')
    OR
    -- Eye/Vision
    (LOWER(name) LIKE '%eye%' OR LOWER(name) LIKE '%vision%' OR LOWER(name) LIKE '%ophthalmology%' OR LOWER(name) LIKE '%眼科%')
    AND (LOWER(name) LIKE '%clinic%' OR LOWER(name) LIKE '%クリニック%')
    -- Description matches
    OR LOWER(COALESCE(description, '')) LIKE '%dental%' OR
    LOWER(COALESCE(description, '')) LIKE '%dentist%' OR
    LOWER(COALESCE(description, '')) LIKE '%clinic%' OR
    LOWER(COALESCE(description, '')) LIKE '%medical%' OR
    LOWER(COALESCE(description, '')) LIKE '%hospital%' OR
    LOWER(COALESCE(description, '')) LIKE '%クリニック%' OR
    LOWER(COALESCE(description, '')) LIKE '%医院%' OR
    LOWER(COALESCE(description, '')) LIKE '%病院%' OR
    LOWER(COALESCE(description, '')) LIKE '%歯科%'
  );

-- 2.6 ACTIVITIES & SPORTS
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Activities & Sports')
WHERE (category_id IS NULL OR category_id != (SELECT id FROM categories WHERE name = 'Activities & Sports'))
  AND (
    -- Golf (very specific)
    LOWER(name) LIKE '%golf%' OR
    LOWER(name) LIKE '%ゴルフ%' OR
    LOWER(name) LIKE '%ゴルフ場%' OR
    LOWER(name) LIKE '%ゴルフ練習場%' OR
    -- Sports/Fitness
    LOWER(name) LIKE '%sports%' OR
    LOWER(name) LIKE '%sport%' OR
    LOWER(name) LIKE '%fitness%' OR
    LOWER(name) LIKE '%gym%' OR
    LOWER(name) LIKE '%スポーツ%' OR
    LOWER(name) LIKE '%フィットネス%' OR
    LOWER(name) LIKE '%ジム%' OR
    -- Activities
    LOWER(name) LIKE '%activity%' OR
    LOWER(name) LIKE '%activities%' OR
    LOWER(name) LIKE '%recreation%' OR
    LOWER(name) LIKE '%アクティビティ%' OR
    LOWER(name) LIKE '%レクリエーション%' OR
    -- Specific sports
    LOWER(name) LIKE '%yoga%' OR
    LOWER(name) LIKE '%tennis%' OR
    LOWER(name) LIKE '%swimming%' OR
    LOWER(name) LIKE '%diving%' OR
    LOWER(name) LIKE '%skiing%' OR
    LOWER(name) LIKE '%snowboarding%' OR
    LOWER(name) LIKE '%martial arts%' OR
    LOWER(name) LIKE '%karate%' OR
    LOWER(name) LIKE '%judo%' OR
    LOWER(name) LIKE '%archery%' OR
    LOWER(name) LIKE '%cycling%' OR
    LOWER(name) LIKE '%テニス%' OR
    LOWER(name) LIKE '%スイミング%' OR
    LOWER(name) LIKE '%ダイビング%' OR
    LOWER(name) LIKE '%スキー%' OR
    LOWER(name) LIKE '%武道%' OR
    LOWER(name) LIKE '%空手%' OR
    LOWER(name) LIKE '%柔道%' OR
    -- Indoor/Outdoor
    (LOWER(name) LIKE '%indoor%' OR LOWER(name) LIKE '%outdoor%' OR LOWER(name) LIKE '%屋内%' OR LOWER(name) LIKE '%屋外%')
    AND (LOWER(name) LIKE '%sport%' OR LOWER(name) LIKE '%activity%' OR LOWER(name) LIKE '%スポーツ%' OR LOWER(name) LIKE '%アクティビティ%')
    -- Description matches
    OR LOWER(COALESCE(description, '')) LIKE '%golf%' OR
    LOWER(COALESCE(description, '')) LIKE '%sports%' OR
    LOWER(COALESCE(description, '')) LIKE '%fitness%' OR
    LOWER(COALESCE(description, '')) LIKE '%activity%' OR
    LOWER(COALESCE(description, '')) LIKE '%ゴルフ%' OR
    LOWER(COALESCE(description, '')) LIKE '%スポーツ%' OR
    LOWER(COALESCE(description, '')) LIKE '%アクティビティ%'
  );

-- 2.7 UNKNOWN (fallback for uncategorized shops)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Unknown')
WHERE category_id IS NULL;

-- ============================================================================
-- STEP 3: Summary Report
-- ============================================================================

-- Show classification results
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

