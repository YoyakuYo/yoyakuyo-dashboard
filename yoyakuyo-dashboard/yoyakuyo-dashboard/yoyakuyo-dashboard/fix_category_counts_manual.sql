-- ============================================================================
-- FIX CATEGORY COUNT MULTIPLICATION - SAFE VERSION
-- ============================================================================
-- This script safely handles the case where shop_categories table may not exist
-- ============================================================================

-- ============================================================================
-- STEP 1: DIAGNOSTIC QUERIES (Safe - no shop_categories references)
-- ============================================================================

-- 1.1 Total shops count
SELECT COUNT(*) as total_shops FROM shops;

-- 1.2 Distinct shops count (should match total if no duplicates)
SELECT COUNT(DISTINCT id) as distinct_shops FROM shops;

-- 1.3 Check current category counts (may be inflated)
SELECT 
    c.id,
    c.name,
    COUNT(s.id) AS shop_count
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
WHERE (s.address IS NULL OR s.address != '')
AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
GROUP BY c.id, c.name
ORDER BY shop_count DESC;

-- ============================================================================
-- STEP 2: REMOVE DUPLICATES FROM shop_categories (if table exists)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'shop_categories'
    ) THEN
        -- Delete duplicate join rows, keeping only the first occurrence
        DELETE FROM shop_categories
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM shop_categories
            GROUP BY shop_id, category_id
        );
        
        RAISE NOTICE 'Removed duplicate entries from shop_categories table';
    ELSE
        RAISE NOTICE 'shop_categories table does not exist, skipping duplicate removal';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: ENFORCE UNIQUE CONSTRAINT ON shop_categories (if table exists)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'shop_categories'
    ) THEN
        -- Drop constraint if it already exists
        IF EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'unique_shop_category'
        ) THEN
            ALTER TABLE shop_categories DROP CONSTRAINT unique_shop_category;
        END IF;
        
        -- Add unique constraint
        ALTER TABLE shop_categories 
        ADD CONSTRAINT unique_shop_category UNIQUE (shop_id, category_id);
        
        RAISE NOTICE 'Added unique constraint to shop_categories table';
    ELSE
        RAISE NOTICE 'shop_categories table does not exist, skipping constraint addition';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: CREATE SQL FUNCTION FOR CORRECT COUNTING
-- ============================================================================

CREATE OR REPLACE FUNCTION get_category_shop_counts()
RETURNS TABLE (
    id UUID,
    name TEXT,
    shop_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if shop_categories table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'shop_categories'
    ) THEN
        -- Use join table with DISTINCT to prevent multiplication
        RETURN QUERY
        SELECT 
            c.id,
            c.name::TEXT,
            COUNT(DISTINCT s.id) AS shop_count
        FROM categories c
        LEFT JOIN shop_categories sc ON sc.category_id = c.id
        LEFT JOIN shops s ON s.id = sc.shop_id
        WHERE (s.address IS NULL OR s.address != '')
        AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
        GROUP BY c.id, c.name
        ORDER BY shop_count DESC;
    ELSE
        -- Use direct category_id with DISTINCT
        RETURN QUERY
        SELECT 
            c.id,
            c.name::TEXT,
            COUNT(DISTINCT s.id) AS shop_count
        FROM categories c
        LEFT JOIN shops s ON s.category_id = c.id
        WHERE (s.address IS NULL OR s.address != '')
        AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
        GROUP BY c.id, c.name
        ORDER BY shop_count DESC;
    END IF;
END;
$$;

-- ============================================================================
-- STEP 5: VERIFICATION QUERIES (Shows corrected counts with DISTINCT)
-- ============================================================================

-- Show corrected category counts using DISTINCT
SELECT 
    c.id,
    c.name,
    COUNT(DISTINCT s.id) AS shop_count
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
WHERE (s.address IS NULL OR s.address != '')
AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
GROUP BY c.id, c.name
ORDER BY shop_count DESC;

-- Verify total shop count
SELECT 
    COUNT(*) AS total_shops,
    COUNT(DISTINCT id) AS distinct_shops,
    COUNT(*) - COUNT(DISTINCT id) AS duplicate_shops
FROM shops
WHERE (address IS NULL OR address != '')
AND (claim_status IS NULL OR claim_status != 'hidden');

