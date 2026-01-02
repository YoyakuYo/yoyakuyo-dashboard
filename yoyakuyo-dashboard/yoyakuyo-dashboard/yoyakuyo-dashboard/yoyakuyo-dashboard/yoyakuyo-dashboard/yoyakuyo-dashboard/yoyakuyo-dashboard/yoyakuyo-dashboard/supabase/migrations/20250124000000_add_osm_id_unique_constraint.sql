-- Migration: Add unique constraint on osm_id for shops
-- This ensures no duplicate shops can be inserted with the same OSM ID
-- Run this migration to prevent duplicate shops from OpenStreetMap

-- Step 1: Check for duplicate osm_id values (REPORT ONLY - NO DELETION)
-- This step only reports duplicates - it does NOT delete anything
-- You can manually review and remove duplicates if needed
DO $$
DECLARE
    duplicate_count INTEGER;
    duplicate_osm_ids TEXT[];
BEGIN
    -- Count duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT osm_id, COUNT(*) as cnt
        FROM shops
        WHERE osm_id IS NOT NULL
        GROUP BY osm_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE WARNING '⚠️  Found % duplicate osm_id values. Unique constraint cannot be added until duplicates are removed.', duplicate_count;
        RAISE NOTICE 'To view duplicates, run: SELECT osm_id, COUNT(*) FROM shops WHERE osm_id IS NOT NULL GROUP BY osm_id HAVING COUNT(*) > 1;';
        RAISE NOTICE 'To remove duplicates (keeps first occurrence), uncomment the DELETE statement below and run again.';
        RAISE NOTICE 'IMPORTANT: Review duplicates manually before removing!';
        
        -- OPTIONAL: Uncomment below to automatically remove duplicates (keeps first occurrence)
        -- WARNING: This will DELETE duplicate shops. Review first!
        /*
        DELETE FROM shops
        WHERE id IN (
            SELECT id
            FROM (
                SELECT id,
                       ROW_NUMBER() OVER (PARTITION BY osm_id ORDER BY created_at ASC) as rn
                FROM shops
                WHERE osm_id IS NOT NULL
            ) ranked
            WHERE rn > 1
        );
        RAISE NOTICE 'Removed duplicate shops. Re-run migration to add unique constraint.';
        */
    ELSE
        RAISE NOTICE '✅ No duplicate osm_id values found. Safe to add unique constraint.';
    END IF;
END $$;

-- Step 2: Create unique index on osm_id (allows NULL values)
-- Using UNIQUE INDEX instead of UNIQUE CONSTRAINT to allow NULL values
-- NOTE: This will FAIL if duplicates exist. Remove duplicates first (see Step 1).

-- Check if duplicates exist before creating index
DO $$
DECLARE
    has_duplicates BOOLEAN;
BEGIN
    -- Check if duplicates exist
    SELECT EXISTS (
        SELECT 1
        FROM shops
        WHERE osm_id IS NOT NULL
        GROUP BY osm_id
        HAVING COUNT(*) > 1
    ) INTO has_duplicates;
    
    IF has_duplicates THEN
        RAISE EXCEPTION 'Cannot create unique index: Duplicate osm_id values exist. Please remove duplicates first (see Step 1 comments for optional DELETE statement).';
    END IF;
END $$;

-- Create unique index (only runs if no duplicates exist)
CREATE UNIQUE INDEX IF NOT EXISTS shops_osm_id_unique_idx 
ON shops(osm_id) 
WHERE osm_id IS NOT NULL;

-- Step 3: Add comment
COMMENT ON INDEX shops_osm_id_unique_idx IS 'Ensures each OSM ID appears only once in shops table (NULL values allowed)';

-- Step 4: Verify the index was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'shops_osm_id_unique_idx'
    ) THEN
        RAISE NOTICE '✅ Unique index on osm_id created successfully';
    ELSE
        RAISE WARNING '⚠️  Failed to create unique index on osm_id';
    END IF;
END $$;

