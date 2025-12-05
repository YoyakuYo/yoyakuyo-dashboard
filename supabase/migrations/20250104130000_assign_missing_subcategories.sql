-- ============================================================================
-- ASSIGN MISSING SUBCATEGORIES - FIX 30,566 SHOPS
-- ============================================================================
-- This migration assigns subcategories to shops based on their category_id
-- Strategy: Use the category name as the subcategory (1:1 mapping)
-- ============================================================================

DO $$
DECLARE
    shops_updated INTEGER := 0;
    total_updated INTEGER := 0;
    category_record RECORD;
BEGIN
    RAISE NOTICE '=== STARTING: Assigning missing subcategories ===';
    
    -- ============================================================================
    -- STEP 1: Assign subcategory based on category name
    -- ============================================================================
    -- For each category, set the subcategory to match the category name
    -- This creates a 1:1 mapping where category = subcategory
    
    FOR category_record IN 
        SELECT DISTINCT c.id, c.name
        FROM categories c
        JOIN shops s ON s.category_id = c.id
        WHERE (s.subcategory IS NULL OR s.subcategory = '')
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'deleted_at'
            )
            OR s.deleted_at IS NULL
        )
        AND s.address IS NOT NULL 
        AND s.address != ''
    LOOP
        UPDATE shops
        SET subcategory = category_record.name
        WHERE category_id = category_record.id
        AND (subcategory IS NULL OR subcategory = '')
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
        RAISE NOTICE 'Updated % shops to subcategory: %', shops_updated, category_record.name;
    END LOOP;
    
    RAISE NOTICE '=== COMPLETED: Total shops updated: % ===', total_updated;
END $$;

-- ============================================================================
-- VERIFICATION: Show updated subcategory distribution
-- ============================================================================
SELECT 
    'Subcategory Assignment Results' AS report_type,
    COALESCE(subcategory, 'No Subcategory') AS subcategory_name,
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
FROM shops
WHERE (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != ''
GROUP BY subcategory
ORDER BY shop_count DESC;

-- ============================================================================
-- VERIFICATION: Shops still without subcategory (should be 0 or very low)
-- ============================================================================
SELECT 
    'Remaining Shops Without Subcategory' AS report_type,
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
        WHEN COUNT(*) = 0 THEN '✅ PASS - All shops have subcategory'
        WHEN COUNT(*) < 100 THEN '⚠️ WARNING - Few shops missing subcategory'
        ELSE '❌ FAIL - Many shops still missing subcategory'
    END AS status
FROM shops
WHERE (subcategory IS NULL OR subcategory = '')
AND (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR deleted_at IS NULL
)
AND address IS NOT NULL 
AND address != '';

-- ============================================================================
-- VERIFICATION: Category + Subcategory alignment check
-- ============================================================================
SELECT 
    'Category-Subcategory Alignment' AS report_type,
    c.name AS category_name,
    s.subcategory AS subcategory_name,
    COUNT(*) AS shop_count,
    CASE 
        WHEN c.name = s.subcategory THEN '✅ Aligned'
        ELSE '⚠️ Mismatch'
    END AS alignment_status
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE (
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    )
    OR s.deleted_at IS NULL
)
AND s.address IS NOT NULL 
AND s.address != ''
AND s.subcategory IS NOT NULL
AND s.subcategory != ''
GROUP BY c.name, s.subcategory
ORDER BY shop_count DESC
LIMIT 50;

