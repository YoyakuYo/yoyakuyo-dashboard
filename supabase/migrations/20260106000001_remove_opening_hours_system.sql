-- Remove the old static opening hours system completely
-- This removes all references to shops.opening_hours JSONB

-- ============================================
-- PART 1: REMOVE OPENING HOURS COLUMN
-- ============================================

-- Remove opening_hours column from shops table
ALTER TABLE shops DROP COLUMN IF EXISTS opening_hours;

-- ============================================
-- PART 2: CLEANUP RELATED FUNCTIONS AND TRIGGERS
-- ============================================

-- Remove any functions that reference opening_hours
DROP FUNCTION IF EXISTS set_default_opening_hours(UUID);
DROP FUNCTION IF EXISTS validate_opening_hours(JSONB);

-- ============================================
-- PART 3: CLEANUP AI KNOWLEDGE (if any)
-- ============================================

-- Remove any AI knowledge entries that reference opening hours
DELETE FROM ai_knowledge
WHERE content ILIKE '%opening_hours%'
   OR content ILIKE '%opening hours%'
   OR metadata->>'type' = 'opening_hours';

-- ============================================
-- PART 4: UPDATE API RESPONSES
-- ============================================

-- Note: API endpoints that return opening_hours will need to be updated
-- to return availability windows instead. This will be done in the API code.

-- ============================================
-- PART 5: VERIFICATION
-- ============================================

-- Check that old system is completely removed
DO $$
BEGIN
    -- Check if opening_hours column still exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'shops'
        AND column_name = 'opening_hours'
    ) THEN
        RAISE EXCEPTION 'opening_hours column still exists on shops table';
    END IF;

    -- Check if any AI knowledge references opening hours
    IF EXISTS (
        SELECT 1 FROM ai_knowledge
        WHERE content ILIKE '%opening_hours%'
           OR content ILIKE '%opening hours%'
    ) THEN
        RAISE NOTICE 'Some AI knowledge still references opening hours - manual cleanup may be needed';
    END IF;

    RAISE NOTICE 'Old opening hours system successfully removed';
END $$;
