-- ============================================================================
-- FIX SERVICES DURATION COLUMN
-- ============================================================================
-- This migration ensures the services table only has duration_minutes
-- and removes any conflicting duration column if it exists
-- ============================================================================

-- Check if 'duration' column exists and remove it if it does
DO $$
BEGIN
  -- Drop duration column if it exists (it should not exist based on migration)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'duration'
  ) THEN
    ALTER TABLE services DROP COLUMN duration;
    RAISE NOTICE 'Dropped duration column from services table';
  END IF;
END $$;

-- Ensure duration_minutes exists and is nullable
DO $$
BEGIN
  -- Add duration_minutes if it doesn't exist (should already exist)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services' 
    AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE services ADD COLUMN duration_minutes INTEGER;
    RAISE NOTICE 'Added duration_minutes column to services table';
  END IF;
  
  -- Ensure duration_minutes is nullable (should already be nullable)
  ALTER TABLE services ALTER COLUMN duration_minutes DROP NOT NULL;
END $$;

-- Add comment
COMMENT ON COLUMN services.duration_minutes IS 'Service duration in minutes (nullable)';

