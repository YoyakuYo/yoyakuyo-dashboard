-- Migration: Add unique_id column to shops table for multi-source import
-- This allows tracking shops from different sources (Government Data, Tourism API, Hot Pepper, OSM)
-- unique_id format: "source:external_id" (e.g., "gov:12345", "tourism:67890", "hotpepper:abc123", "osm:12345678")

-- Step 1: Add unique_id column if it doesn't exist
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS unique_id TEXT;

-- Step 2: Create index for faster duplicate checks
CREATE INDEX IF NOT EXISTS shops_unique_id_idx ON shops(unique_id) WHERE unique_id IS NOT NULL;

-- Step 3: Check for existing duplicate unique_id values (REPORT ONLY - NO DELETION)
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Count duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT unique_id, COUNT(*) as cnt
        FROM shops
        WHERE unique_id IS NOT NULL
        GROUP BY unique_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE WARNING '⚠️  Found % duplicate unique_id values. Unique constraint cannot be added until duplicates are removed.', duplicate_count;
        RAISE NOTICE 'To view duplicates, run: SELECT unique_id, COUNT(*) FROM shops WHERE unique_id IS NOT NULL GROUP BY unique_id HAVING COUNT(*) > 1;';
    ELSE
        RAISE NOTICE '✅ No duplicate unique_id values found. Safe to add unique constraint.';
    END IF;
END $$;

-- Step 4: Create unique index on unique_id (allows NULL values)
-- Check if duplicates exist before creating index
DO $$
DECLARE
    has_duplicates BOOLEAN;
BEGIN
    -- Check if duplicates exist
    SELECT EXISTS (
        SELECT 1
        FROM shops
        WHERE unique_id IS NOT NULL
        GROUP BY unique_id
        HAVING COUNT(*) > 1
    ) INTO has_duplicates;
    
    IF has_duplicates THEN
        RAISE EXCEPTION 'Cannot create unique index: Duplicate unique_id values exist. Please remove duplicates first.';
    END IF;
END $$;

-- Create unique index (only runs if no duplicates exist)
CREATE UNIQUE INDEX IF NOT EXISTS shops_unique_id_unique_idx 
ON shops(unique_id) 
WHERE unique_id IS NOT NULL;

-- Step 5: Add comment
COMMENT ON COLUMN shops.unique_id IS 'Unique identifier for shops from external sources. Format: "source:external_id" (e.g., "gov:12345", "tourism:67890", "hotpepper:abc123", "osm:12345678")';
COMMENT ON INDEX shops_unique_id_unique_idx IS 'Ensures each unique_id appears only once in shops table (NULL values allowed)';

-- Step 6: Verify the index was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'shops_unique_id_unique_idx'
    ) THEN
        RAISE NOTICE '✅ Unique index on unique_id created successfully';
    ELSE
        RAISE WARNING '⚠️  Failed to create unique index on unique_id';
    END IF;
END $$;

