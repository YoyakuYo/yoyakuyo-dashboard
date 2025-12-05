-- ============================================================================
-- REORGANIZE SPA, ONSEN & RELAXATION INTO 4 SUBCATEGORIES
-- ============================================================================
-- This migration reorganizes the "Spa, Onsen & Relaxation" category into 4 distinct subcategories:
-- 1. Spa (スパ, spa, relaxation, wellness)
-- 2. Massages (マッサージ, massage, 整体, therapy)
-- 3. Onsen (温泉, 共同浴場, 銭湯, hot springs, public baths)
-- 4. Ryokan Onsen (旅館温泉, ryokan with onsen, traditional inns with baths)
-- ============================================================================

DO $$
DECLARE
    parent_category_id UUID;
    spa_category_id UUID;
    massages_category_id UUID;
    onsen_category_id UUID;
    ryokan_onsen_category_id UUID;
    spa_massage_category_id UUID; -- Old combined category
    onsen_ryokan_category_id UUID; -- Old combined category
    shops_updated INTEGER := 0;
    total_updated INTEGER := 0;
BEGIN
    RAISE NOTICE '=== STARTING: Reorganize Spa, Onsen & Relaxation into 4 subcategories ===';
    
    -- Get category IDs
    SELECT id INTO parent_category_id FROM categories WHERE name = 'Spa, Onsen & Relaxation';
    SELECT id INTO spa_category_id FROM categories WHERE name = 'Spa';
    SELECT id INTO massages_category_id FROM categories WHERE name = 'Massages';
    SELECT id INTO onsen_category_id FROM categories WHERE name = 'Onsen';
    SELECT id INTO ryokan_onsen_category_id FROM categories WHERE name = 'Ryokan Onsen';
    SELECT id INTO spa_massage_category_id FROM categories WHERE name = 'Spa & Massage';
    SELECT id INTO onsen_ryokan_category_id FROM categories WHERE name = 'Onsen & Ryokan';
    
    -- ============================================================================
    -- STEP 1: Ensure parent category exists and create subcategories
    -- ============================================================================
    RAISE NOTICE 'Step 1: Ensuring parent category and all 4 subcategories exist...';
    
    -- Ensure parent category "Spa, Onsen & Relaxation" exists
    IF parent_category_id IS NULL THEN
        INSERT INTO categories (name, description)
        VALUES ('Spa, Onsen & Relaxation', 'Spas, onsen (hot springs), massage, relaxation services, ryokan baths')
        RETURNING id INTO parent_category_id;
        RAISE NOTICE '  ✅ Created parent category "Spa, Onsen & Relaxation"';
    ELSE
        RAISE NOTICE '  ✅ Parent category "Spa, Onsen & Relaxation" exists';
    END IF;
    
    -- Create Spa subcategory if it doesn't exist (under parent "Spa, Onsen & Relaxation")
    IF spa_category_id IS NULL THEN
        INSERT INTO categories (name, description)
        VALUES ('Spa', 'Spa treatments and wellness services')
        RETURNING id INTO spa_category_id;
        RAISE NOTICE '  ✅ Created Spa subcategory';
    ELSE
        RAISE NOTICE '  ✅ Spa subcategory exists';
    END IF;
    
    -- Create Massages subcategory if it doesn't exist (under parent "Spa, Onsen & Relaxation")
    IF massages_category_id IS NULL THEN
        INSERT INTO categories (name, description)
        VALUES ('Massages', 'Massage therapy and relaxation services')
        RETURNING id INTO massages_category_id;
        RAISE NOTICE '  ✅ Created Massages subcategory';
    ELSE
        RAISE NOTICE '  ✅ Massages subcategory exists';
    END IF;
    
    -- Create Onsen subcategory if it doesn't exist (under parent "Spa, Onsen & Relaxation")
    IF onsen_category_id IS NULL THEN
        INSERT INTO categories (name, description)
        VALUES ('Onsen', 'Traditional Japanese hot springs and public baths')
        RETURNING id INTO onsen_category_id;
        RAISE NOTICE '  ✅ Created Onsen subcategory';
    ELSE
        RAISE NOTICE '  ✅ Onsen subcategory exists';
    END IF;
    
    -- Create Ryokan Onsen subcategory if it doesn't exist (under parent "Spa, Onsen & Relaxation")
    IF ryokan_onsen_category_id IS NULL THEN
        INSERT INTO categories (name, description)
        VALUES ('Ryokan Onsen', 'Traditional Japanese inns with onsen facilities')
        RETURNING id INTO ryokan_onsen_category_id;
        RAISE NOTICE '  ✅ Created Ryokan Onsen subcategory';
    ELSE
        RAISE NOTICE '  ✅ Ryokan Onsen subcategory exists';
    END IF;
    
    -- ============================================================================
    -- STEP 2: Migrate shops from "Spa & Massage" to "Spa" or "Massages"
    -- ============================================================================
    RAISE NOTICE 'Step 2: Migrating shops from "Spa & Massage" to "Spa" or "Massages"...';
    
    IF spa_massage_category_id IS NOT NULL THEN
        -- First, identify Massage shops (more specific patterns)
        IF massages_category_id IS NOT NULL THEN
            UPDATE shops
            SET category_id = massages_category_id,
                subcategory = 'Massages'
            WHERE category_id = spa_massage_category_id
            AND (
                -- Massage-specific patterns
                LOWER(name) LIKE '%massage%' OR
                LOWER(name) LIKE '%マッサージ%' OR
                LOWER(name) LIKE '%整体%' OR
                LOWER(name) LIKE '%therapy%' OR
                LOWER(name) LIKE '%thai%' OR
                LOWER(name) LIKE '%タイ%' OR
                LOWER(name) LIKE '%foot%' OR
                LOWER(name) LIKE '%足%' OR
                LOWER(name) LIKE '%リンパ%' OR
                LOWER(name) LIKE '%lymph%' OR
                -- Address/description patterns
                LOWER(address) LIKE '%massage%' OR
                LOWER(address) LIKE '%マッサージ%' OR
                LOWER(COALESCE(description, '')) LIKE '%massage%' OR
                LOWER(COALESCE(description, '')) LIKE '%マッサージ%' OR
                LOWER(COALESCE(description, '')) LIKE '%整体%'
            )
            AND (
                -- Exclude if it's clearly a spa (not massage)
                NOT (LOWER(name) LIKE '%spa%' AND NOT (LOWER(name) LIKE '%massage%' OR LOWER(name) LIKE '%マッサージ%'))
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
            RAISE NOTICE '  ✅ Moved % shops from "Spa & Massage" to "Massages"', shops_updated;
        END IF;
        
        -- Remaining shops in "Spa & Massage" go to "Spa"
        IF spa_category_id IS NOT NULL THEN
            UPDATE shops
            SET category_id = spa_category_id,
                subcategory = 'Spa'
            WHERE category_id = spa_massage_category_id
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
            RAISE NOTICE '  ✅ Moved % remaining shops from "Spa & Massage" to "Spa"', shops_updated;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 3: Migrate shops from "Onsen & Ryokan" to "Onsen" or "Ryokan Onsen"
    -- ============================================================================
    RAISE NOTICE 'Step 3: Migrating shops from "Onsen & Ryokan" to "Onsen" or "Ryokan Onsen"...';
    
    IF onsen_ryokan_category_id IS NOT NULL THEN
        -- First, identify Ryokan Onsen shops (ryokan + onsen together)
        IF ryokan_onsen_category_id IS NOT NULL THEN
            UPDATE shops
            SET category_id = ryokan_onsen_category_id,
                subcategory = 'Ryokan Onsen'
            WHERE category_id = onsen_ryokan_category_id
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
            RAISE NOTICE '  ✅ Moved % shops from "Onsen & Ryokan" to "Ryokan Onsen"', shops_updated;
        END IF;
        
        -- Remaining shops in "Onsen & Ryokan" go to "Onsen"
        IF onsen_category_id IS NOT NULL THEN
            UPDATE shops
            SET category_id = onsen_category_id,
                subcategory = 'Onsen'
            WHERE category_id = onsen_ryokan_category_id
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
            RAISE NOTICE '  ✅ Moved % remaining shops from "Onsen & Ryokan" to "Onsen"', shops_updated;
        END IF;
    END IF;
    
    -- ============================================================================
    -- STEP 4: Migrate shops from parent "Spa, Onsen & Relaxation" to subcategories
    -- ============================================================================
    RAISE NOTICE 'Step 4: Migrating shops from parent category to subcategories...';
    
    IF parent_category_id IS NOT NULL THEN
        -- 4.1: Onsen shops (most specific, check first)
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
                LOWER(name) LIKE '%公衆浴場%' OR
                LOWER(name) LIKE '%日帰り温泉%' OR
                LOWER(name) LIKE '%hot spring%' OR
                LOWER(name) LIKE '%sento%' OR
                LOWER(subcategory) LIKE '%onsen%' OR
                LOWER(subcategory) LIKE '%温泉%'
            )
            AND (
                -- Exclude if it's clearly a ryokan
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
            RAISE NOTICE '  ✅ Moved % shops from parent to Onsen', shops_updated;
        END IF;
        
        -- 4.2: Ryokan Onsen shops
        IF ryokan_onsen_category_id IS NOT NULL THEN
            UPDATE shops
            SET category_id = ryokan_onsen_category_id,
                subcategory = 'Ryokan Onsen'
            WHERE category_id = parent_category_id
            AND (
                (LOWER(name) LIKE '%ryokan%' AND (LOWER(name) LIKE '%onsen%' OR LOWER(name) LIKE '%温泉%')) OR
                (LOWER(name) LIKE '%旅館%' AND (LOWER(name) LIKE '%温泉%' OR LOWER(name) LIKE '%onsen%')) OR
                LOWER(name) LIKE '%旅館温泉%' OR
                LOWER(subcategory) LIKE '%ryokan%onsen%'
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
            RAISE NOTICE '  ✅ Moved % shops from parent to Ryokan Onsen', shops_updated;
        END IF;
        
        -- 4.3: Massage shops
        IF massages_category_id IS NOT NULL THEN
            UPDATE shops
            SET category_id = massages_category_id,
                subcategory = 'Massages'
            WHERE category_id = parent_category_id
            AND (
                (LOWER(name) LIKE '%massage%' OR LOWER(name) LIKE '%マッサージ%' OR LOWER(name) LIKE '%整体%')
                AND NOT (LOWER(name) LIKE '%spa%' OR LOWER(name) LIKE '%スパ%')
                OR LOWER(subcategory) LIKE '%massage%' OR LOWER(subcategory) LIKE '%マッサージ%'
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
            RAISE NOTICE '  ✅ Moved % shops from parent to Massages', shops_updated;
        END IF;
        
        -- 4.4: Spa shops (default for remaining)
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
            RAISE NOTICE '  ✅ Moved % shops from parent to Spa', shops_updated;
        END IF;
        
        -- 4.5: Move any remaining shops in parent to Spa (default)
        IF spa_category_id IS NOT NULL THEN
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
            RAISE NOTICE '  ✅ Moved % remaining shops from parent to Spa (default)', shops_updated;
        END IF;
    END IF;
    
    RAISE NOTICE '=== COMPLETED: Total shops migrated: % ===', total_updated;
END $$;

-- ============================================================================
-- VERIFICATION: Check final distribution
-- ============================================================================
-- Show distribution across parent and subcategories
SELECT 
    'Final Distribution' AS report_type,
    c.name AS category_name,
    COUNT(*) AS shop_count,
    CASE 
        WHEN c.name = 'Spa, Onsen & Relaxation' THEN 'Parent Category'
        WHEN c.name IN ('Spa', 'Massages', 'Onsen', 'Ryokan Onsen') THEN 'Subcategory'
        ELSE 'Legacy Category'
    END AS category_type
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE c.name IN ('Spa, Onsen & Relaxation', 'Spa', 'Massages', 'Onsen', 'Ryokan Onsen', 'Spa & Massage', 'Onsen & Ryokan')
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
ORDER BY 
    CASE 
        WHEN c.name = 'Spa, Onsen & Relaxation' THEN 1
        WHEN c.name IN ('Spa', 'Massages', 'Onsen', 'Ryokan Onsen') THEN 2
        ELSE 3
    END,
    shop_count DESC;

-- Show total shops in all 4 subcategories (should be all shops, parent should have 0)
SELECT 
    'Subcategory Summary' AS report_type,
    COUNT(*) FILTER (WHERE c.name = 'Spa') AS spa_count,
    COUNT(*) FILTER (WHERE c.name = 'Massages') AS massages_count,
    COUNT(*) FILTER (WHERE c.name = 'Onsen') AS onsen_count,
    COUNT(*) FILTER (WHERE c.name = 'Ryokan Onsen') AS ryokan_onsen_count,
    COUNT(*) FILTER (WHERE c.name IN ('Spa', 'Massages', 'Onsen', 'Ryokan Onsen')) AS total_subcategories,
    COUNT(*) FILTER (WHERE c.name = 'Spa, Onsen & Relaxation') AS parent_count
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
AND s.address != '';

-- Show sample shops in each of the 4 subcategories
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
LIMIT 50;

