-- ============================================================
-- CREATE shops.name COLUMN (DIRECT FIX)
-- ============================================================
-- This will create the name column if it doesn't exist
-- ============================================================

BEGIN;

-- Step 1: Check current state
SELECT 
  'Current shops.name status' AS check_type,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shops'
      AND column_name = 'name'
  ) AS name_column_exists,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shops'
      AND column_name = 'shop_name'
  ) AS shop_name_column_exists;

-- Step 2: Add name column if it doesn't exist
DO $$
DECLARE
  has_name BOOLEAN;
  has_shop_name BOOLEAN;
BEGIN
  -- Check if name column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shops'
      AND column_name = 'name'
  ) INTO has_name;
  
  -- Check if shop_name column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shops'
      AND column_name = 'shop_name'
  ) INTO has_shop_name;
  
  IF NOT has_name THEN
    -- Add name column
    ALTER TABLE shops ADD COLUMN name TEXT;
    
    -- Set default empty string for all rows
    UPDATE shops SET name = '' WHERE name IS NULL;
    RAISE NOTICE '✅ Created name column with empty string default';
    
    -- Make it NOT NULL after setting values
    ALTER TABLE shops ALTER COLUMN name SET DEFAULT '';
    UPDATE shops SET name = '' WHERE name IS NULL;
    ALTER TABLE shops ALTER COLUMN name SET NOT NULL;
    
    RAISE NOTICE '✅ shops.name column created successfully';
  ELSE
    RAISE NOTICE '✅ shops.name column already exists';
  END IF;
END $$;

-- Step 3: Verify the column was created
SELECT 
  'Verification' AS check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shops'
  AND column_name = 'name';

COMMIT;

