-- ============================================================================
-- FIX CATEGORY COUNT MULTIPLICATION
-- ============================================================================
-- This migration fixes data multiplication issues where category counts
-- are inflated due to duplicate join table entries or incorrect counting queries
-- ============================================================================

-- ============================================================================
-- STEP 1: DIAGNOSTIC QUERIES (for verification)
-- ============================================================================

-- 1.1 Total shops count
SELECT COUNT(*) as total_shops FROM shops;

-- 1.2 Distinct shops count (should match total if no duplicates)
SELECT COUNT(DISTINCT id) as distinct_shops FROM shops;

-- 1.3 Check for duplicate shop_categories entries (if table exists)
-- NOTE: These queries are commented out because shop_categories may not exist
-- Uncomment only if you know the table exists:
-- SELECT shop_id, category_id, COUNT(*) as duplicate_count
-- FROM shop_categories
-- GROUP BY shop_id, category_id
-- HAVING COUNT(*) > 1
-- ORDER BY duplicate_count DESC
-- LIMIT 20;

-- 1.4 Check category counts by shop_categories (if table exists)
-- NOTE: Uncomment only if shop_categories table exists:
-- SELECT category_id, COUNT(*) as total_links
-- FROM shop_categories
-- GROUP BY category_id
-- ORDER BY total_links DESC;

-- ============================================================================
-- STEP 2: REMOVE DUPLICATES FROM shop_categories (if table exists)
-- ============================================================================

-- Check if shop_categories table exists and remove duplicates
DO $$
BEGIN
    -- Check if shop_categories table exists
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

-- Add unique constraint to prevent future duplicates
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
-- STEP 4: VERIFY CURRENT COUNTING METHOD
-- ============================================================================
-- The issue is likely in the API query. The correct query should use DISTINCT
-- when counting shops through any join table. This migration ensures data integrity.
-- ============================================================================

-- ============================================================================
-- STEP 5: VERIFICATION QUERIES
-- ============================================================================

-- 5.1 Create SQL function for correct category counting
-- This function will be used by the API to get accurate counts with DISTINCT
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

-- 5.2 Show current category distribution (corrected with DISTINCT)
-- This query will show the REAL counts after fixing duplicates
SELECT 
    c.id,
    c.name,
    COUNT(DISTINCT s.id) AS shop_count
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
WHERE s.address != ''
AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
GROUP BY c.id, c.name
ORDER BY shop_count DESC;

-- 5.3 If shop_categories exists, show counts using join table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'shop_categories'
    ) THEN
        -- This query uses the join table with DISTINCT to prevent multiplication
        PERFORM 1; -- Placeholder, actual query shown in comment below
        /*
        SELECT 
            c.id,
            c.name,
            COUNT(DISTINCT s.id) AS shop_count
        FROM categories c
        LEFT JOIN shop_categories sc ON sc.category_id = c.id
        LEFT JOIN shops s ON s.id = sc.shop_id
        WHERE s.address != ''
        AND (s.claim_status IS NULL OR s.claim_status != 'hidden')
        GROUP BY c.id, c.name
        ORDER BY shop_count DESC;
        */
    END IF;
END $$;

-- 5.4 Total shop count verification
SELECT 
    COUNT(*) AS total_shops,
    COUNT(DISTINCT id) AS distinct_shops,
    COUNT(*) - COUNT(DISTINCT id) AS duplicate_shops
FROM shops
WHERE address != ''
AND (claim_status IS NULL OR claim_status != 'hidden');

