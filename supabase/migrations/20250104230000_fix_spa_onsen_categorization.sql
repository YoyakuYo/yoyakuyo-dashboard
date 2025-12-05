-- ============================================================================
-- FIX SPA, ONSEN & RELAXATION CATEGORIZATION
-- ============================================================================
-- This migration:
-- 1. Moves shops from parent "Spa, Onsen & Relaxation" to appropriate subcategories
-- 2. Finds shops in "Unknown" or other categories with spa/onsen-related names
-- 3. Categorizes them into: Spa, Massages, Onsen, or Ryokan Onsen
-- ============================================================================

DO $$
DECLARE
    parent_category_id UUID;
    spa_category_id UUID;
    massages_category_id UUID;
    onsen_category_id UUID;
    ryokan_onsen_category_id UUID;
    unknown_category_id UUID;
    shops_updated INTEGER := 0;
    total_updated INTEGER := 0;
BEGIN
    RAISE NOTICE '=== STARTING: Fix Spa, Onsen & Relaxation categorization ===';
    
    -- Get category IDs
    SELECT id INTO parent_category_id FROM categories WHERE name = 'Spa, Onsen & Relaxation';
    SELECT id INTO spa_category_id FROM categories WHERE name = 'Spa';
    SELECT id INTO massages_category_id FROM categories WHERE name = 'Massages';
    SELECT id INTO onsen_category_id FROM categories WHERE name = 'Onsen';
    SELECT id INTO ryokan_onsen_category_id FROM categories WHERE name = 'Ryokan Onsen';
    SELECT id INTO unknown_category_id FROM categories WHERE name = 'Unknown';
    
    -- ============================================================================
    -- STEP 1: Move shops from parent "Spa, Onsen & Relaxation" to subcategories
    -- ============================================================================
    RAISE NOTICE 'Step 1: Moving shops from parent category to subcategories...';
    
    -- 1.1: Onsen patterns (check first, most specific)
    IF onsen_category_id IS NOT NULL AND parent_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = onsen_category_id,
            subcategory = 'Onsen'
        WHERE category_id = parent_category_id
        AND (
            LOWER(name) LIKE '%onsen%' OR
            LOWER(name) LIKE '%温泉%' OR
            LOWER(name) LIKE '%hot spring%' OR
            LOWER(name) LIKE '%hotspring%' OR
            LOWER(subcategory) LIKE '%onsen%' OR
            LOWER(subcategory) LIKE '%温泉%'
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
    
    -- 1.2: Ryokan Onsen patterns
    IF ryokan_onsen_category_id IS NOT NULL AND parent_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = ryokan_onsen_category_id,
            subcategory = 'Ryokan Onsen'
        WHERE category_id = parent_category_id
        AND (
            (LOWER(name) LIKE '%ryokan%' AND (LOWER(name) LIKE '%onsen%' OR LOWER(name) LIKE '%温泉%')) OR
            LOWER(name) LIKE '%旅館%温泉%' OR
            LOWER(subcategory) LIKE '%ryokan%onsen%' OR
            LOWER(subcategory) LIKE '%ryokan%温泉%'
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
        RAISE NOTICE '  Updated % shops to Ryokan Onsen', shops_updated;
    END IF;
    
    -- 1.3: Massage patterns
    IF massages_category_id IS NOT NULL AND parent_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = massages_category_id,
            subcategory = 'Massages'
        WHERE category_id = parent_category_id
        AND (
            (LOWER(name) LIKE '%massage%' OR LOWER(name) LIKE '%マッサージ%') AND
            NOT (LOWER(name) LIKE '%spa%' OR LOWER(name) LIKE '%スパ%')
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
        RAISE NOTICE '  Updated % shops to Massages', shops_updated;
    END IF;
    
    -- 1.4: Spa patterns (default for remaining)
    IF spa_category_id IS NOT NULL AND parent_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = spa_category_id,
            subcategory = 'Spa'
        WHERE category_id = parent_category_id
        AND (
            LOWER(name) LIKE '%spa%' OR
            LOWER(name) LIKE '%スパ%' OR
            LOWER(name) LIKE '%relax%' OR
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
        )
        AND address IS NOT NULL 
        AND address != '';
        GET DIAGNOSTICS shops_updated = ROW_COUNT;
        total_updated := total_updated + shops_updated;
        RAISE NOTICE '  Updated % shops to Spa', shops_updated;
    END IF;
    
    -- 1.5: Default remaining shops in parent to Spa
    IF spa_category_id IS NOT NULL AND parent_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = spa_category_id,
            subcategory = 'Spa'
        WHERE category_id = parent_category_id
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
        RAISE NOTICE '  Updated % remaining shops to Spa (default)', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 2: Find and categorize shops in "Unknown" with spa/onsen-related names
    -- ============================================================================
    RAISE NOTICE 'Step 2: Categorizing Unknown shops with spa/onsen patterns...';
    
    -- 2.1: Onsen from Unknown
    IF onsen_category_id IS NOT NULL AND unknown_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = onsen_category_id,
            subcategory = 'Onsen'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%onsen%' OR
            LOWER(name) LIKE '%温泉%' OR
            LOWER(name) LIKE '%hot spring%' OR
            LOWER(name) LIKE '%hotspring%' OR
            LOWER(address) LIKE '%onsen%' OR
            LOWER(address) LIKE '%温泉%'
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
        RAISE NOTICE '  Updated % Unknown shops to Onsen', shops_updated;
    END IF;
    
    -- 2.2: Ryokan Onsen from Unknown
    IF ryokan_onsen_category_id IS NOT NULL AND unknown_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = ryokan_onsen_category_id,
            subcategory = 'Ryokan Onsen'
        WHERE category_id = unknown_category_id
        AND (
            (LOWER(name) LIKE '%ryokan%' AND (LOWER(name) LIKE '%onsen%' OR LOWER(name) LIKE '%温泉%')) OR
            LOWER(name) LIKE '%旅館%温泉%' OR
            LOWER(address) LIKE '%ryokan%onsen%' OR
            LOWER(address) LIKE '%ryokan%温泉%'
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
        RAISE NOTICE '  Updated % Unknown shops to Ryokan Onsen', shops_updated;
    END IF;
    
    -- 2.3: Massages from Unknown
    IF massages_category_id IS NOT NULL AND unknown_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = massages_category_id,
            subcategory = 'Massages'
        WHERE category_id = unknown_category_id
        AND (
            (LOWER(name) LIKE '%massage%' OR LOWER(name) LIKE '%マッサージ%') AND
            NOT (LOWER(name) LIKE '%spa%' OR LOWER(name) LIKE '%スパ%')
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
        RAISE NOTICE '  Updated % Unknown shops to Massages', shops_updated;
    END IF;
    
    -- 2.4: Spa from Unknown
    IF spa_category_id IS NOT NULL AND unknown_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = spa_category_id,
            subcategory = 'Spa'
        WHERE category_id = unknown_category_id
        AND (
            LOWER(name) LIKE '%spa%' OR
            LOWER(name) LIKE '%スパ%' OR
            LOWER(name) LIKE '%relax%' OR
            LOWER(name) LIKE '%リラク%' OR
            LOWER(address) LIKE '%spa%' OR
            LOWER(address) LIKE '%スパ%'
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
        RAISE NOTICE '  Updated % Unknown shops to Spa', shops_updated;
    END IF;
    
    -- ============================================================================
    -- STEP 3: Find and categorize shops in OTHER categories with spa/onsen-related names
    -- ============================================================================
    RAISE NOTICE 'Step 3: Categorizing mis-categorized shops from other categories...';
    
    -- 3.1: Onsen from other categories
    IF onsen_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = onsen_category_id,
            subcategory = 'Onsen'
        WHERE category_id NOT IN (
            SELECT id FROM categories WHERE name IN ('Spa, Onsen & Relaxation', 'Spa', 'Massages', 'Onsen', 'Ryokan Onsen', 'Unknown')
        )
        AND (
            LOWER(name) LIKE '%onsen%' OR
            LOWER(name) LIKE '%温泉%' OR
            LOWER(name) LIKE '%hot spring%' OR
            LOWER(name) LIKE '%hotspring%' OR
            LOWER(address) LIKE '%onsen%' OR
            LOWER(address) LIKE '%温泉%'
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
        RAISE NOTICE '  Updated % mis-categorized shops to Onsen', shops_updated;
    END IF;
    
    -- 3.2: Ryokan Onsen from other categories
    IF ryokan_onsen_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = ryokan_onsen_category_id,
            subcategory = 'Ryokan Onsen'
        WHERE category_id NOT IN (
            SELECT id FROM categories WHERE name IN ('Spa, Onsen & Relaxation', 'Spa', 'Massages', 'Onsen', 'Ryokan Onsen', 'Unknown')
        )
        AND (
            (LOWER(name) LIKE '%ryokan%' AND (LOWER(name) LIKE '%onsen%' OR LOWER(name) LIKE '%温泉%')) OR
            LOWER(name) LIKE '%旅館%温泉%' OR
            LOWER(address) LIKE '%ryokan%onsen%' OR
            LOWER(address) LIKE '%ryokan%温泉%'
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
        RAISE NOTICE '  Updated % mis-categorized shops to Ryokan Onsen', shops_updated;
    END IF;
    
    -- 3.3: Massages from other categories
    IF massages_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = massages_category_id,
            subcategory = 'Massages'
        WHERE category_id NOT IN (
            SELECT id FROM categories WHERE name IN ('Spa, Onsen & Relaxation', 'Spa', 'Massages', 'Onsen', 'Ryokan Onsen', 'Unknown')
        )
        AND (
            (LOWER(name) LIKE '%massage%' OR LOWER(name) LIKE '%マッサージ%') AND
            NOT (LOWER(name) LIKE '%spa%' OR LOWER(name) LIKE '%スパ%')
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
        RAISE NOTICE '  Updated % mis-categorized shops to Massages', shops_updated;
    END IF;
    
    -- 3.4: Spa from other categories
    IF spa_category_id IS NOT NULL THEN
        UPDATE shops
        SET category_id = spa_category_id,
            subcategory = 'Spa'
        WHERE category_id NOT IN (
            SELECT id FROM categories WHERE name IN ('Spa, Onsen & Relaxation', 'Spa', 'Massages', 'Onsen', 'Ryokan Onsen', 'Unknown')
        )
        AND (
            LOWER(name) LIKE '%spa%' OR
            LOWER(name) LIKE '%スパ%' OR
            LOWER(name) LIKE '%relax%' OR
            LOWER(name) LIKE '%リラク%' OR
            LOWER(address) LIKE '%spa%' OR
            LOWER(address) LIKE '%スパ%'
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
        RAISE NOTICE '  Updated % mis-categorized shops to Spa', shops_updated;
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

