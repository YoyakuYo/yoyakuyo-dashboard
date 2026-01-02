-- ============================================================================
-- COMPREHENSIVE SPA, ONSEN & RELAXATION CATEGORIZATION FIX
-- ============================================================================
-- This migration finds ALL shops that should be in Spa/Onsen/Massages categories
-- from ANY category (including Unknown, parent category, or wrong categories)
-- and categorizes them into appropriate subcategories:
-- - Onsen (温泉, 共同浴場, 銭湯, sento, public bath)
-- - Ryokan Onsen (旅館温泉, ryokan with onsen)
-- - Massages (マッサージ, massage, 整体)
-- - Spa (スパ, spa, relaxation)
-- ============================================================================

DO $$
DECLARE
    parent_category_id UUID;
    spa_category_id UUID;
    massages_category_id UUID;
    onsen_category_id UUID;
    ryokan_onsen_category_id UUID;
    shops_updated INTEGER := 0;
    total_updated INTEGER := 0;
BEGIN
    RAISE NOTICE '=== STARTING: Comprehensive Spa, Onsen & Relaxation Fix ===';
    
    -- Get category IDs
    SELECT id INTO parent_category_id FROM categories WHERE name = 'Spa, Onsen & Relaxation';
    SELECT id INTO spa_category_id FROM categories WHERE name = 'Spa';
    SELECT id INTO massages_category_id FROM categories WHERE name = 'Massages';
    SELECT id INTO onsen_category_id FROM categories WHERE name = 'Onsen';
    SELECT id INTO ryokan_onsen_category_id FROM categories WHERE name = 'Ryokan Onsen';
    
    -- ============================================================================
    -- STEP 1: Find and categorize ONSEN shops (public bathhouses, hot springs)
    -- ============================================================================
    RAISE NOTICE 'Step 1: Categorizing Onsen shops...';
    
    IF onsen_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = onsen_category_id,
            subcategory = 'Onsen'
        WHERE category_id != onsen_category_id
        AND (
            -- Japanese onsen terms
            LOWER(name) LIKE '%温泉%' OR
            LOWER(name) LIKE '%共同浴場%' OR
            LOWER(name) LIKE '%銭湯%' OR
            LOWER(name) LIKE '%公衆浴場%' OR
            LOWER(name) LIKE '%日帰り温泉%' OR
            LOWER(name) LIKE '%露天風呂%' OR
            LOWER(name) LIKE '%湯%' OR
            -- English onsen terms
            LOWER(name) LIKE '%onsen%' OR
            LOWER(name) LIKE '%hot spring%' OR
            LOWER(name) LIKE '%hotspring%' OR
            LOWER(name) LIKE '%public bath%' OR
            LOWER(name) LIKE '%sento%' OR
            -- Address patterns
            LOWER(address) LIKE '%温泉%' OR
            LOWER(address) LIKE '%共同浴場%' OR
            LOWER(address) LIKE '%銭湯%' OR
            -- Description patterns
            LOWER(COALESCE(description, '')) LIKE '%温泉%' OR
            LOWER(COALESCE(description, '')) LIKE '%onsen%' OR
            LOWER(COALESCE(description, '')) LIKE '%hot spring%' OR
            LOWER(COALESCE(description, '')) LIKE '%共同浴場%' OR
            LOWER(COALESCE(description, '')) LIKE '%銭湯%'
        )
        AND (
            -- Exclude if it's clearly a ryokan (check for ryokan + onsen together)
            NOT (LOWER(name) LIKE '%ryokan%' AND (LOWER(name) LIKE '%onsen%' OR LOWER(name) LIKE '%温泉%'))
            AND NOT (LOWER(name) LIKE '%旅館%' AND (LOWER(name) LIKE '%温泉%' OR LOWER(name) LIKE '%onsen%'))
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
        RAISE NOTICE '  ✅ Updated % shops to Onsen', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 2: Find and categorize RYOKAN ONSEN shops
    -- ============================================================================
    RAISE NOTICE 'Step 2: Categorizing Ryokan Onsen shops...';
    
    IF ryokan_onsen_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = ryokan_onsen_category_id,
            subcategory = 'Ryokan Onsen'
        WHERE category_id != ryokan_onsen_category_id
        AND (
            -- Ryokan + Onsen patterns
            (LOWER(name) LIKE '%ryokan%' AND (LOWER(name) LIKE '%onsen%' OR LOWER(name) LIKE '%温泉%')) OR
            (LOWER(name) LIKE '%旅館%' AND (LOWER(name) LIKE '%温泉%' OR LOWER(name) LIKE '%onsen%')) OR
            LOWER(name) LIKE '%旅館温泉%' OR
            LOWER(name) LIKE '%ryokan%onsen%' OR
            -- Address/description patterns
            (LOWER(address) LIKE '%ryokan%' AND (LOWER(address) LIKE '%onsen%' OR LOWER(address) LIKE '%温泉%')) OR
            (LOWER(COALESCE(description, '')) LIKE '%ryokan%' AND (LOWER(COALESCE(description, '')) LIKE '%onsen%' OR LOWER(COALESCE(description, '')) LIKE '%温泉%'))
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
        RAISE NOTICE '  ✅ Updated % shops to Ryokan Onsen', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 3: Find and categorize MASSAGE shops
    -- ============================================================================
    RAISE NOTICE 'Step 3: Categorizing Massage shops...';
    
    IF massages_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = massages_category_id,
            subcategory = 'Massages'
        WHERE category_id != massages_category_id
        AND (
            -- Massage patterns (but NOT spa)
            (LOWER(name) LIKE '%massage%' OR LOWER(name) LIKE '%マッサージ%' OR LOWER(name) LIKE '%整体%')
            AND NOT (LOWER(name) LIKE '%spa%' OR LOWER(name) LIKE '%スパ%')
            OR
            -- Address/description patterns
            ((LOWER(address) LIKE '%massage%' OR LOWER(address) LIKE '%マッサージ%') 
             AND NOT (LOWER(address) LIKE '%spa%' OR LOWER(address) LIKE '%スパ%'))
            OR
            ((LOWER(COALESCE(description, '')) LIKE '%massage%' OR LOWER(COALESCE(description, '')) LIKE '%マッサージ%')
             AND NOT (LOWER(COALESCE(description, '')) LIKE '%spa%' OR LOWER(COALESCE(description, '')) LIKE '%スパ%'))
        )
        AND (
            -- Exclude if it's clearly onsen or ryokan
            NOT (LOWER(name) LIKE '%onsen%' OR LOWER(name) LIKE '%温泉%' OR LOWER(name) LIKE '%ryokan%' OR LOWER(name) LIKE '%旅館%')
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
        RAISE NOTICE '  ✅ Updated % shops to Massages', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 4: Find and categorize SPA shops
    -- ============================================================================
    RAISE NOTICE 'Step 4: Categorizing Spa shops...';
    
    IF spa_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = spa_category_id,
            subcategory = 'Spa'
        WHERE category_id != spa_category_id
        AND (
            -- Spa patterns
            LOWER(name) LIKE '%spa%' OR
            LOWER(name) LIKE '%スパ%' OR
            LOWER(name) LIKE '%relaxation%' OR
            LOWER(name) LIKE '%リラクゼーション%' OR
            LOWER(name) LIKE '%リラク%' OR
            -- Address/description patterns
            LOWER(address) LIKE '%spa%' OR
            LOWER(address) LIKE '%スパ%' OR
            LOWER(COALESCE(description, '')) LIKE '%spa%' OR
            LOWER(COALESCE(description, '')) LIKE '%スパ%' OR
            LOWER(COALESCE(description, '')) LIKE '%relaxation%' OR
            LOWER(COALESCE(description, '')) LIKE '%リラクゼーション%'
        )
        AND (
            -- Exclude if it's clearly onsen, ryokan, or massage
            NOT (LOWER(name) LIKE '%onsen%' OR LOWER(name) LIKE '%温泉%' OR 
                 LOWER(name) LIKE '%ryokan%' OR LOWER(name) LIKE '%旅館%' OR
                 LOWER(name) LIKE '%massage%' OR LOWER(name) LIKE '%マッサージ%')
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
        RAISE NOTICE '  ✅ Updated % shops to Spa', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 5: Move shops from parent "Spa, Onsen & Relaxation" to subcategories
    -- ============================================================================
    RAISE NOTICE 'Step 5: Moving shops from parent category to subcategories...';
    
    IF parent_category_id IS NOT NULL THEN
        -- Move to Onsen
        IF onsen_category_id IS NOT NULL THEN
            UPDATE shops
            SET category_id = onsen_category_id,
                subcategory = 'Onsen'
            WHERE category_id = parent_category_id
            AND (
                LOWER(name) LIKE '%onsen%' OR
                LOWER(name) LIKE '%温泉%' OR
                LOWER(name) LIKE '%共同浴場%' OR
                LOWER(name) LIKE '%銭湯%' OR
                LOWER(name) LIKE '%hot spring%' OR
                LOWER(subcategory) LIKE '%onsen%' OR
                LOWER(subcategory) LIKE '%温泉%'
            )
            AND (
                NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'shops' AND column_name = 'deleted_at'
                )
                OR deleted_at IS NULL
            );
            GET DIAGNOSTICS shops_updated = ROW_COUNT;
            total_updated := total_updated + shops_updated;
            RAISE NOTICE '  ✅ Moved % shops from parent to Onsen', shops_updated;
        END IF;
        
        -- Move to Ryokan Onsen
        IF ryokan_onsen_category_id IS NOT NULL THEN
            UPDATE shops
            SET category_id = ryokan_onsen_category_id,
                subcategory = 'Ryokan Onsen'
            WHERE category_id = parent_category_id
            AND (
                (LOWER(name) LIKE '%ryokan%' AND (LOWER(name) LIKE '%onsen%' OR LOWER(name) LIKE '%温泉%')) OR
                LOWER(name) LIKE '%旅館温泉%' OR
                LOWER(subcategory) LIKE '%ryokan%onsen%'
            )
            AND (
                NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'shops' AND column_name = 'deleted_at'
                )
                OR deleted_at IS NULL
            );
            GET DIAGNOSTICS shops_updated = ROW_COUNT;
            total_updated := total_updated + shops_updated;
            RAISE NOTICE '  ✅ Moved % shops from parent to Ryokan Onsen', shops_updated;
        END IF;
        
        -- Move to Massages
        IF massages_category_id IS NOT NULL THEN
            UPDATE shops
            SET category_id = massages_category_id,
                subcategory = 'Massages'
            WHERE category_id = parent_category_id
            AND (
                (LOWER(name) LIKE '%massage%' OR LOWER(name) LIKE '%マッサージ%')
                AND NOT (LOWER(name) LIKE '%spa%' OR LOWER(name) LIKE '%スパ%')
                OR LOWER(subcategory) LIKE '%massage%' OR LOWER(subcategory) LIKE '%マッサージ%'
            )
            AND (
                NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'shops' AND column_name = 'deleted_at'
                )
                OR deleted_at IS NULL
            );
            GET DIAGNOSTICS shops_updated = ROW_COUNT;
            total_updated := total_updated + shops_updated;
            RAISE NOTICE '  ✅ Moved % shops from parent to Massages', shops_updated;
        END IF;
        
        -- Move to Spa (default for remaining)
        IF spa_category_id IS NOT NULL THEN
            UPDATE shops
            SET category_id = spa_category_id,
                subcategory = 'Spa'
            WHERE category_id = parent_category_id
            AND (
                LOWER(name) LIKE '%spa%' OR
                LOWER(name) LIKE '%スパ%' OR
                LOWER(name) LIKE '%relaxation%' OR
                LOWER(name) LIKE '%リラク%' OR
                LOWER(subcategory) LIKE '%spa%' OR
                LOWER(subcategory) LIKE '%スパ%'
            )
            AND (
                NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'shops' AND column_name = 'deleted_at'
                )
                OR deleted_at IS NULL
            );
            GET DIAGNOSTICS shops_updated = ROW_COUNT;
            total_updated := total_updated + shops_updated;
            RAISE NOTICE '  ✅ Moved % shops from parent to Spa', shops_updated;
        END IF;
        
        -- Move remaining to Onsen (default for any remaining in parent)
        IF onsen_category_id IS NOT NULL THEN
            UPDATE shops
            SET category_id = onsen_category_id,
                subcategory = 'Onsen'
            WHERE category_id = parent_category_id
            AND (
                NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'shops' AND column_name = 'deleted_at'
                )
                OR deleted_at IS NULL
            );
            GET DIAGNOSTICS shops_updated = ROW_COUNT;
            total_updated := total_updated + shops_updated;
            RAISE NOTICE '  ✅ Moved % remaining shops from parent to Onsen', shops_updated;
        END IF;
    END IF;
    
    RAISE NOTICE '=== COMPLETED: Total shops categorized: % ===', total_updated;
END $$;

-- ============================================================================
-- VERIFICATION: Check final distribution
-- ============================================================================
SELECT 
    'Final Distribution' AS report_type,
    c.name AS category_name,
    COUNT(*) AS shop_count
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name IN ('Spa, Onsen & Relaxation', 'Spa', 'Massages', 'Onsen', 'Ryokan Onsen')
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

-- Show sample shops in each subcategory
SELECT 
    'Sample Shops' AS report_type,
    c.name AS category_name,
    s.name AS shop_name,
    s.address
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name IN ('Spa', 'Massages', 'Onsen', 'Ryokan Onsen')
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
ORDER BY c.name, s.name
LIMIT 20;

