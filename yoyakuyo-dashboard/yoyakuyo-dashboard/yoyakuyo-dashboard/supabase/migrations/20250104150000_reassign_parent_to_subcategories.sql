-- ============================================================================
-- REASSIGN SHOPS FROM PARENT CATEGORIES TO SUBCATEGORIES
-- ============================================================================
-- This migration reassigns shops from parent categories to their specific
-- subcategories based on the subcategory field or category name matching
-- ============================================================================

DO $$
DECLARE
    shops_updated INTEGER := 0;
    total_updated INTEGER := 0;
    shop_record RECORD;
    target_category_id UUID;
BEGIN
    RAISE NOTICE '=== STARTING: Reassigning shops from parent to subcategories ===';
    
    -- ============================================================================
    -- STEP 1: Reassign shops from "Beauty Services" to specific subcategories
    -- ============================================================================
    RAISE NOTICE 'Step 1: Reassigning Beauty Services shops...';
    
    -- Hair Salon
    SELECT id INTO target_category_id FROM categories WHERE name = 'Hair Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
        AND subcategory = 'Hair Salon'
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Hair Salon', shops_updated;
    END IF;
    
    -- Nail Salon
    SELECT id INTO target_category_id FROM categories WHERE name = 'Nail Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
        AND subcategory = 'Nail Salon'
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Nail Salon', shops_updated;
    END IF;
    
    -- Beauty Salon
    SELECT id INTO target_category_id FROM categories WHERE name = 'Beauty Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
        AND subcategory = 'Beauty Salon'
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Beauty Salon', shops_updated;
    END IF;
    
    -- Barbershop
    SELECT id INTO target_category_id FROM categories WHERE name = 'Barbershop';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
        AND subcategory IN ('Barbershop', 'Barber Shop')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Barbershop', shops_updated;
    END IF;
    
    -- Eyelash / Eyebrow
    SELECT id INTO target_category_id FROM categories WHERE name = 'Eyelash / Eyebrow';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
        AND subcategory IN ('Eyelash / Eyebrow', 'Eyelash & Eyebrow', 'Eyelash', 'Eyebrow')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Eyelash / Eyebrow', shops_updated;
    END IF;
    
    -- General Salon
    SELECT id INTO target_category_id FROM categories WHERE name = 'General Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
        AND subcategory = 'General Salon'
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to General Salon', shops_updated;
    END IF;
    
    -- Waxing
    SELECT id INTO target_category_id FROM categories WHERE name = 'Waxing';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
        AND subcategory IN ('Waxing', 'Waxing Shop')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Waxing', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 2: Reassign shops from "Dining & Izakaya" to specific subcategories
    -- ============================================================================
    RAISE NOTICE 'Step 2: Reassigning Dining & Izakaya shops...';
    
    -- Restaurant
    SELECT id INTO target_category_id FROM categories WHERE name = 'Restaurant';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Dining & Izakaya')
        AND subcategory IN ('Restaurant', 'Restaurants & Izakaya')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Restaurant', shops_updated;
    END IF;
    
    -- Izakaya
    SELECT id INTO target_category_id FROM categories WHERE name = 'Izakaya';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Dining & Izakaya')
        AND subcategory IN ('Izakaya', 'Izakaya & Bar')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Izakaya', shops_updated;
    END IF;
    
    -- Karaoke
    SELECT id INTO target_category_id FROM categories WHERE name = 'Karaoke';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Dining & Izakaya')
        AND subcategory IN ('Karaoke', 'Private Karaoke Rooms')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Karaoke', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 3: Reassign shops from "Hotels & Stays" to specific subcategories
    -- ============================================================================
    RAISE NOTICE 'Step 3: Reassigning Hotels & Stays shops...';
    
    -- Hotel
    SELECT id INTO target_category_id FROM categories WHERE name = 'Hotel';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Hotels & Stays')
        AND subcategory = 'Hotel'
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Hotel', shops_updated;
    END IF;
    
    -- Boutique Hotel
    SELECT id INTO target_category_id FROM categories WHERE name = 'Boutique Hotel';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Hotels & Stays')
        AND subcategory = 'Boutique Hotel'
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Boutique Hotel', shops_updated;
    END IF;
    
    -- Guest House
    SELECT id INTO target_category_id FROM categories WHERE name = 'Guest House';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Hotels & Stays')
        AND subcategory IN ('Guest House', 'Guesthouse')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Guest House', shops_updated;
    END IF;
    
    -- Ryokan Stay
    SELECT id INTO target_category_id FROM categories WHERE name = 'Ryokan Stay';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Hotels & Stays')
        AND subcategory = 'Ryokan Stay'
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Ryokan Stay', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 4: Reassign shops from "Spa, Onsen & Relaxation" to specific subcategories
    -- ============================================================================
    RAISE NOTICE 'Step 4: Reassigning Spa, Onsen & Relaxation shops...';
    
    -- Spa
    SELECT id INTO target_category_id FROM categories WHERE name = 'Spa';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Spa, Onsen & Relaxation')
        AND subcategory IN ('Spa', 'Spa & Massage')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Spa', shops_updated;
    END IF;
    
    -- Massages
    SELECT id INTO target_category_id FROM categories WHERE name = 'Massages';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Spa, Onsen & Relaxation')
        AND subcategory IN ('Massages', 'Massage')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Massages', shops_updated;
    END IF;
    
    -- Onsen
    SELECT id INTO target_category_id FROM categories WHERE name = 'Onsen';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Spa, Onsen & Relaxation')
        AND subcategory = 'Onsen'
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Onsen', shops_updated;
    END IF;
    
    -- Ryokan Onsen
    SELECT id INTO target_category_id FROM categories WHERE name = 'Ryokan Onsen';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Spa, Onsen & Relaxation')
        AND subcategory IN ('Ryokan Onsen', 'Onsen & Ryokan')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Ryokan Onsen', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 5: Reassign shops from "Clinics & Medical Care" to specific subcategories
    -- ============================================================================
    RAISE NOTICE 'Step 5: Reassigning Clinics & Medical Care shops...';
    
    -- Dental Clinic
    SELECT id INTO target_category_id FROM categories WHERE name = 'Dental Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Clinics & Medical Care')
        AND subcategory = 'Dental Clinic'
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Dental Clinic', shops_updated;
    END IF;
    
    -- Eye Clinic
    SELECT id INTO target_category_id FROM categories WHERE name = 'Eye Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Clinics & Medical Care')
        AND subcategory IN ('Eye Clinic', 'Ophthalmology')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Eye Clinic', shops_updated;
    END IF;
    
    -- Women's Clinic
    SELECT id INTO target_category_id FROM categories WHERE name = 'Women''s Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Clinics & Medical Care')
        AND subcategory IN ('Women''s Clinic', 'Womens Clinic')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Women''s Clinic', shops_updated;
    END IF;
    
    -- Wellness Clinic
    SELECT id INTO target_category_id FROM categories WHERE name = 'Wellness Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Clinics & Medical Care')
        AND subcategory = 'Wellness Clinic'
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Wellness Clinic', shops_updated;
    END IF;
    
    -- Aesthetic Clinic
    SELECT id INTO target_category_id FROM categories WHERE name = 'Aesthetic Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Clinics & Medical Care')
        AND subcategory IN ('Aesthetic Clinic', 'Aesthetic')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Aesthetic Clinic', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 6: Reassign shops from "Activities & Sports" to specific subcategories
    -- ============================================================================
    RAISE NOTICE 'Step 6: Reassigning Activities & Sports shops...';
    
    -- Golf
    SELECT id INTO target_category_id FROM categories WHERE name = 'Golf';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Activities & Sports')
        AND subcategory IN ('Golf', 'Golf Course', 'Golf Courses & Practice Ranges')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Golf', shops_updated;
    END IF;
    
    -- Golf Practice Range
    SELECT id INTO target_category_id FROM categories WHERE name = 'Golf Practice Range';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Activities & Sports')
        AND subcategory IN ('Golf Practice Range', 'Golf Practice')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Golf Practice Range', shops_updated;
    END IF;
    
    -- Pilates
    SELECT id INTO target_category_id FROM categories WHERE name = 'Pilates';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Activities & Sports')
        AND subcategory = 'Pilates'
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Pilates', shops_updated;
    END IF;
    
    -- Yoga
    SELECT id INTO target_category_id FROM categories WHERE name = 'Yoga';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Activities & Sports')
        AND subcategory = 'Yoga'
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Yoga', shops_updated;
    END IF;
    
    RAISE NOTICE '=== COMPLETED: Total shops reassigned: % ===', total_updated;
END $$;

-- ============================================================================
-- VERIFICATION: Show remaining shops in parent categories (should be 0 or very low)
-- ============================================================================
SELECT 
    'Remaining Shops in Parent Categories' AS report_type,
    c.name AS parent_category,
    COUNT(*) AS shop_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - No shops in parent category'
        WHEN COUNT(*) < 10 THEN '⚠️ WARNING - Few shops remain'
        ELSE '❌ FAIL - Many shops still in parent category'
    END AS status
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name IN (
    'Beauty Services',
    'Dining & Izakaya',
    'Hotels & Stays',
    'Spa, Onsen & Relaxation',
    'Clinics & Medical Care',
    'Activities & Sports'
)
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
GROUP BY c.name
ORDER BY shop_count DESC;

-- ============================================================================
-- VERIFICATION: Final category distribution
-- ============================================================================
SELECT 
    'Final Category Distribution' AS report_type,
    c.name AS category_name,
    COUNT(s.id) AS shop_count,
    COUNT(s.id) * 100.0 / NULLIF((
        SELECT COUNT(*) FROM shops 
        WHERE (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR deleted_at IS NULL
        )
        AND address IS NOT NULL 
        AND address != ''
    ), 0) AS percentage
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
    AND (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'deleted_at'
        )
        OR s.deleted_at IS NULL
    )
    AND s.address IS NOT NULL 
    AND s.address != ''
GROUP BY c.id, c.name
HAVING COUNT(s.id) > 0
ORDER BY shop_count DESC;

