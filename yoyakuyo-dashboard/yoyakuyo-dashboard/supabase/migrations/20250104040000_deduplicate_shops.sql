-- ============================================================================
-- DEDUPLICATE SHOPS - SOFT DELETE DUPLICATES
-- ============================================================================
-- This migration identifies and soft-deletes duplicate shops
-- Priority: Restaurants first, then all other categories
-- Keeps the OLDEST record, soft-deletes newer duplicates
-- ============================================================================

-- ============================================================================
-- STEP 0: Ensure deleted_at column exists (create if missing)
-- ============================================================================
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DO $$
DECLARE
    shops_soft_deleted INTEGER := 0;
    restaurant_duplicates INTEGER := 0;
    other_duplicates INTEGER := 0;
    shop_record RECORD;
    kept_id UUID;
BEGIN
    RAISE NOTICE '=== STARTING: Deduplicating shops ===';
    
    -- ============================================================================
    -- STEP 1: DEDUPLICATE RESTAURANTS FIRST
    -- ============================================================================
    RAISE NOTICE 'Step 1: Deduplicating restaurants...';
    
    -- Create temporary table for restaurant duplicates
    CREATE TEMP TABLE restaurant_duplicate_groups AS
    SELECT 
        s.id,
        s.name,
        s.unique_id,
        s.latitude,
        s.longitude,
        s.created_at,
        COALESCE(s.unique_id, 
            CONCAT(
                COALESCE(s.name, ''), 
                '|', 
                COALESCE(ROUND(s.latitude::numeric, 4)::text, ''), 
                '|', 
                COALESCE(ROUND(s.longitude::numeric, 4)::text, '')
            )
        ) AS duplicate_key
    FROM shops s
    JOIN categories c ON s.category_id = c.id
    WHERE 
        c.name = 'Restaurant'
        AND s.deleted_at IS NULL
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'claim_status'
            )
            OR s.claim_status IS NULL 
            OR s.claim_status != 'hidden'
        )
        AND s.address IS NOT NULL 
        AND s.address != '';
    
    -- For each duplicate group, keep the oldest, soft-delete the rest
    FOR shop_record IN 
        SELECT duplicate_key 
        FROM (
            SELECT duplicate_key, COUNT(*) as cnt
            FROM restaurant_duplicate_groups
            GROUP BY duplicate_key
            HAVING COUNT(*) > 1
        ) duplicates
    LOOP
        -- Find the oldest record (keep this one)
        SELECT id INTO kept_id
        FROM restaurant_duplicate_groups
        WHERE duplicate_key = shop_record.duplicate_key
        ORDER BY created_at ASC, id ASC
        LIMIT 1;
        
        -- Soft-delete all other records in this group
        UPDATE shops
        SET 
            deleted_at = NOW(),
            updated_at = NOW()
        WHERE 
            id IN (
                SELECT id 
                FROM restaurant_duplicate_groups
                WHERE duplicate_key = shop_record.duplicate_key
                AND id != kept_id
            )
            AND deleted_at IS NULL;
        
        GET DIAGNOSTICS shops_soft_deleted = ROW_COUNT;
        restaurant_duplicates := restaurant_duplicates + shops_soft_deleted;
        
        IF shops_soft_deleted > 0 THEN
            RAISE NOTICE 'Restaurant group "%": Kept % (oldest), soft-deleted % duplicates', 
                shop_record.duplicate_key, kept_id, shops_soft_deleted;
        END IF;
    END LOOP;
    
    DROP TABLE restaurant_duplicate_groups;
    RAISE NOTICE 'Restaurant deduplication complete: % duplicates soft-deleted', restaurant_duplicates;
    
    -- ============================================================================
    -- STEP 2: DEDUPLICATE ALL OTHER SHOPS
    -- ============================================================================
    RAISE NOTICE 'Step 2: Deduplicating all other shops...';
    
    -- Create temporary table for all other duplicates
    CREATE TEMP TABLE all_duplicate_groups AS
    SELECT 
        s.id,
        s.name,
        s.unique_id,
        s.latitude,
        s.longitude,
        s.created_at,
        c.name AS category_name,
        COALESCE(s.unique_id, 
            CONCAT(
                COALESCE(s.name, ''), 
                '|', 
                COALESCE(ROUND(s.latitude::numeric, 4)::text, ''), 
                '|', 
                COALESCE(ROUND(s.longitude::numeric, 4)::text, '')
            )
        ) AS duplicate_key
    FROM shops s
    LEFT JOIN categories c ON s.category_id = c.id
    WHERE 
        s.deleted_at IS NULL
        AND (
            NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'shops' AND column_name = 'claim_status'
            )
            OR s.claim_status IS NULL 
            OR s.claim_status != 'hidden'
        )
        AND s.address IS NOT NULL 
        AND s.address != ''
        AND (c.name IS NULL OR c.name != 'Restaurant');  -- Exclude restaurants (already done)
    
    -- For each duplicate group, keep the oldest, soft-delete the rest
    FOR shop_record IN 
        SELECT duplicate_key 
        FROM (
            SELECT duplicate_key, COUNT(*) as cnt
            FROM all_duplicate_groups
            GROUP BY duplicate_key
            HAVING COUNT(*) > 1
        ) duplicates
    LOOP
        -- Find the oldest record (keep this one)
        SELECT id INTO kept_id
        FROM all_duplicate_groups
        WHERE duplicate_key = shop_record.duplicate_key
        ORDER BY created_at ASC, id ASC
        LIMIT 1;
        
        -- Soft-delete all other records in this group
        UPDATE shops
        SET 
            deleted_at = NOW(),
            updated_at = NOW()
        WHERE 
            id IN (
                SELECT id 
                FROM all_duplicate_groups
                WHERE duplicate_key = shop_record.duplicate_key
                AND id != kept_id
            )
            AND deleted_at IS NULL;
        
        GET DIAGNOSTICS shops_soft_deleted = ROW_COUNT;
        other_duplicates := other_duplicates + shops_soft_deleted;
        
        IF shops_soft_deleted > 0 THEN
            RAISE NOTICE 'Group "%": Kept % (oldest), soft-deleted % duplicates', 
                shop_record.duplicate_key, kept_id, shops_soft_deleted;
        END IF;
    END LOOP;
    
    DROP TABLE all_duplicate_groups;
    RAISE NOTICE 'Other shops deduplication complete: % duplicates soft-deleted', other_duplicates;
    
    RAISE NOTICE '=== COMPLETE: Total duplicates soft-deleted: % (Restaurants: %, Others: %) ===', 
        restaurant_duplicates + other_duplicates, restaurant_duplicates, other_duplicates;
END $$;

-- ============================================================================
-- VERIFICATION: Check remaining duplicates
-- ============================================================================
SELECT 
    'Remaining duplicates after cleanup' AS status,
    COUNT(*) AS duplicate_group_count,
    SUM(duplicate_count - 1) AS total_duplicate_shops
FROM (
    SELECT 
        COALESCE(unique_id, 
            CONCAT(
                COALESCE(name, ''), 
                '|', 
                COALESCE(ROUND(latitude::numeric, 4)::text, ''), 
                '|', 
                COALESCE(ROUND(longitude::numeric, 4)::text, '')
            )
        ) AS duplicate_key,
        COUNT(*) AS duplicate_count
    FROM shops
    WHERE deleted_at IS NULL
    GROUP BY 
        COALESCE(unique_id, 
            CONCAT(
                COALESCE(name, ''), 
                '|', 
                COALESCE(ROUND(latitude::numeric, 4)::text, ''), 
                '|', 
                COALESCE(ROUND(longitude::numeric, 4)::text, '')
            )
        )
    HAVING COUNT(*) > 1
) duplicates;

