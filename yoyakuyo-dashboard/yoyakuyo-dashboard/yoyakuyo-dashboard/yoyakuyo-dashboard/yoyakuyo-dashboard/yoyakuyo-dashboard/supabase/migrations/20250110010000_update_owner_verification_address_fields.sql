-- Update owner_verification table to use structured address fields
-- Replace home_address with: address_line1, address_line2, city, prefecture, postal_code

-- Step 1: Add new structured address columns
ALTER TABLE owner_verification ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE owner_verification ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE owner_verification ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE owner_verification ADD COLUMN IF NOT EXISTS prefecture TEXT;
ALTER TABLE owner_verification ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Step 2: Migrate existing home_address data to address_line1
-- (This preserves existing data)
UPDATE owner_verification
SET address_line1 = COALESCE(home_address, '')
WHERE address_line1 IS NULL AND home_address IS NOT NULL;

-- Step 3: Make address_line1 NOT NULL (after migration)
-- First set defaults for any remaining NULLs
UPDATE owner_verification
SET address_line1 = COALESCE(address_line1, '')
WHERE address_line1 IS NULL;

-- Step 4: Set NOT NULL constraints on required address fields
DO $$
BEGIN
  -- address_line1
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owner_verification' 
    AND column_name = 'address_line1' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE owner_verification ALTER COLUMN address_line1 SET NOT NULL;
  END IF;

  -- city
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owner_verification' 
    AND column_name = 'city' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE owner_verification ALTER COLUMN city SET NOT NULL;
  END IF;

  -- prefecture
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owner_verification' 
    AND column_name = 'prefecture' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE owner_verification ALTER COLUMN prefecture SET NOT NULL;
  END IF;
END $$;

-- Step 5: Remove NOT NULL constraint from home_address (make it nullable)
-- This allows the field to exist but not be required
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owner_verification' 
    AND column_name = 'home_address' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE owner_verification ALTER COLUMN home_address DROP NOT NULL;
  END IF;
END $$;

-- Step 6: Verify schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'owner_verification'
  AND column_name IN ('home_address', 'address_line1', 'address_line2', 'city', 'prefecture', 'postal_code')
ORDER BY ordinal_position;

