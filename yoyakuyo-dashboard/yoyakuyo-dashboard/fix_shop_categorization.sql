-- ============================================================================
-- FIX SHOP CATEGORIZATION
-- ============================================================================
-- This script:
-- 1. Reassigns shops from main categories to subcategories
-- 2. Attempts to categorize "Unknown" shops based on their subcategory field or name
-- ============================================================================

-- ============================================================================
-- STEP 1: Reassign shops from main categories to subcategories
-- ============================================================================
-- These shops are currently in main categories but should be in subcategories
-- We'll use their subcategory field if available, or infer from shop name

DO $$
DECLARE
    shops_updated INTEGER := 0;
BEGIN
    -- BEAUTY SERVICES -> Subcategories
    -- If shop has subcategory field, use it; otherwise infer from name
    UPDATE shops s
    SET category_id = (
        CASE 
            WHEN s.subcategory = 'Hair Salon' THEN (SELECT id FROM categories WHERE name = 'Hair Salon')
            WHEN s.subcategory = 'Nail Salon' THEN (SELECT id FROM categories WHERE name = 'Nail Salon')
            WHEN s.subcategory IN ('Eyelash / Eyebrow', 'Eyelash & Eyebrow', 'Eyelash', 'Eyebrow') THEN (SELECT id FROM categories WHERE name = 'Eyelash / Eyebrow')
            WHEN s.subcategory = 'Beauty Salon' THEN (SELECT id FROM categories WHERE name = 'Beauty Salon')
            WHEN s.subcategory = 'General Salon' THEN (SELECT id FROM categories WHERE name = 'General Salon')
            WHEN s.subcategory IN ('Barbershop', 'Barber Shop') THEN (SELECT id FROM categories WHERE name = 'Barbershop')
            WHEN s.subcategory IN ('Waxing', 'Waxing Shop') THEN (SELECT id FROM categories WHERE name = 'Waxing')
            -- Infer from name if subcategory is NULL
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%hair%' OR LOWER(s.name) LIKE '%salon%') THEN (SELECT id FROM categories WHERE name = 'Hair Salon')
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%nail%' OR LOWER(s.name) LIKE '%manicure%') THEN (SELECT id FROM categories WHERE name = 'Nail Salon')
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%barber%') THEN (SELECT id FROM categories WHERE name = 'Barbershop')
            ELSE (SELECT id FROM categories WHERE name = 'Beauty Salon') -- Default fallback
        END
    )
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
    AND (
        s.subcategory IS NOT NULL 
        OR LOWER(s.name) LIKE '%hair%' 
        OR LOWER(s.name) LIKE '%salon%' 
        OR LOWER(s.name) LIKE '%nail%' 
        OR LOWER(s.name) LIKE '%barber%'
    );
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Reassigned % shops from Beauty Services to subcategories', shops_updated;

    -- DINING & IZAKAYA -> Subcategories
    UPDATE shops s
    SET category_id = (
        CASE 
            WHEN s.subcategory IN ('Restaurant', 'Restaurants & Izakaya') THEN (SELECT id FROM categories WHERE name = 'Restaurant')
            WHEN s.subcategory IN ('Izakaya', 'Izakaya & Bar') THEN (SELECT id FROM categories WHERE name = 'Izakaya')
            WHEN s.subcategory IN ('Karaoke', 'Private Karaoke Rooms') THEN (SELECT id FROM categories WHERE name = 'Karaoke')
            -- Infer from name
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%restaurant%' OR LOWER(s.name) LIKE '%dining%' OR LOWER(s.name) LIKE '%cafe%') THEN (SELECT id FROM categories WHERE name = 'Restaurant')
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%izakaya%' OR LOWER(s.name) LIKE '%居酒屋%') THEN (SELECT id FROM categories WHERE name = 'Izakaya')
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%karaoke%' OR LOWER(s.name) LIKE '%カラオケ%') THEN (SELECT id FROM categories WHERE name = 'Karaoke')
            ELSE (SELECT id FROM categories WHERE name = 'Restaurant') -- Default fallback
        END
    )
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Dining & Izakaya')
    AND (
        s.subcategory IS NOT NULL 
        OR LOWER(s.name) LIKE '%restaurant%' 
        OR LOWER(s.name) LIKE '%izakaya%' 
        OR LOWER(s.name) LIKE '%cafe%'
        OR LOWER(s.name) LIKE '%karaoke%'
    );
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Reassigned % shops from Dining & Izakaya to subcategories', shops_updated;

    -- CLINICS & MEDICAL CARE -> Subcategories
    UPDATE shops s
    SET category_id = (
        CASE 
            WHEN s.subcategory = 'Dental Clinic' THEN (SELECT id FROM categories WHERE name = 'Dental Clinic')
            WHEN s.subcategory IN ('Eye Clinic', 'Ophthalmology') THEN (SELECT id FROM categories WHERE name = 'Eye Clinic')
            WHEN s.subcategory IN ('Women''s Clinic', 'Womens Clinic') THEN (SELECT id FROM categories WHERE name = 'Women''s Clinic')
            WHEN s.subcategory = 'Wellness Clinic' THEN (SELECT id FROM categories WHERE name = 'Wellness Clinic')
            -- Infer from name
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%dental%' OR LOWER(s.name) LIKE '%歯科%') THEN (SELECT id FROM categories WHERE name = 'Dental Clinic')
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%eye%' OR LOWER(s.name) LIKE '%眼科%') THEN (SELECT id FROM categories WHERE name = 'Eye Clinic')
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%women%' OR LOWER(s.name) LIKE '%女性%') THEN (SELECT id FROM categories WHERE name = 'Women''s Clinic')
            ELSE (SELECT id FROM categories WHERE name = 'Dental Clinic') -- Default fallback
        END
    )
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Clinics & Medical Care')
    AND (
        s.subcategory IS NOT NULL 
        OR LOWER(s.name) LIKE '%clinic%' 
        OR LOWER(s.name) LIKE '%dental%' 
        OR LOWER(s.name) LIKE '%eye%'
    );
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Reassigned % shops from Clinics & Medical Care to subcategories', shops_updated;

    -- HOTELS & STAYS -> Subcategories
    UPDATE shops s
    SET category_id = (
        CASE 
            WHEN s.subcategory = 'Hotel' THEN (SELECT id FROM categories WHERE name = 'Hotel')
            WHEN s.subcategory = 'Boutique Hotel' THEN (SELECT id FROM categories WHERE name = 'Boutique Hotel')
            WHEN s.subcategory IN ('Guest House', 'Guesthouse') THEN (SELECT id FROM categories WHERE name = 'Guest House')
            WHEN s.subcategory = 'Ryokan Stay' THEN (SELECT id FROM categories WHERE name = 'Ryokan Stay')
            -- Infer from name
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%hotel%' OR LOWER(s.name) LIKE '%ホテル%') THEN (SELECT id FROM categories WHERE name = 'Hotel')
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%ryokan%' OR LOWER(s.name) LIKE '%旅館%') THEN (SELECT id FROM categories WHERE name = 'Ryokan Stay')
            ELSE (SELECT id FROM categories WHERE name = 'Hotel') -- Default fallback
        END
    )
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Hotels & Stays')
    AND (
        s.subcategory IS NOT NULL 
        OR LOWER(s.name) LIKE '%hotel%' 
        OR LOWER(s.name) LIKE '%ryokan%'
    );
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Reassigned % shops from Hotels & Stays to subcategories', shops_updated;

    -- SPA, ONSEN & RELAXATION -> Subcategories
    UPDATE shops s
    SET category_id = (
        CASE 
            WHEN s.subcategory IN ('Spa', 'Spa & Massage') THEN (SELECT id FROM categories WHERE name = 'Spa')
            WHEN s.subcategory IN ('Massages', 'Massage') THEN (SELECT id FROM categories WHERE name = 'Massages')
            WHEN s.subcategory = 'Onsen' THEN (SELECT id FROM categories WHERE name = 'Onsen')
            WHEN s.subcategory IN ('Ryokan Onsen', 'Onsen & Ryokan') THEN (SELECT id FROM categories WHERE name = 'Ryokan Onsen')
            -- Infer from name
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%spa%' OR LOWER(s.name) LIKE '%スパ%') THEN (SELECT id FROM categories WHERE name = 'Spa')
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%massage%' OR LOWER(s.name) LIKE '%マッサージ%') THEN (SELECT id FROM categories WHERE name = 'Massages')
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%onsen%' OR LOWER(s.name) LIKE '%温泉%') THEN (SELECT id FROM categories WHERE name = 'Onsen')
            ELSE (SELECT id FROM categories WHERE name = 'Spa') -- Default fallback
        END
    )
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Spa, Onsen & Relaxation')
    AND (
        s.subcategory IS NOT NULL 
        OR LOWER(s.name) LIKE '%spa%' 
        OR LOWER(s.name) LIKE '%massage%' 
        OR LOWER(s.name) LIKE '%onsen%'
    );
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Reassigned % shops from Spa, Onsen & Relaxation to subcategories', shops_updated;

    -- ACTIVITIES & SPORTS -> Subcategories
    UPDATE shops s
    SET category_id = (
        CASE 
            WHEN s.subcategory IN ('Golf', 'Golf Course', 'Golf Courses & Practice Ranges') THEN (SELECT id FROM categories WHERE name = 'Golf')
            WHEN s.subcategory IN ('Golf Practice Range', 'Golf Practice') THEN (SELECT id FROM categories WHERE name = 'Golf Practice Range')
            WHEN s.subcategory = 'Pilates' THEN (SELECT id FROM categories WHERE name = 'Pilates')
            WHEN s.subcategory = 'Yoga' THEN (SELECT id FROM categories WHERE name = 'Yoga')
            -- Infer from name
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%golf%' OR LOWER(s.name) LIKE '%ゴルフ%') THEN (SELECT id FROM categories WHERE name = 'Golf')
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%pilates%') THEN (SELECT id FROM categories WHERE name = 'Pilates')
            WHEN s.subcategory IS NULL AND (LOWER(s.name) LIKE '%yoga%') THEN (SELECT id FROM categories WHERE name = 'Yoga')
            ELSE (SELECT id FROM categories WHERE name = 'Golf') -- Default fallback
        END
    )
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Activities & Sports')
    AND (
        s.subcategory IS NOT NULL 
        OR LOWER(s.name) LIKE '%golf%' 
        OR LOWER(s.name) LIKE '%pilates%' 
        OR LOWER(s.name) LIKE '%yoga%'
    );
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Reassigned % shops from Activities & Sports to subcategories', shops_updated;

END $$;

-- ============================================================================
-- STEP 2: Categorize "Unknown" shops based on subcategory field or name
-- ============================================================================
DO $$
DECLARE
    shops_updated INTEGER := 0;
BEGIN
    -- Use subcategory field if available
    UPDATE shops s
    SET category_id = (
        CASE 
            -- Beauty Services subcategories
            WHEN s.subcategory = 'Hair Salon' THEN (SELECT id FROM categories WHERE name = 'Hair Salon')
            WHEN s.subcategory = 'Nail Salon' THEN (SELECT id FROM categories WHERE name = 'Nail Salon')
            WHEN s.subcategory IN ('Eyelash / Eyebrow', 'Eyelash & Eyebrow', 'Eyelash', 'Eyebrow') THEN (SELECT id FROM categories WHERE name = 'Eyelash / Eyebrow')
            WHEN s.subcategory = 'Beauty Salon' THEN (SELECT id FROM categories WHERE name = 'Beauty Salon')
            WHEN s.subcategory = 'General Salon' THEN (SELECT id FROM categories WHERE name = 'General Salon')
            WHEN s.subcategory IN ('Barbershop', 'Barber Shop') THEN (SELECT id FROM categories WHERE name = 'Barbershop')
            WHEN s.subcategory IN ('Waxing', 'Waxing Shop') THEN (SELECT id FROM categories WHERE name = 'Waxing')
            -- Spa subcategories
            WHEN s.subcategory IN ('Spa', 'Spa & Massage') THEN (SELECT id FROM categories WHERE name = 'Spa')
            WHEN s.subcategory IN ('Massages', 'Massage') THEN (SELECT id FROM categories WHERE name = 'Massages')
            WHEN s.subcategory = 'Onsen' THEN (SELECT id FROM categories WHERE name = 'Onsen')
            WHEN s.subcategory IN ('Ryokan Onsen', 'Onsen & Ryokan') THEN (SELECT id FROM categories WHERE name = 'Ryokan Onsen')
            -- Hotels subcategories
            WHEN s.subcategory = 'Hotel' THEN (SELECT id FROM categories WHERE name = 'Hotel')
            WHEN s.subcategory = 'Boutique Hotel' THEN (SELECT id FROM categories WHERE name = 'Boutique Hotel')
            WHEN s.subcategory IN ('Guest House', 'Guesthouse') THEN (SELECT id FROM categories WHERE name = 'Guest House')
            WHEN s.subcategory = 'Ryokan Stay' THEN (SELECT id FROM categories WHERE name = 'Ryokan Stay')
            -- Dining subcategories
            WHEN s.subcategory IN ('Restaurant', 'Restaurants & Izakaya') THEN (SELECT id FROM categories WHERE name = 'Restaurant')
            WHEN s.subcategory IN ('Izakaya', 'Izakaya & Bar') THEN (SELECT id FROM categories WHERE name = 'Izakaya')
            WHEN s.subcategory IN ('Karaoke', 'Private Karaoke Rooms') THEN (SELECT id FROM categories WHERE name = 'Karaoke')
            -- Clinics subcategories
            WHEN s.subcategory = 'Dental Clinic' THEN (SELECT id FROM categories WHERE name = 'Dental Clinic')
            WHEN s.subcategory IN ('Eye Clinic', 'Ophthalmology') THEN (SELECT id FROM categories WHERE name = 'Eye Clinic')
            WHEN s.subcategory IN ('Women''s Clinic', 'Womens Clinic') THEN (SELECT id FROM categories WHERE name = 'Women''s Clinic')
            WHEN s.subcategory = 'Wellness Clinic' THEN (SELECT id FROM categories WHERE name = 'Wellness Clinic')
            -- Activities subcategories
            WHEN s.subcategory IN ('Golf', 'Golf Course', 'Golf Courses & Practice Ranges') THEN (SELECT id FROM categories WHERE name = 'Golf')
            WHEN s.subcategory IN ('Golf Practice Range', 'Golf Practice') THEN (SELECT id FROM categories WHERE name = 'Golf Practice Range')
            WHEN s.subcategory = 'Pilates' THEN (SELECT id FROM categories WHERE name = 'Pilates')
            WHEN s.subcategory = 'Yoga' THEN (SELECT id FROM categories WHERE name = 'Yoga')
            ELSE NULL
        END
    )
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NOT NULL
    AND s.subcategory != '';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops using subcategory field', shops_updated;

    -- If subcategory is NULL, try to infer from shop name
    -- Beauty Services
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Hair Salon')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (LOWER(s.name) LIKE '%hair%' OR LOWER(s.name) LIKE '%salon%' OR LOWER(s.name) LIKE '%ヘア%' OR LOWER(s.name) LIKE '%サロン%')
    AND NOT (LOWER(s.name) LIKE '%nail%' OR LOWER(s.name) LIKE '%barber%');
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Hair Salon (from name)', shops_updated;

    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Nail Salon')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (LOWER(s.name) LIKE '%nail%' OR LOWER(s.name) LIKE '%manicure%' OR LOWER(s.name) LIKE '%ネイル%');
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Nail Salon (from name)', shops_updated;

    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Barbershop')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (LOWER(s.name) LIKE '%barber%' OR LOWER(s.name) LIKE '%理容%');
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Barbershop (from name)', shops_updated;

    -- Restaurants (most common)
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Restaurant')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (
        LOWER(s.name) LIKE '%restaurant%' 
        OR LOWER(s.name) LIKE '%dining%' 
        OR LOWER(s.name) LIKE '%cafe%'
        OR LOWER(s.name) LIKE '%レストラン%'
        OR LOWER(s.name) LIKE '%カフェ%'
        OR LOWER(s.name) LIKE '%食堂%'
    );
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Restaurant (from name)', shops_updated;

    -- Dental Clinics
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Dental Clinic')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (LOWER(s.name) LIKE '%dental%' OR LOWER(s.name) LIKE '%歯科%' OR LOWER(s.name) LIKE '%歯医者%');
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Dental Clinic (from name)', shops_updated;

    -- Hotels
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Hotel')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (LOWER(s.name) LIKE '%hotel%' OR LOWER(s.name) LIKE '%ホテル%');
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Hotel (from name)', shops_updated;

    -- Spas
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Spa')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (LOWER(s.name) LIKE '%spa%' OR LOWER(s.name) LIKE '%スパ%');
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Spa (from name)', shops_updated;

    -- Onsen
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Onsen')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (LOWER(s.name) LIKE '%onsen%' OR LOWER(s.name) LIKE '%温泉%');
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Onsen (from name)', shops_updated;

END $$;

-- ============================================================================
-- VERIFICATION: Check results
-- ============================================================================
-- Show remaining shops in main categories (should be 0 or very few)
SELECT 
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

-- Show remaining Unknown shops
SELECT 
  COUNT(*) as unknown_shops_count
FROM shops s
WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown');

-- Show top subcategories after fix
SELECT 
  c.name as subcategory,
  COUNT(s.id) as shop_count
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

