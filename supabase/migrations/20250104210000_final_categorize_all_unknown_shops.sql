-- ============================================================================
-- FINAL COMPREHENSIVE CATEGORIZATION OF ALL UNKNOWN SHOPS
-- ============================================================================
-- This migration uses multiple strategies to categorize all remaining Unknown shops:
-- 1. Case-insensitive subcategory matching with LIKE patterns
-- 2. Comprehensive name pattern matching
-- 3. Address pattern matching
-- 4. Intelligent fallback strategies
-- ============================================================================

DO $$
DECLARE
    shops_updated INTEGER := 0;
    total_updated INTEGER := 0;
    target_category_id UUID;
    unknown_category_id UUID;
BEGIN
    RAISE NOTICE '=== STARTING: Final comprehensive categorization of Unknown shops ===';
    
    -- Get Unknown category ID
    SELECT id INTO unknown_category_id FROM categories WHERE name = 'Unknown';
    
    IF unknown_category_id IS NULL THEN
        RAISE NOTICE 'Unknown category not found, skipping...';
        RETURN;
    END IF;
    
    -- ============================================================================
    -- STRATEGY 1: Case-insensitive subcategory matching with LIKE patterns
    -- ============================================================================
    RAISE NOTICE 'Strategy 1: Case-insensitive subcategory matching...';
    
    -- Hair Salon (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Hair Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Hair Salon')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%hair%salon%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%hair%' OR
            LOWER(COALESCE(subcategory, '')) = 'salon' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%ヘア%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%サロン%'
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
        RAISE NOTICE '  Updated % shops to Hair Salon (subcategory match)', shops_updated;
    END IF;
    
    -- Nail Salon (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Nail Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Nail Salon')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%nail%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%manicure%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%pedicure%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%ネイル%'
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
        RAISE NOTICE '  Updated % shops to Nail Salon (subcategory match)', shops_updated;
    END IF;
    
    -- Restaurant (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Restaurant';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Restaurant')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%restaurant%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%cafe%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%coffee%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%dining%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%レストラン%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%カフェ%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%食堂%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%料理%'
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
        RAISE NOTICE '  Updated % shops to Restaurant (subcategory match)', shops_updated;
    END IF;
    
    -- Hotel (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Hotel';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Hotel')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%hotel%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%inn%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%accommodation%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%ホテル%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%旅館%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%宿%'
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
        RAISE NOTICE '  Updated % shops to Hotel (subcategory match)', shops_updated;
    END IF;
    
    -- Dental Clinic (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Dental Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Dental Clinic')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%dental%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%dentist%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%歯科%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%歯医者%'
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
        RAISE NOTICE '  Updated % shops to Dental Clinic (subcategory match)', shops_updated;
    END IF;
    
    -- Eye Clinic (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Eye Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Eye Clinic')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%eye%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%ophthalmology%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%眼科%'
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
        RAISE NOTICE '  Updated % shops to Eye Clinic (subcategory match)', shops_updated;
    END IF;
    
    -- Onsen (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Onsen';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Onsen')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%onsen%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%hot%spring%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%温泉%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%銭湯%'
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
        RAISE NOTICE '  Updated % shops to Onsen (subcategory match)', shops_updated;
    END IF;
    
    -- Spa (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Spa';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Spa')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%spa%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%massage%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%relaxation%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%スパ%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%マッサージ%'
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
        RAISE NOTICE '  Updated % shops to Spa (subcategory match)', shops_updated;
    END IF;
    
    -- Barbershop (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Barbershop';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Barbershop')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%barber%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%理髪%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%散髪%'
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
        RAISE NOTICE '  Updated % shops to Barbershop (subcategory match)', shops_updated;
    END IF;
    
    -- Golf (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Golf';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Golf')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%golf%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%ゴルフ%'
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
        RAISE NOTICE '  Updated % shops to Golf (subcategory match)', shops_updated;
    END IF;
    
    -- Izakaya (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Izakaya';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Izakaya')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%izakaya%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%bar%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%pub%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%居酒屋%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%バー%'
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
        RAISE NOTICE '  Updated % shops to Izakaya (subcategory match)', shops_updated;
    END IF;
    
    -- Karaoke (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Karaoke';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Karaoke')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%karaoke%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%カラオケ%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%ktv%'
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
        RAISE NOTICE '  Updated % shops to Karaoke (subcategory match)', shops_updated;
    END IF;
    
    -- Beauty Salon (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Beauty Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Beauty Salon')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%beauty%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%esthetic%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%cosmetic%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%美容%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%エステ%'
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
        RAISE NOTICE '  Updated % shops to Beauty Salon (subcategory match)', shops_updated;
    END IF;
    
    -- Eyelash / Eyebrow (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Eyelash / Eyebrow';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Eyelash / Eyebrow')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%eyelash%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%eyebrow%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%まつげ%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%眉毛%'
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
        RAISE NOTICE '  Updated % shops to Eyelash / Eyebrow (subcategory match)', shops_updated;
    END IF;
    
    -- Women's Clinic (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Women''s Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Women''s Clinic')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%women%clinic%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%womens%clinic%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%婦人科%'
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
        RAISE NOTICE '  Updated % shops to Women''s Clinic (subcategory match)', shops_updated;
    END IF;
    
    -- Wellness Clinic (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Wellness Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Wellness Clinic')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%wellness%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%健康%'
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
        RAISE NOTICE '  Updated % shops to Wellness Clinic (subcategory match)', shops_updated;
    END IF;
    
    -- Aesthetic Clinic (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Aesthetic Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Aesthetic Clinic')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%aesthetic%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%美容外科%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%形成外科%'
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
        RAISE NOTICE '  Updated % shops to Aesthetic Clinic (subcategory match)', shops_updated;
    END IF;
    
    -- Boutique Hotel (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Boutique Hotel';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Boutique Hotel')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%boutique%hotel%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%ブティック%ホテル%'
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
        RAISE NOTICE '  Updated % shops to Boutique Hotel (subcategory match)', shops_updated;
    END IF;
    
    -- Guest House (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Guest House';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Guest House')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%guest%house%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%guesthouse%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%ゲストハウス%'
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
        RAISE NOTICE '  Updated % shops to Guest House (subcategory match)', shops_updated;
    END IF;
    
    -- Ryokan Stay (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Ryokan Stay';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Ryokan Stay')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%ryokan%stay%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%ryokan%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%旅館%'
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
        RAISE NOTICE '  Updated % shops to Ryokan Stay (subcategory match)', shops_updated;
    END IF;
    
    -- Ryokan Onsen (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Ryokan Onsen';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Ryokan Onsen')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%ryokan%onsen%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%onsen%ryokan%'
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
        RAISE NOTICE '  Updated % shops to Ryokan Onsen (subcategory match)', shops_updated;
    END IF;
    
    -- Golf Practice Range (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Golf Practice Range';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Golf Practice Range')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%golf%practice%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%ゴルフ%練習%'
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
        RAISE NOTICE '  Updated % shops to Golf Practice Range (subcategory match)', shops_updated;
    END IF;
    
    -- Pilates (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Pilates';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Pilates')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%pilates%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%ピラティス%'
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
        RAISE NOTICE '  Updated % shops to Pilates (subcategory match)', shops_updated;
    END IF;
    
    -- Yoga (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Yoga';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Yoga')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%yoga%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%ヨガ%'
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
        RAISE NOTICE '  Updated % shops to Yoga (subcategory match)', shops_updated;
    END IF;
    
    -- Waxing (case-insensitive, partial matches)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Waxing';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = COALESCE(subcategory, 'Waxing')
        WHERE category_id = unknown_category_id
        AND (
            LOWER(COALESCE(subcategory, '')) LIKE '%waxing%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%ワックス%' OR
            LOWER(COALESCE(subcategory, '')) LIKE '%脱毛%'
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
        RAISE NOTICE '  Updated % shops to Waxing (subcategory match)', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STRATEGY 2: Comprehensive name pattern matching (for shops without subcategory)
    -- ============================================================================
    RAISE NOTICE 'Strategy 2: Comprehensive name pattern matching...';
    
    -- Restaurant name patterns
    SELECT id INTO target_category_id FROM categories WHERE name = 'Restaurant';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Restaurant'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%restaurant%' OR
            LOWER(name) LIKE '%レストラン%' OR
            LOWER(name) LIKE '%食堂%' OR
            LOWER(name) LIKE '%cafe%' OR
            LOWER(name) LIKE '%カフェ%' OR
            LOWER(name) LIKE '%coffee%' OR
            LOWER(name) LIKE '%コーヒー%' OR
            LOWER(name) LIKE '%ramen%' OR
            LOWER(name) LIKE '%ラーメン%' OR
            LOWER(name) LIKE '%sushi%' OR
            LOWER(name) LIKE '%寿司%' OR
            LOWER(name) LIKE '%yakitori%' OR
            LOWER(name) LIKE '%焼き鳥%' OR
            LOWER(name) LIKE '%tempura%' OR
            LOWER(name) LIKE '%天ぷら%' OR
            LOWER(name) LIKE '%udon%' OR
            LOWER(name) LIKE '%うどん%' OR
            LOWER(name) LIKE '%soba%' OR
            LOWER(name) LIKE '%そば%' OR
            LOWER(name) LIKE '%curry%' OR
            LOWER(name) LIKE '%カレー%' OR
            LOWER(name) LIKE '%donburi%' OR
            LOWER(name) LIKE '%丼%' OR
            LOWER(name) LIKE '%bento%' OR
            LOWER(name) LIKE '%弁当%' OR
            LOWER(name) LIKE '%食堂%' OR
            LOWER(name) LIKE '%料理店%' OR
            LOWER(name) LIKE '%レスト%'
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
        RAISE NOTICE '  Updated % shops to Restaurant (name pattern)', shops_updated;
    END IF;
    
    -- Hotel name patterns
    SELECT id INTO target_category_id FROM categories WHERE name = 'Hotel';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Hotel'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%hotel%' OR
            LOWER(name) LIKE '%ホテル%' OR
            LOWER(name) LIKE '%inn%' OR
            LOWER(name) LIKE '%旅館%' OR
            LOWER(name) LIKE '%ryokan%' OR
            LOWER(name) LIKE '%宿%' OR
            LOWER(name) LIKE '%accommodation%'
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
        RAISE NOTICE '  Updated % shops to Hotel (name pattern)', shops_updated;
    END IF;
    
    -- Hair Salon name patterns
    SELECT id INTO target_category_id FROM categories WHERE name = 'Hair Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Hair Salon'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%hair%salon%' OR
            LOWER(name) LIKE '%ヘア%サロン%' OR
            LOWER(name) LIKE '%美容室%' OR
            LOWER(name) LIKE '%理容%' OR
            LOWER(name) LIKE '%hair%' OR
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
        RAISE NOTICE '  Updated % shops to Hair Salon (name pattern)', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STRATEGY 3: Address pattern matching (for shops in specific areas)
    -- ============================================================================
    RAISE NOTICE 'Strategy 3: Address pattern matching...';
    
    -- Onsen address patterns (often in specific prefectures)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Onsen';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Onsen'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(address) LIKE '%温泉%' OR
            LOWER(address) LIKE '%onsen%' OR
            LOWER(address) LIKE '%hot%spring%' OR
            LOWER(address) LIKE '%銭湯%'
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
        RAISE NOTICE '  Updated % shops to Onsen (address pattern)', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STRATEGY 4: Targeted shop name patterns (based on actual data analysis)
    -- ============================================================================
    RAISE NOTICE 'Strategy 4: Targeted shop name patterns...';
    
    -- Beauty Salon patterns (specific shop names)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Beauty Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Beauty Salon'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%beautism%' OR
            LOWER(name) LIKE '%atelier%haruka%' OR
            LOWER(name) LIKE '%bianca%' OR
            LOWER(name) LIKE '%bloom%' OR
            LOWER(name) LIKE '%amelia%' OR
            LOWER(name) LIKE '%amii%' OR
            LOWER(name) LIKE '%ange%anje%' OR
            LOWER(name) LIKE '%angelic%' OR
            LOWER(name) LIKE '%anjerikamissheru%' OR
            LOWER(name) LIKE '%ann%moss%' OR
            LOWER(name) LIKE '%anti%' OR
            LOWER(name) LIKE '%antreamora%' OR
            LOWER(name) LIKE '%beauternal%' OR
            LOWER(name) LIKE '%belle%' OR
            LOWER(name) LIKE '%belme%' OR
            LOWER(name) LIKE '%belze%' OR
            LOWER(name) LIKE '%blanc%' OR
            LOWER(name) LIKE '%blancheur%' OR
            LOWER(name) LIKE '%bluem%' OR
            LOWER(name) LIKE '%biyoshitsu%' OR
            LOWER(name) LIKE '%美容室%' OR
            LOWER(name) LIKE '%エステ%' OR
            LOWER(name) LIKE '%美容%' OR
            LOWER(name) LIKE '%たるみ改善%' OR
            LOWER(name) LIKE '%リフトアップ%'
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
        RAISE NOTICE '  Updated % shops to Beauty Salon (targeted names)', shops_updated;
    END IF;
    
    -- Spa patterns (specific shop names)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Spa';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Spa'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%airasshu%' OR
            LOWER(name) LIKE '%appease%' OR
            LOWER(name) LIKE '%aqua%' OR
            LOWER(name) LIKE '%aroma%' OR
            LOWER(name) LIKE '%ashi%karada%' OR
            LOWER(name) LIKE '%asian%feeling%' OR
            LOWER(name) LIKE '%asiesta%' OR
            LOWER(name) LIKE '%asleep%' OR
            LOWER(name) LIKE '%assort%' OR
            LOWER(name) LIKE '%astro%' OR
            LOWER(name) LIKE '%avanti%' OR
            LOWER(name) LIKE '%ayutthaya%' OR
            LOWER(name) LIKE '%baan%rak%' OR
            LOWER(name) LIKE '%bang%bang%bangkok%' OR
            LOWER(name) LIKE '%bassa%' OR
            LOWER(name) LIKE '%beach%' OR
            LOWER(name) LIKE '%bear%hug%' OR
            LOWER(name) LIKE '%beb%toky%' OR
            LOWER(name) LIKE '%belire%' OR
            LOWER(name) LIKE '%belladonna%' OR
            LOWER(name) LIKE '%benji%' OR
            LOWER(name) LIKE '%best%' OR
            LOWER(name) LIKE '%bilancia%' OR
            LOWER(name) LIKE '%black%biz%' OR
            LOWER(name) LIKE '%blend%' OR
            LOWER(name) LIKE '%マッサージ%' OR
            LOWER(name) LIKE '%massage%' OR
            LOWER(name) LIKE '%リラクゼーション%' OR
            LOWER(name) LIKE '%relaxation%' OR
            LOWER(name) LIKE '%タイマッサージ%' OR
            LOWER(name) LIKE '%thai%massage%'
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
        RAISE NOTICE '  Updated % shops to Spa (targeted names)', shops_updated;
    END IF;
    
    -- Eyelash / Eyebrow patterns
    SELECT id INTO target_category_id FROM categories WHERE name = 'Eyelash / Eyebrow';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Eyelash / Eyebrow'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%blow%brow%' OR
            LOWER(name) LIKE '%まつげ%' OR
            LOWER(name) LIKE '%眉毛%' OR
            LOWER(name) LIKE '%eyelash%' OR
            LOWER(name) LIKE '%eyebrow%'
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
        RAISE NOTICE '  Updated % shops to Eyelash / Eyebrow (targeted names)', shops_updated;
    END IF;
    
    -- Wellness Clinic patterns (acupuncture, alternative medicine)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Wellness Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Wellness Clinic'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%acupuncture%' OR
            LOWER(name) LIKE '%針灸%' OR
            LOWER(name) LIKE '%鍼灸%' OR
            LOWER(name) LIKE '%shinkyu%' OR
            LOWER(name) LIKE '%harikyu%'
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
        RAISE NOTICE '  Updated % shops to Wellness Clinic (acupuncture)', shops_updated;
    END IF;
    
    -- Hair Salon patterns (specific names that might be hair salons)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Hair Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Hair Salon'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%aki%watanabe%' OR
            LOWER(name) LIKE '%album%' OR
            LOWER(name) LIKE '%anranju%' OR
            LOWER(name) LIKE '%ao_hare%' OR
            LOWER(name) LIKE '%assort%tokyo%' OR
            LOWER(name) LIKE '%atelier%' OR
            (LOWER(name) LIKE '%salon%' AND LOWER(name) NOT LIKE '%nail%' AND LOWER(name) NOT LIKE '%beauty%')
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
        RAISE NOTICE '  Updated % shops to Hair Salon (targeted names)', shops_updated;
    END IF;
    
    -- Restaurant patterns (specific names)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Restaurant';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Restaurant'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%take%a%leisurely%walk%' OR
            LOWER(name) LIKE '%akasaka%tuptim%' OR
            LOWER(name) LIKE '%azabu%i.b.kan%' OR
            LOWER(name) LIKE '%babi%' OR
            LOWER(name) LIKE '%restaurant%' OR
            LOWER(name) LIKE '%レストラン%' OR
            LOWER(name) LIKE '%食堂%' OR
            LOWER(name) LIKE '%料理%'
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
        RAISE NOTICE '  Updated % shops to Restaurant (targeted names)', shops_updated;
    END IF;
    
    -- Hotel patterns (specific names)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Hotel';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Hotel'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%azure%nijo%kyoto%house%' OR
            LOWER(name) LIKE '%eagle%court%' OR
            LOWER(name) LIKE '%hotel%' OR
            LOWER(name) LIKE '%ホテル%' OR
            LOWER(name) LIKE '%inn%' OR
            LOWER(name) LIKE '%宿%'
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
        RAISE NOTICE '  Updated % shops to Hotel (targeted names)', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STRATEGY 5: Additional targeted patterns (second batch analysis)
    -- ============================================================================
    RAISE NOTICE 'Strategy 5: Additional targeted patterns (second batch)...';
    
    -- Spa patterns (body care, stretching, wellness)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Spa';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Spa'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%body%tune%' OR
            LOWER(name) LIKE '%bodynavi%' OR
            LOWER(name) LIKE '%bodysh%' OR
            LOWER(name) LIKE '%dr.stretch%' OR
            LOWER(name) LIKE '%dr%stretch%' OR
            LOWER(name) LIKE '%chisokujoraku%' OR
            LOWER(name) LIKE '%整体%' OR
            LOWER(name) LIKE '%seitai%' OR
            LOWER(name) LIKE '%ストレッチ%' OR
            LOWER(name) LIKE '%stretch%' OR
            LOWER(name) LIKE '%body%care%' OR
            LOWER(name) LIKE '%ボディ%' OR
            LOWER(name) LIKE '%cocoro%no%rakuen%'
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
        RAISE NOTICE '  Updated % shops to Spa (body care/stretch)', shops_updated;
    END IF;
    
    -- Wellness Clinic patterns (medical checkup, wellness)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Wellness Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Wellness Clinic'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%checkup%center%' OR
            LOWER(name) LIKE '%dr.v%' OR
            LOWER(name) LIKE '%dr%v%' OR
            LOWER(name) LIKE '%健康診断%' OR
            LOWER(name) LIKE '%健診%'
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
        RAISE NOTICE '  Updated % shops to Wellness Clinic (checkup)', shops_updated;
    END IF;
    
    -- Beauty Salon patterns (additional specific names)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Beauty Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Beauty Salon'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%bejora%' OR
            LOWER(name) LIKE '%bien%' OR
            LOWER(name) LIKE '%brilliance%' OR
            LOWER(name) LIKE '%btb%le-pon%' OR
            LOWER(name) LIKE '%buakeo%' OR
            LOWER(name) LIKE '%buasai%' OR
            LOWER(name) LIKE '%buasawan%' OR
            LOWER(name) LIKE '%buzon%' OR
            LOWER(name) LIKE '%canaan%' OR
            LOWER(name) LIKE '%carrefour%' OR
            LOWER(name) LIKE '%casa%splendido%' OR
            LOWER(name) LIKE '%chante%lily%' OR
            LOWER(name) LIKE '%chestnuts%' OR
            LOWER(name) LIKE '%chezlion%' OR
            LOWER(name) LIKE '%chiffon%' OR
            LOWER(name) LIKE '%classy%' OR
            LOWER(name) LIKE '%claude%monet%' OR
            LOWER(name) LIKE '%clea%' OR
            LOWER(name) LIKE '%coalalu%' OR
            LOWER(name) LIKE '%cozy%corner%' OR
            LOWER(name) LIKE '%cozysakura%' OR
            LOWER(name) LIKE '%crayon%' OR
            LOWER(name) LIKE '%cr%C3%A9bia%' OR
            LOWER(name) LIKE '%crebia%' OR
            LOWER(name) LIKE '%beaut%C3%A9%' OR
            LOWER(name) LIKE '%beaute%' OR
            LOWER(name) LIKE '%cube%' OR
            LOWER(name) LIKE '%cuffa%' OR
            LOWER(name) LIKE '%cuffnorika%' OR
            LOWER(name) LIKE '%cyan%' OR
            LOWER(name) LIKE '%dark%honey%' OR
            LOWER(name) LIKE '%dashing%diva%' OR
            LOWER(name) LIKE '%day.aoyama%' OR
            LOWER(name) LIKE '%day%sy%' OR
            LOWER(name) LIKE '%diamond%rush%' OR
            LOWER(name) LIKE '%dio%' OR
            LOWER(name) LIKE '%disco%' OR
            LOWER(name) LIKE '%dot1101%' OR
            LOWER(name) LIKE '%e.b.c.c.%' OR
            LOWER(name) LIKE '%earth%' OR
            LOWER(name) LIKE '%eclat%' OR
            LOWER(name) LIKE '%éclat%' OR
            LOWER(name) LIKE '%eden%tokyo%' OR
            LOWER(name) LIKE '%eight%' OR
            LOWER(name) LIKE '%el%cerca%' OR
            LOWER(name) LIKE '%elan%' OR
            LOWER(name) LIKE '%élan%' OR
            LOWER(name) LIKE '%aime%' OR
            LOWER(name) LIKE '%aina%' OR
            LOWER(name) LIKE '%aletta%' OR
            LOWER(name) LIKE '%allu%' OR
            LOWER(name) LIKE '%amor%' OR
            LOWER(name) LIKE '%amour%' OR
            LOWER(name) LIKE '%an%ikebukuro%' OR
            LOWER(name) LIKE '%ash%' OR
            LOWER(name) LIKE '%ashian%' OR
            LOWER(name) LIKE '%asuteki%' OR
            LOWER(name) LIKE '%august%' OR
            LOWER(name) LIKE '%abbie%' OR
            LOWER(name) LIKE '%ace%' OR
            LOWER(name) LIKE '%ai%tokyo%' OR
            LOWER(name) LIKE '%cielo%' OR
            LOWER(name) LIKE '%bonheur%factor%' OR
            LOWER(name) LIKE '%boy%attic%' OR
            LOWER(name) LIKE '%bridge%' OR
            LOWER(name) LIKE '%can%i%dressy%' OR
            LOWER(name) LIKE '%chai%' OR
            LOWER(name) LIKE '%danshaku%'
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
        RAISE NOTICE '  Updated % shops to Beauty Salon (additional names)', shops_updated;
    END IF;
    
    -- Onsen patterns (bathhouse)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Onsen';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Onsen'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%edo-yu%' OR
            LOWER(name) LIKE '%銭湯%' OR
            LOWER(name) LIKE '%湯%' OR
            LOWER(name) LIKE '%yu%'
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
        RAISE NOTICE '  Updated % shops to Onsen (bathhouse)', shops_updated;
    END IF;
    
    -- Restaurant patterns (additional)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Restaurant';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Restaurant'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%bochi%bochi%' OR
            LOWER(name) LIKE '%chocozap%' OR
            LOWER(name) LIKE '%cocon%' OR
            LOWER(name) LIKE '%temomin%' OR
            LOWER(name) LIKE '%daiyamondoaizu%' OR
            LOWER(name) LIKE '%terra%' OR
            LOWER(name) LIKE '%gion%beer%' OR
            LOWER(name) LIKE '%good%nature%station%'
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
        RAISE NOTICE '  Updated % shops to Restaurant (additional)', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STRATEGY 6: Final batch of targeted patterns (third batch analysis)
    -- ============================================================================
    RAISE NOTICE 'Strategy 6: Final batch of targeted patterns (third batch)...';
    
    -- Beauty Salon patterns (final batch of specific names)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Beauty Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Beauty Salon'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%crebia%beaute%' OR
            LOWER(name) LIKE '%e.b.c.c.%' OR
            LOWER(name) LIKE '%elegance%' OR
            LOWER(name) LIKE '%elme%' OR
            LOWER(name) LIKE '%elua%' OR
            LOWER(name) LIKE '%enrike%' OR
            LOWER(name) LIKE '%erfolg%' OR
            LOWER(name) LIKE '%es%' OR
            LOWER(name) LIKE '%espoir%' OR
            LOWER(name) LIKE '%euphoria%' OR
            LOWER(name) LIKE '%expa%' OR
            LOWER(name) LIKE '%fact%' OR
            LOWER(name) LIKE '%fairy%' OR
            LOWER(name) LIKE '%fass%' OR
            LOWER(name) LIKE '%fein%' OR
            LOWER(name) LIKE '%femally%' OR
            LOWER(name) LIKE '%ferebright%' OR
            LOWER(name) LIKE '%fi-ne%' OR
            LOWER(name) LIKE '%films%' OR
            LOWER(name) LIKE '%fiore%' OR
            LOWER(name) LIKE '%fis%' OR
            LOWER(name) LIKE '%fix-up%' OR
            LOWER(name) LIKE '%fl%notis%' OR
            LOWER(name) LIKE '%flammeum%' OR
            LOWER(name) LIKE '%florir%' OR
            LOWER(name) LIKE '%foi%' OR
            LOWER(name) LIKE '%forest%symphony%' OR
            LOWER(name) LIKE '%forrest%' OR
            LOWER(name) LIKE '%forty-five%' OR
            LOWER(name) LIKE '%freja%' OR
            LOWER(name) LIKE '%fukurai%' OR
            LOWER(name) LIKE '%gachette%' OR
            LOWER(name) LIKE '%gallica%' OR
            LOWER(name) LIKE '%garden%' OR
            LOWER(name) LIKE '%ginza%bonny%' OR
            LOWER(name) LIKE '%ginza%matsunaga%' OR
            LOWER(name) LIKE '%ginza%sanctuary%' OR
            LOWER(name) LIKE '%ginzamatsunagadukurasu%' OR
            LOWER(name) LIKE '%glanz%' OR
            LOWER(name) LIKE '%goku%no%kimochi%' OR
            LOWER(name) LIKE '%goo%it%' OR
            LOWER(name) LIKE '%gooddays%' OR
            LOWER(name) LIKE '%grand%dua%' OR
            LOWER(name) LIKE '%grazia%' OR
            LOWER(name) LIKE '%groomers%' OR
            LOWER(name) LIKE '%guerlain%' OR
            LOWER(name) LIKE '%guinot%institut%' OR
            LOWER(name) LIKE '%hal%plus%' OR
            LOWER(name) LIKE '%hanmi%' OR
            LOWER(name) LIKE '%harika%' OR
            LOWER(name) LIKE '%heel%ginza%' OR
            LOWER(name) LIKE '%henri%' OR
            LOWER(name) LIKE '%hiro%ginza%' OR
            LOWER(name) LIKE '%huul%beaut%' OR
            LOWER(name) LIKE '%hyper%tokyo%' OR
            LOWER(name) LIKE '%infinic%' OR
            LOWER(name) LIKE '%infinity%' OR
            LOWER(name) LIKE '%jardin%secret%' OR
            LOWER(name) LIKE '%jexer%' OR
            LOWER(name) LIKE '%jiku%' OR
            LOWER(name) LIKE '%jill%lovers%' OR
            LOWER(name) LIKE '%&inc%' OR
            LOWER(name) LIKE '%8ist%' OR
            LOWER(name) LIKE '%en%' OR
            LOWER(name) LIKE '%en.trip%' OR
            LOWER(name) LIKE '%enudottobabahirooten%' OR
            LOWER(name) LIKE '%asian%' OR
            LOWER(name) LIKE '%&%l%' OR
            LOWER(name) LIKE '%黄土よもぎ蒸し%' OR
            LOWER(name) LIKE '%ハーブピーリング%'
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
        RAISE NOTICE '  Updated % shops to Beauty Salon (final batch)', shops_updated;
    END IF;
    
    -- Spa patterns (massage, body care, wellness)
    SELECT id INTO target_category_id FROM categories WHERE name = 'Spa';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Spa'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%enzyme%bath%' OR
            LOWER(name) LIKE '%feelcycle%' OR
            LOWER(name) LIKE '%healing%baden%' OR
            LOWER(name) LIKE '%hogushi%' OR
            LOWER(name) LIKE '%hoshien%' OR
            LOWER(name) LIKE '%hoshishu%' OR
            LOWER(name) LIKE '%酵素風呂%' OR
            LOWER(name) LIKE '%マッサージ%' OR
            LOWER(name) LIKE '%整体%' OR
            LOWER(name) LIKE '%リラクゼーション%'
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
        RAISE NOTICE '  Updated % shops to Spa (final batch)', shops_updated;
    END IF;
    
    RAISE NOTICE '=== COMPLETED: Total Unknown shops categorized: % ===', total_updated;
END $$;

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

-- ============================================================================
-- VERIFICATION: Sample of remaining Unknown shops (for manual review)
-- ============================================================================
SELECT 
    'Sample Remaining Unknown Shops' AS report_type,
    s.id,
    s.name AS shop_name,
    s.subcategory,
    s.address,
    s.city,
    s.prefecture
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
ORDER BY s.name
LIMIT 100;
