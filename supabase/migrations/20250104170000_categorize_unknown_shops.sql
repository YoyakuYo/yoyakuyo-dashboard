-- ============================================================================
-- CATEGORIZE UNKNOWN SHOPS - ASSIGN TO APPROPRIATE CATEGORIES
-- ============================================================================
-- This migration analyzes shops in the "Unknown" category and assigns them
-- to appropriate categories based on shop name patterns and addresses
-- ============================================================================

DO $$
DECLARE
    shops_updated INTEGER := 0;
    total_updated INTEGER := 0;
    target_category_id UUID;
    unknown_category_id UUID;
BEGIN
    RAISE NOTICE '=== STARTING: Categorizing Unknown shops ===';
    
    -- Get Unknown category ID
    SELECT id INTO unknown_category_id FROM categories WHERE name = 'Unknown';
    
    IF unknown_category_id IS NULL THEN
        RAISE NOTICE 'Unknown category not found, skipping...';
        RETURN;
    END IF;
    
    -- ============================================================================
    -- STEP 1: Restaurant patterns
    -- ============================================================================
    RAISE NOTICE 'Step 1: Identifying restaurants...';
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
            LOWER(name) LIKE '%料理%' OR
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
            LOWER(name) LIKE '%弁当%'
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
        RAISE NOTICE '  Updated % shops to Restaurant', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 2: Izakaya patterns
    -- ============================================================================
    RAISE NOTICE 'Step 2: Identifying izakaya...';
    SELECT id INTO target_category_id FROM categories WHERE name = 'Izakaya';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Izakaya'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%izakaya%' OR
            LOWER(name) LIKE '%居酒屋%' OR
            LOWER(name) LIKE '%bar%' OR
            LOWER(name) LIKE '%バー%' OR
            LOWER(name) LIKE '%pub%' OR
            LOWER(name) LIKE '%パブ%'
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
        RAISE NOTICE '  Updated % shops to Izakaya', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 3: Hotel patterns
    -- ============================================================================
    RAISE NOTICE 'Step 3: Identifying hotels...';
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
            LOWER(name) LIKE '%旅館%'
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
        RAISE NOTICE '  Updated % shops to Hotel', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 4: Hair Salon patterns
    -- ============================================================================
    RAISE NOTICE 'Step 4: Identifying hair salons...';
    SELECT id INTO target_category_id FROM categories WHERE name = 'Hair Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Hair Salon'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%hair%' OR
            LOWER(name) LIKE '%ヘア%' OR
            LOWER(name) LIKE '%salon%' OR
            LOWER(name) LIKE '%サロン%' OR
            LOWER(name) LIKE '%美容室%' OR
            LOWER(name) LIKE '%理容%' OR
            LOWER(name) LIKE '%cut%' OR
            LOWER(name) LIKE '%カット%'
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
        RAISE NOTICE '  Updated % shops to Hair Salon', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 5: Nail Salon patterns
    -- ============================================================================
    RAISE NOTICE 'Step 5: Identifying nail salons...';
    SELECT id INTO target_category_id FROM categories WHERE name = 'Nail Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Nail Salon'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%nail%' OR
            LOWER(name) LIKE '%ネイル%' OR
            LOWER(name) LIKE '%manicure%' OR
            LOWER(name) LIKE '%マニキュア%' OR
            LOWER(name) LIKE '%pedicure%' OR
            LOWER(name) LIKE '%ペディキュア%'
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
        RAISE NOTICE '  Updated % shops to Nail Salon', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 6: Dental Clinic patterns
    -- ============================================================================
    RAISE NOTICE 'Step 6: Identifying dental clinics...';
    SELECT id INTO target_category_id FROM categories WHERE name = 'Dental Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Dental Clinic'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%dental%' OR
            LOWER(name) LIKE '%歯科%' OR
            LOWER(name) LIKE '%デンタル%' OR
            LOWER(name) LIKE '%dentist%' OR
            LOWER(name) LIKE '%歯医者%'
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
        RAISE NOTICE '  Updated % shops to Dental Clinic', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 7: Eye Clinic patterns
    -- ============================================================================
    RAISE NOTICE 'Step 7: Identifying eye clinics...';
    SELECT id INTO target_category_id FROM categories WHERE name = 'Eye Clinic';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Eye Clinic'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%eye%' OR
            LOWER(name) LIKE '%眼科%' OR
            LOWER(name) LIKE '%アイ%' OR
            LOWER(name) LIKE '%ophthalmology%' OR
            LOWER(name) LIKE '%optometry%'
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
        RAISE NOTICE '  Updated % shops to Eye Clinic', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 8: Onsen patterns
    -- ============================================================================
    RAISE NOTICE 'Step 8: Identifying onsen...';
    SELECT id INTO target_category_id FROM categories WHERE name = 'Onsen';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Onsen'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%onsen%' OR
            LOWER(name) LIKE '%温泉%' OR
            LOWER(name) LIKE '%hot spring%' OR
            LOWER(name) LIKE '%湯%'
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
        RAISE NOTICE '  Updated % shops to Onsen', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 9: Spa patterns
    -- ============================================================================
    RAISE NOTICE 'Step 9: Identifying spas...';
    SELECT id INTO target_category_id FROM categories WHERE name = 'Spa';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Spa'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%spa%' OR
            LOWER(name) LIKE '%スパ%' OR
            LOWER(name) LIKE '%massage%' OR
            LOWER(name) LIKE '%マッサージ%' OR
            LOWER(name) LIKE '%relaxation%' OR
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
        RAISE NOTICE '  Updated % shops to Spa', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 10: Barbershop patterns
    -- ============================================================================
    RAISE NOTICE 'Step 10: Identifying barbershops...';
    SELECT id INTO target_category_id FROM categories WHERE name = 'Barbershop';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Barbershop'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%barber%' OR
            LOWER(name) LIKE '%バーバー%' OR
            LOWER(name) LIKE '%理髪%' OR
            LOWER(name) LIKE '%理容%'
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
        RAISE NOTICE '  Updated % shops to Barbershop', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 11: Golf patterns
    -- ============================================================================
    RAISE NOTICE 'Step 11: Identifying golf facilities...';
    SELECT id INTO target_category_id FROM categories WHERE name = 'Golf';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Golf'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%golf%' OR
            LOWER(name) LIKE '%ゴルフ%' OR
            LOWER(name) LIKE '%golf course%' OR
            LOWER(name) LIKE '%ゴルフ場%'
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
        RAISE NOTICE '  Updated % shops to Golf', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 12: Karaoke patterns
    -- ============================================================================
    RAISE NOTICE 'Step 12: Identifying karaoke...';
    SELECT id INTO target_category_id FROM categories WHERE name = 'Karaoke';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Karaoke'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%karaoke%' OR
            LOWER(name) LIKE '%カラオケ%' OR
            LOWER(name) LIKE '%ktv%'
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
        RAISE NOTICE '  Updated % shops to Karaoke', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 13: Beauty Salon patterns (catch-all for beauty services)
    -- ============================================================================
    RAISE NOTICE 'Step 13: Identifying beauty salons...';
    SELECT id INTO target_category_id FROM categories WHERE name = 'Beauty Salon';
    IF target_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = target_category_id,
            subcategory = 'Beauty Salon'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%beauty%' OR
            LOWER(name) LIKE '%美容%' OR
            LOWER(name) LIKE '%esthetic%' OR
            LOWER(name) LIKE '%エステ%' OR
            LOWER(name) LIKE '%cosmetic%' OR
            LOWER(name) LIKE '%コスメ%'
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
        RAISE NOTICE '  Updated % shops to Beauty Salon', shops_updated;
    END IF;
    
    RAISE NOTICE '=== COMPLETED: Total Unknown shops categorized: % ===', total_updated;
END $$;

-- ============================================================================
-- VERIFICATION: Show remaining Unknown shops
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
    ), 0) AS percentage,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - All shops categorized'
        WHEN COUNT(*) < 100 THEN '⚠️ WARNING - Few shops remain uncategorized'
        ELSE '❌ FAIL - Many shops still uncategorized'
    END AS status
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
    'Sample Unknown Shops' AS report_type,
    s.id,
    s.name AS shop_name,
    s.address,
    s.city,
    s.subcategory AS current_subcategory
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
LIMIT 50;

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

