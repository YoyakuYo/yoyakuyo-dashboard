-- ============================================================================
-- ADD UNIQUENESS CONSTRAINTS TO PREVENT FUTURE DUPLICATES
-- ============================================================================
-- This migration adds constraints to prevent duplicate shops from being inserted
-- Strategy: Use unique_id if available, otherwise use name + lat/lng hash
-- ============================================================================

-- ============================================================================
-- STEP 1: Add deleted_at column if it doesn't exist (for soft deletes)
-- ============================================================================
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for soft-delete queries
CREATE INDEX IF NOT EXISTS shops_deleted_at_idx ON shops(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 2: Create function to generate location hash for uniqueness
-- ============================================================================
CREATE OR REPLACE FUNCTION shops_location_hash(name TEXT, lat NUMERIC, lng NUMERIC)
RETURNS TEXT AS $$
BEGIN
    -- Create a hash from name + rounded coordinates (4 decimal places = ~11 meters precision)
    RETURN CONCAT(
        COALESCE(name, ''), 
        '|', 
        COALESCE(ROUND(lat::numeric, 4)::text, ''), 
        '|', 
        COALESCE(ROUND(lng::numeric, 4)::text, '')
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 3: Add computed column for location hash (if unique_id is NULL)
-- ============================================================================
-- Note: PostgreSQL doesn't support computed columns directly, so we'll use a trigger
-- Instead, we'll create a unique index on the expression

-- ============================================================================
-- STEP 4: Create unique index on unique_id (allows NULL, but unique when set)
-- ============================================================================
-- First, check if duplicates exist
DO $$
DECLARE
    has_duplicates BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM shops
        WHERE unique_id IS NOT NULL
        AND deleted_at IS NULL
        GROUP BY unique_id
        HAVING COUNT(*) > 1
    ) INTO has_duplicates;
    
    IF has_duplicates THEN
        RAISE WARNING '⚠️  Duplicate unique_id values exist. Cannot create unique constraint. Run deduplication first.';
    ELSE
        -- Create unique index (allows NULL values)
        CREATE UNIQUE INDEX IF NOT EXISTS shops_unique_id_unique_idx 
        ON shops(unique_id) 
        WHERE unique_id IS NOT NULL AND deleted_at IS NULL;
        
        RAISE NOTICE '✅ Unique index on unique_id created successfully';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: Create unique index on location hash (for shops without unique_id)
-- ============================================================================
-- This ensures shops with same name + location can't be inserted twice
DO $$
DECLARE
    has_duplicates BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM shops
        WHERE unique_id IS NULL
        AND deleted_at IS NULL
        AND name IS NOT NULL
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        GROUP BY 
            name,
            ROUND(latitude::numeric, 4),
            ROUND(longitude::numeric, 4)
        HAVING COUNT(*) > 1
    ) INTO has_duplicates;
    
    IF has_duplicates THEN
        RAISE WARNING '⚠️  Duplicate location-based shops exist. Cannot create unique constraint. Run deduplication first.';
    ELSE
        -- Create unique index on location hash expression
        CREATE UNIQUE INDEX IF NOT EXISTS shops_location_unique_idx 
        ON shops(
            name,
            ROUND(latitude::numeric, 4),
            ROUND(longitude::numeric, 4)
        ) 
        WHERE unique_id IS NULL 
        AND deleted_at IS NULL
        AND name IS NOT NULL
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL;
        
        RAISE NOTICE '✅ Unique index on location hash created successfully';
    END IF;
END $$;

-- ============================================================================
-- STEP 6: Add comments
-- ============================================================================
COMMENT ON COLUMN shops.deleted_at IS 'Soft delete timestamp. NULL = active, NOT NULL = deleted';

-- Add comments only if indexes exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'shops_unique_id_unique_idx'
    ) THEN
        COMMENT ON INDEX shops_unique_id_unique_idx IS 'Ensures each unique_id appears only once (NULL values allowed)';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'shops_location_unique_idx'
    ) THEN
        COMMENT ON INDEX shops_location_unique_idx IS 'Ensures shops with same name + location cannot be duplicated (only for shops without unique_id)';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION: Check constraint status
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'shops_unique_id_unique_idx'
    ) THEN
        RAISE NOTICE '✅ unique_id unique index exists';
    ELSE
        RAISE NOTICE '❌ unique_id unique index missing';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'shops_location_unique_idx'
    ) THEN
        RAISE NOTICE '✅ location unique index exists';
    ELSE
        RAISE NOTICE '❌ location unique index missing (may be normal if duplicates still exist)';
    END IF;
END $$;

