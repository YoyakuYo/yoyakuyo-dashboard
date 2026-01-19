-- ============================================================================
-- CATEGORIZE UNKNOWN SHOPS BY SUBCATEGORY - ENHANCED APPROACH
-- ============================================================================
-- This migration uses the subcategory field to categorize Unknown shops
-- since all Unknown shops have subcategory values assigned
-- ============================================================================

DO $$
DECLARE
    shops_updated INTEGER := 0;
    total_updated INTEGER := 0;
    target_category_id UUID;
    unknown_category_id UUID;
BEGIN
    RAISE NOTICE '=== STARTING: Categorizing Unknown shops by subcategory ===';
    
    -- Get Unknown category ID
    SELECT id INTO unknown_category_id FROM categories WHERE name = 'Unknown';
    
    IF unknown_category_id IS NULL THEN
        RAISE NOTICE 'Unknown category not found, skipping...';
        RETURN;
    END IF;
    
    -- ============================================================================
    -- STEP 1: Map subcategory values to categories
    -- ============================================================================
    
    -- Hair Salon
    SELECT id INTO target_category_id FROM categories WHERE name = 'Hair Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
        AND subcategory IN ('Hair Salon', 'Hair', 'Salon')
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
        WHERE category_id = unknown_category_id
        AND subcategory IN ('Nail Salon', 'Nail', 'Manicure', 'Pedicure')
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
    
    -- Restaurant
    SELECT id INTO target_category_id FROM categories WHERE name = 'Restaurant';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
        AND subcategory IN ('Restaurant', 'Restaurants', 'Restaurants & Izakaya', 'Cafe', 'Coffee', 'Dining')
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
    
    -- Hotel
    SELECT id INTO target_category_id FROM categories WHERE name = 'Hotel';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
        AND subcategory IN ('Hotel', 'Hotels', 'Inn', 'Ryokan', 'Accommodation')
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
    
    -- Dental Clinic
    SELECT id INTO target_category_id FROM categories WHERE name = 'Dental Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
        AND subcategory IN ('Dental Clinic', 'Dental', 'Dentist', '歯科')
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
        WHERE category_id = unknown_category_id
        AND subcategory IN ('Eye Clinic', 'Eye', 'Ophthalmology', '眼科')
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
    
    -- Onsen
    SELECT id INTO target_category_id FROM categories WHERE name = 'Onsen';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
        AND subcategory IN ('Onsen', 'Hot Spring', '温泉')
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
    
    -- Spa
    SELECT id INTO target_category_id FROM categories WHERE name = 'Spa';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
        AND subcategory IN ('Spa', 'Spa & Massage', 'Massage', 'Massages', 'Relaxation')
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
    
    -- Barbershop
    SELECT id INTO target_category_id FROM categories WHERE name = 'Barbershop';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
        AND subcategory IN ('Barbershop', 'Barber Shop', 'Barber')
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
    
    -- Golf
    SELECT id INTO target_category_id FROM categories WHERE name = 'Golf';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
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
    
    -- Izakaya
    SELECT id INTO target_category_id FROM categories WHERE name = 'Izakaya';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
        AND subcategory IN ('Izakaya', 'Izakaya & Bar', 'Bar', 'Pub')
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
        WHERE category_id = unknown_category_id
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
    
    -- Beauty Salon
    SELECT id INTO target_category_id FROM categories WHERE name = 'Beauty Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
        AND subcategory IN ('Beauty Salon', 'Beauty', 'Cosmetic', 'Aesthetic')
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
    
    -- Eyelash / Eyebrow
    SELECT id INTO target_category_id FROM categories WHERE name = 'Eyelash / Eyebrow';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
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
        WHERE category_id = unknown_category_id
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
    
    -- Women's Clinic
    SELECT id INTO target_category_id FROM categories WHERE name = 'Women''s Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
        AND subcategory IN ('Women''s Clinic', 'Womens Clinic', 'Women Clinic')
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
        WHERE category_id = unknown_category_id
        AND subcategory IN ('Wellness Clinic', 'Wellness')
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
        WHERE category_id = unknown_category_id
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
    
    -- Boutique Hotel
    SELECT id INTO target_category_id FROM categories WHERE name = 'Boutique Hotel';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
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
        WHERE category_id = unknown_category_id
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
        WHERE category_id = unknown_category_id
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
    
    -- Ryokan Onsen
    SELECT id INTO target_category_id FROM categories WHERE name = 'Ryokan Onsen';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
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
    
    -- Golf Practice Range
    SELECT id INTO target_category_id FROM categories WHERE name = 'Golf Practice Range';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
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
        WHERE category_id = unknown_category_id
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
        WHERE category_id = unknown_category_id
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
    
    -- Waxing
    SELECT id INTO target_category_id FROM categories WHERE name = 'Waxing';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id
        WHERE category_id = unknown_category_id
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
    
    RAISE NOTICE '=== COMPLETED: Total Unknown shops categorized: % ===', total_updated;
END $$;

-- ============================================================================
-- VERIFICATION: Show unique subcategory values in Unknown shops
-- ============================================================================
SELECT 
    'Unknown Shops by Subcategory' AS report_type,
    subcategory,
    COUNT(*) AS shop_count
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name = 'Unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
GROUP BY subcategory
ORDER BY shop_count DESC;

-- ============================================================================
-- VERIFICATION: Remaining Unknown shops
-- ============================================================================
SELECT 
    'Remaining Unknown Shops' AS report_type,
    COUNT(*) AS shop_count,
    COUNT(*) * 100.0 / NULLIF((
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
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name = 'Unknown'
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != '';

