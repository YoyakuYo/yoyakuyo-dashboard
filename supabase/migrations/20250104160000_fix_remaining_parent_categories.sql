-- ============================================================================
-- FIX REMAINING SHOPS IN PARENT CATEGORIES
-- ============================================================================
-- This migration handles shops in parent categories that don't have matching
-- subcategory values. It uses shop name patterns and default assignments.
-- ============================================================================

DO $$
DECLARE
    shops_updated INTEGER := 0;
    total_updated INTEGER := 0;
    target_category_id UUID;
BEGIN
    RAISE NOTICE '=== STARTING: Fixing remaining shops in parent categories ===';
    
    -- ============================================================================
    -- STEP 1: Handle "Dining & Izakaya" shops without matching subcategory
    -- ============================================================================
    RAISE NOTICE 'Step 1: Handling Dining & Izakaya shops...';
    
    -- First, try to match existing subcategory values
    -- Izakaya
    SELECT id INTO target_category_id FROM categories WHERE name = 'Izakaya';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Izakaya'
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
        SET category_id = target_category_id,
            subcategory = 'Karaoke'
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
    
    -- Default ALL remaining to Restaurant
    SELECT id INTO target_category_id FROM categories WHERE name = 'Restaurant';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Restaurant'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Dining & Izakaya')
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
        RAISE NOTICE '  Updated % shops to Restaurant (default - ALL remaining)', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 2: Handle "Beauty Services" shops without matching subcategory
    -- ============================================================================
    RAISE NOTICE 'Step 2: Handling Beauty Services shops...';
    
    -- Try to infer from shop name patterns
    -- Hair Salon patterns
    SELECT id INTO target_category_id FROM categories WHERE name = 'Hair Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Hair Salon'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
        AND (subcategory IS NULL OR subcategory = '')
        AND (
            LOWER(name) LIKE '%hair%' OR
            LOWER(name) LIKE '%salon%' OR
            LOWER(name) LIKE '%ヘア%' OR
            LOWER(name) LIKE '%サロン%'
        )
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
        RAISE NOTICE '  Updated % shops to Hair Salon (inferred)', shops_updated;
    END IF;
    
    -- Nail Salon patterns
    SELECT id INTO target_category_id FROM categories WHERE name = 'Nail Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Nail Salon'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
        AND (subcategory IS NULL OR subcategory = '')
        AND (
            LOWER(name) LIKE '%nail%' OR
            LOWER(name) LIKE '%manicure%' OR
            LOWER(name) LIKE '%pedicure%' OR
            LOWER(name) LIKE '%ネイル%'
        )
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
        RAISE NOTICE '  Updated % shops to Nail Salon (inferred)', shops_updated;
    END IF;
    
    -- Barbershop patterns
    SELECT id INTO target_category_id FROM categories WHERE name = 'Barbershop';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Barbershop'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
        AND (subcategory IS NULL OR subcategory = '')
        AND (
            LOWER(name) LIKE '%barber%' OR
            LOWER(name) LIKE '%理髪%' OR
            LOWER(name) LIKE '%バーバー%'
        )
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
        RAISE NOTICE '  Updated % shops to Barbershop (inferred)', shops_updated;
    END IF;
    
    -- Eyelash patterns
    SELECT id INTO target_category_id FROM categories WHERE name = 'Eyelash / Eyebrow';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Eyelash / Eyebrow'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
        AND (subcategory IS NULL OR subcategory = '')
        AND (
            LOWER(name) LIKE '%eyelash%' OR
            LOWER(name) LIKE '%eyebrow%' OR
            LOWER(name) LIKE '%まつげ%' OR
            LOWER(name) LIKE '%眉毛%'
        )
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
        RAISE NOTICE '  Updated % shops to Eyelash / Eyebrow (inferred)', shops_updated;
    END IF;
    
    -- Try to match other subcategories first
    -- General Salon
    SELECT id INTO target_category_id FROM categories WHERE name = 'General Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'General Salon'
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
        SET category_id = target_category_id,
            subcategory = 'Waxing'
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
    
    -- Default ALL remaining Beauty Services to Beauty Salon
    SELECT id INTO target_category_id FROM categories WHERE name = 'Beauty Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Beauty Salon'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
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
        RAISE NOTICE '  Updated % shops to Beauty Salon (default - ALL remaining)', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 3: Handle "Clinics & Medical Care" shops without matching subcategory
    -- ============================================================================
    RAISE NOTICE 'Step 3: Handling Clinics & Medical Care shops...';
    
    -- Dental Clinic patterns
    SELECT id INTO target_category_id FROM categories WHERE name = 'Dental Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Dental Clinic'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Clinics & Medical Care')
        AND (subcategory IS NULL OR subcategory = '')
        AND (
            LOWER(name) LIKE '%dental%' OR
            LOWER(name) LIKE '%歯科%' OR
            LOWER(name) LIKE '%デンタル%'
        )
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
        RAISE NOTICE '  Updated % shops to Dental Clinic (inferred)', shops_updated;
    END IF;
    
    -- Eye Clinic patterns
    SELECT id INTO target_category_id FROM categories WHERE name = 'Eye Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Eye Clinic'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Clinics & Medical Care')
        AND (subcategory IS NULL OR subcategory = '')
        AND (
            LOWER(name) LIKE '%eye%' OR
            LOWER(name) LIKE '%眼科%' OR
            LOWER(name) LIKE '%アイ%'
        )
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
        RAISE NOTICE '  Updated % shops to Eye Clinic (inferred)', shops_updated;
    END IF;
    
    -- Try to match other subcategories first
    -- Women's Clinic
    SELECT id INTO target_category_id FROM categories WHERE name = 'Women''s Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Women''s Clinic'
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
        SET category_id = target_category_id,
            subcategory = 'Wellness Clinic'
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
        SET category_id = target_category_id,
            subcategory = 'Aesthetic Clinic'
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
    
    -- Default ALL remaining Clinics & Medical Care to Dental Clinic (most common)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Dental Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Dental Clinic'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Clinics & Medical Care')
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
        RAISE NOTICE '  Updated % shops to Dental Clinic (default - ALL remaining)', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 4: Handle "Hotels & Stays" shops - MOVE ALL to subcategories
    -- ============================================================================
    RAISE NOTICE 'Step 4: Handling Hotels & Stays shops...';
    
    -- First, try to match existing subcategory values
    -- Boutique Hotel
    SELECT id INTO target_category_id FROM categories WHERE name = 'Boutique Hotel';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Boutique Hotel'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Hotels & Stays')
        AND subcategory IN ('Boutique Hotel')
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
        SET category_id = target_category_id,
            subcategory = 'Guest House'
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
        SET category_id = target_category_id,
            subcategory = 'Ryokan Stay'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Hotels & Stays')
        AND subcategory IN ('Ryokan Stay')
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
    
    -- Default ALL remaining to Hotel (most common)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Hotel';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Hotel'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Hotels & Stays')
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
        RAISE NOTICE '  Updated % shops to Hotel (default - ALL remaining)', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 5: Handle "Spa, Onsen & Relaxation" shops without matching subcategory
    -- ============================================================================
    RAISE NOTICE 'Step 5: Handling Spa, Onsen & Relaxation shops...';
    
    -- Onsen patterns
    SELECT id INTO target_category_id FROM categories WHERE name = 'Onsen';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Onsen'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Spa, Onsen & Relaxation')
        AND (subcategory IS NULL OR subcategory = '')
        AND (
            LOWER(name) LIKE '%onsen%' OR
            LOWER(name) LIKE '%温泉%' OR
            LOWER(name) LIKE '%hot spring%'
        )
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
        RAISE NOTICE '  Updated % shops to Onsen (inferred)', shops_updated;
    END IF;
    
    -- Try to match other subcategories first
    -- Spa
    SELECT id INTO target_category_id FROM categories WHERE name = 'Spa';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Spa'
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
        SET category_id = target_category_id,
            subcategory = 'Massages'
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
    
    -- Ryokan Onsen
    SELECT id INTO target_category_id FROM categories WHERE name = 'Ryokan Onsen';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Ryokan Onsen'
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
    
    -- Default ALL remaining to Spa
    SELECT id INTO target_category_id FROM categories WHERE name = 'Spa';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Spa'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Spa, Onsen & Relaxation')
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
        RAISE NOTICE '  Updated % shops to Spa (default - ALL remaining)', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 6: Handle "Activities & Sports" shops without matching subcategory
    -- ============================================================================
    RAISE NOTICE 'Step 6: Handling Activities & Sports shops...';
    
    -- Golf patterns
    SELECT id INTO target_category_id FROM categories WHERE name = 'Golf';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Golf'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Activities & Sports')
        AND (subcategory IS NULL OR subcategory = '')
        AND (
            LOWER(name) LIKE '%golf%' OR
            LOWER(name) LIKE '%ゴルフ%'
        )
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
        RAISE NOTICE '  Updated % shops to Golf (inferred)', shops_updated;
    END IF;
    
    -- Try to match other subcategories first
    -- Golf Practice Range
    SELECT id INTO target_category_id FROM categories WHERE name = 'Golf Practice Range';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Golf Practice Range'
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
        SET category_id = target_category_id,
            subcategory = 'Pilates'
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
        SET category_id = target_category_id,
            subcategory = 'Yoga'
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
    
    -- Default ALL remaining to Golf (most common)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Golf';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Golf'
        WHERE category_id = (SELECT id FROM categories WHERE name = 'Activities & Sports')
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
        RAISE NOTICE '  Updated % shops to Golf (default - ALL remaining)', shops_updated;
    END IF;
    
    RAISE NOTICE '=== COMPLETED: Total shops reassigned: % ===', total_updated;
END $$;

-- ============================================================================
-- VERIFICATION: Show remaining shops in parent categories (should be 0)
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
-- VERIFICATION: Final category distribution (should show only subcategories)
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

