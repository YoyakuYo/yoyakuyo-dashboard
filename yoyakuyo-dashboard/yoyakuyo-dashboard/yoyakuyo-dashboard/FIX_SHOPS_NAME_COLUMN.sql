-- ============================================================
-- FIX: Check if shops table has 'name' column or 'shop_name'
-- ============================================================
-- The error "column 'name' does not exist" suggests the shops table
-- might use 'shop_name' instead of 'name', or the column doesn't exist
-- ============================================================

-- Step 1: Check shops table columns
SELECT 
  'Shops Table Columns' AS check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shops'
  AND column_name IN ('name', 'shop_name')
ORDER BY column_name;

-- Step 2: Check if unique index exists that references 'name'
SELECT 
  'Unique Indexes on shops' AS check_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'shops'
  AND indexdef LIKE '%name%'
ORDER BY indexname;

-- Step 3: If 'name' doesn't exist but 'shop_name' does, we need to:
-- Option A: Add 'name' column (if shop_name exists, copy data)
-- Option B: Drop/recreate unique index to use 'shop_name' instead

-- Check which columns exist
DO $$
DECLARE
  has_name BOOLEAN;
  has_shop_name BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shops'
      AND column_name = 'name'
  ) INTO has_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shops'
      AND column_name = 'shop_name'
  ) INTO has_shop_name;
  
  IF NOT has_name AND has_shop_name THEN
    RAISE NOTICE '⚠️  shops table has shop_name but not name. Adding name column...';
    -- Add name column and copy from shop_name
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS name TEXT;
    UPDATE shops SET name = shop_name WHERE name IS NULL AND shop_name IS NOT NULL;
  ELSIF NOT has_name AND NOT has_shop_name THEN
    RAISE NOTICE '⚠️  shops table has neither name nor shop_name. Adding name column...';
    -- Add name column with default
    ALTER TABLE shops ADD COLUMN IF NOT EXISTS name TEXT;
  ELSE
    RAISE NOTICE '✅ shops table has name column';
  END IF;
END $$;

-- Step 4: Verify name column exists now
SELECT 
  'Verification' AS check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shops'
  AND column_name = 'name';

