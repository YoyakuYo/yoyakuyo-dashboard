-- Fix owner_profiles schema to match exact requirements
-- Ensure EXACTLY these NOT NULL fields:
-- - full_name
-- - date_of_birth
-- - country
-- - address_line1
-- - city
-- - prefecture
-- - phone (company_phone)
-- - email (company_email)

-- Step 1: Add missing columns if they don't exist
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS prefecture TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS company_email TEXT;

-- Step 2: Remove NOT NULL from any extra fields that shouldn't be NOT NULL
-- (Keep address_line2, postal_code as nullable - they're optional)

-- Step 3: Set default values for existing NULL values before making NOT NULL
-- Only set defaults if we're going to make them NOT NULL
-- For a hard reset, we'll use empty strings for text and a default date
UPDATE owner_profiles 
SET 
  full_name = COALESCE(full_name, ''),
  date_of_birth = COALESCE(date_of_birth, '1900-01-01'::DATE),
  country = COALESCE(country, ''),
  address_line1 = COALESCE(address_line1, ''),
  city = COALESCE(city, ''),
  prefecture = COALESCE(prefecture, ''),
  company_phone = COALESCE(company_phone, ''),
  company_email = COALESCE(company_email, '')
WHERE 
  full_name IS NULL 
  OR date_of_birth IS NULL 
  OR country IS NULL 
  OR address_line1 IS NULL 
  OR city IS NULL 
  OR prefecture IS NULL 
  OR company_phone IS NULL 
  OR company_email IS NULL;

-- Step 4: Set NOT NULL constraints on required fields
DO $$
BEGIN
  -- full_name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owner_profiles' 
    AND column_name = 'full_name' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE owner_profiles ALTER COLUMN full_name SET NOT NULL;
  END IF;

  -- date_of_birth
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owner_profiles' 
    AND column_name = 'date_of_birth' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE owner_profiles ALTER COLUMN date_of_birth SET NOT NULL;
  END IF;

  -- country
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owner_profiles' 
    AND column_name = 'country' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE owner_profiles ALTER COLUMN country SET NOT NULL;
  END IF;

  -- address_line1
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owner_profiles' 
    AND column_name = 'address_line1' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE owner_profiles ALTER COLUMN address_line1 SET NOT NULL;
  END IF;

  -- city
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owner_profiles' 
    AND column_name = 'city' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE owner_profiles ALTER COLUMN city SET NOT NULL;
  END IF;

  -- prefecture
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owner_profiles' 
    AND column_name = 'prefecture' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE owner_profiles ALTER COLUMN prefecture SET NOT NULL;
  END IF;

  -- company_phone
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owner_profiles' 
    AND column_name = 'company_phone' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE owner_profiles ALTER COLUMN company_phone SET NOT NULL;
  END IF;

  -- company_email
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'owner_profiles' 
    AND column_name = 'company_email' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE owner_profiles ALTER COLUMN company_email SET NOT NULL;
  END IF;
END $$;

-- Step 5: Verify schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'owner_profiles'
ORDER BY ordinal_position;

