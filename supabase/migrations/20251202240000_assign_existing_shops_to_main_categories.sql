-- ============================================================================
-- ASSIGN EXISTING SHOPS TO MAIN CATEGORIES
-- ============================================================================
-- This migration ensures all existing shops are assigned to the correct
-- main categories based on their current category_id or subcategory field
-- ============================================================================

-- Step 1: Get all main category IDs
DO $$
DECLARE
    beauty_services_id UUID;
    spa_onsen_id UUID;
    hotels_stays_id UUID;
    dining_izakaya_id UUID;
    clinics_medical_id UUID;
    activities_sports_id UUID;
    unknown_id UUID;
    shops_updated INTEGER := 0;
BEGIN
    -- Get main category IDs
    SELECT id INTO beauty_services_id FROM categories WHERE name = 'Beauty Services';
    SELECT id INTO spa_onsen_id FROM categories WHERE name = 'Spa, Onsen & Relaxation';
    SELECT id INTO hotels_stays_id FROM categories WHERE name = 'Hotels & Stays';
    SELECT id INTO dining_izakaya_id FROM categories WHERE name = 'Dining & Izakaya';
    SELECT id INTO clinics_medical_id FROM categories WHERE name = 'Clinics & Medical Care';
    SELECT id INTO activities_sports_id FROM categories WHERE name = 'Activities & Sports';
    SELECT id INTO unknown_id FROM categories WHERE name = 'Unknown';

    -- Step 2: Reassign shops based on their subcategory field
    -- Beauty Services subcategories
    UPDATE shops
    SET category_id = beauty_services_id
    WHERE subcategory IN (
        'Hair Salon', 'Nail Salon', 'Eyelash / Eyebrow', 'Eyelash & Eyebrow', 'Eyelash', 'Eyebrow',
        'Beauty Salon', 'General Salon', 'Barbershop', 'Barber Shop', 'Waxing', 'Waxing Shop'
    )
    AND (category_id IS NULL OR category_id != beauty_services_id)
    AND beauty_services_id IS NOT NULL;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops to Beauty Services', shops_updated;

    -- Spa, Onsen & Relaxation subcategories
    UPDATE shops
    SET category_id = spa_onsen_id
    WHERE subcategory IN (
        'Spa', 'Spa & Massage', 'Massages', 'Massage',
        'Onsen', 'Ryokan Onsen', 'Onsen & Ryokan', 'Ryokan'
    )
    AND (category_id IS NULL OR category_id != spa_onsen_id)
    AND spa_onsen_id IS NOT NULL;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops to Spa, Onsen & Relaxation', shops_updated;

    -- Hotels & Stays subcategories
    UPDATE shops
    SET category_id = hotels_stays_id
    WHERE subcategory IN (
        'Hotel', 'Boutique Hotel', 'Guest House', 'Guesthouse',
        'Ryokan Stay', 'Hotels & Ryokan'
    )
    AND (category_id IS NULL OR category_id != hotels_stays_id)
    AND hotels_stays_id IS NOT NULL;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops to Hotels & Stays', shops_updated;

    -- Dining & Izakaya subcategories
    UPDATE shops
    SET category_id = dining_izakaya_id
    WHERE subcategory IN (
        'Restaurant', 'Restaurants & Izakaya', 'Izakaya', 'Izakaya & Bar',
        'Karaoke', 'Private Karaoke Rooms'
    )
    AND (category_id IS NULL OR category_id != dining_izakaya_id)
    AND dining_izakaya_id IS NOT NULL;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops to Dining & Izakaya', shops_updated;

    -- Clinics & Medical Care subcategories
    UPDATE shops
    SET category_id = clinics_medical_id
    WHERE subcategory IN (
        'Dental Clinic', 'Eye Clinic', 'Ophthalmology',
        'Women''s Clinic', 'Womens Clinic', 'Wellness Clinic',
        'Medical Clinic', 'Aesthetic Clinic'
    )
    AND (category_id IS NULL OR category_id != clinics_medical_id)
    AND clinics_medical_id IS NOT NULL;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops to Clinics & Medical Care', shops_updated;

    -- Activities & Sports subcategories
    UPDATE shops
    SET category_id = activities_sports_id
    WHERE subcategory IN (
        'Golf', 'Golf Course', 'Golf Practice Range', 'Golf Practice',
        'Golf Courses & Practice Ranges', 'Pilates', 'Yoga',
        'Sports', 'Sports Facility'
    )
    AND (category_id IS NULL OR category_id != activities_sports_id)
    AND activities_sports_id IS NOT NULL;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops to Activities & Sports', shops_updated;

    -- Step 3: Reassign shops based on their current category_id (if it points to a subcategory)
    -- This handles shops that are assigned to subcategory categories instead of main categories
    
    -- Beauty Services: Check if shop's category is a beauty subcategory
    UPDATE shops s
    SET category_id = beauty_services_id
    FROM categories c
    WHERE s.category_id = c.id
    AND c.name IN (
        'Hair Salon', 'Nail Salon', 'Eyelash / Eyebrow', 'Eyelash & Eyebrow', 'Eyelash', 'Eyebrow',
        'Beauty Salon', 'General Salon', 'Barbershop', 'Barber Shop', 'Waxing', 'Waxing Shop'
    )
    AND beauty_services_id IS NOT NULL
    AND s.category_id != beauty_services_id;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops from beauty subcategories to Beauty Services', shops_updated;

    -- Spa, Onsen & Relaxation: Check if shop's category is a spa subcategory
    UPDATE shops s
    SET category_id = spa_onsen_id
    FROM categories c
    WHERE s.category_id = c.id
    AND c.name IN (
        'Spa', 'Spa & Massage', 'Massages', 'Massage',
        'Onsen', 'Ryokan Onsen', 'Onsen & Ryokan', 'Ryokan'
    )
    AND spa_onsen_id IS NOT NULL
    AND s.category_id != spa_onsen_id;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops from spa subcategories to Spa, Onsen & Relaxation', shops_updated;

    -- Hotels & Stays: Check if shop's category is a hotel subcategory
    UPDATE shops s
    SET category_id = hotels_stays_id
    FROM categories c
    WHERE s.category_id = c.id
    AND c.name IN (
        'Hotel', 'Boutique Hotel', 'Guest House', 'Guesthouse',
        'Ryokan Stay', 'Hotels & Ryokan'
    )
    AND hotels_stays_id IS NOT NULL
    AND s.category_id != hotels_stays_id;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops from hotel subcategories to Hotels & Stays', shops_updated;

    -- Dining & Izakaya: Check if shop's category is a dining subcategory
    UPDATE shops s
    SET category_id = dining_izakaya_id
    FROM categories c
    WHERE s.category_id = c.id
    AND c.name IN (
        'Restaurant', 'Restaurants & Izakaya', 'Izakaya', 'Izakaya & Bar',
        'Karaoke', 'Private Karaoke Rooms'
    )
    AND dining_izakaya_id IS NOT NULL
    AND s.category_id != dining_izakaya_id;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops from dining subcategories to Dining & Izakaya', shops_updated;

    -- Clinics & Medical Care: Check if shop's category is a clinic subcategory
    UPDATE shops s
    SET category_id = clinics_medical_id
    FROM categories c
    WHERE s.category_id = c.id
    AND c.name IN (
        'Dental Clinic', 'Eye Clinic', 'Ophthalmology',
        'Women''s Clinic', 'Womens Clinic', 'Wellness Clinic',
        'Medical Clinic', 'Aesthetic Clinic'
    )
    AND clinics_medical_id IS NOT NULL
    AND s.category_id != clinics_medical_id;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops from clinic subcategories to Clinics & Medical Care', shops_updated;

    -- Activities & Sports: Check if shop's category is a sports subcategory
    UPDATE shops s
    SET category_id = activities_sports_id
    FROM categories c
    WHERE s.category_id = c.id
    AND c.name IN (
        'Golf', 'Golf Course', 'Golf Practice Range', 'Golf Practice',
        'Golf Courses & Practice Ranges', 'Pilates', 'Yoga',
        'Sports', 'Sports Facility'
    )
    AND activities_sports_id IS NOT NULL
    AND s.category_id != activities_sports_id;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops from sports subcategories to Activities & Sports', shops_updated;

    -- Step 4: Assign NULL category_id shops to Unknown
    UPDATE shops
    SET category_id = unknown_id
    WHERE category_id IS NULL
    AND unknown_id IS NOT NULL;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops with NULL category_id to Unknown', shops_updated;

    -- Step 5: Assign shops with invalid category_id (pointing to deleted categories) to Unknown
    UPDATE shops s
    SET category_id = unknown_id
    WHERE s.category_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM categories c WHERE c.id = s.category_id
    )
    AND unknown_id IS NOT NULL;
    
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % shops with invalid category_id to Unknown', shops_updated;

END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show category distribution
SELECT 
    c.name AS category_name,
    COUNT(s.id) AS shop_count,
    ROUND(COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM shops WHERE category_id IS NOT NULL), 2) AS percentage
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

-- Show shops with NULL category_id (should be 0 after migration)
SELECT COUNT(*) AS shops_with_null_category
FROM shops
WHERE category_id IS NULL;

-- Show shops with invalid category_id (should be 0 after migration)
SELECT COUNT(*) AS shops_with_invalid_category
FROM shops s
WHERE s.category_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM categories c WHERE c.id = s.category_id
);

