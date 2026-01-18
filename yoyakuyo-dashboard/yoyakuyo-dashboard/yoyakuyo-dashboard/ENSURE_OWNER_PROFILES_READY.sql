-- Ensure owner_profiles table is fully set up and ready for API use
-- This script fixes any missing columns or issues that might cause PGRST204 errors

-- Step 1: Ensure table exists with all required columns
CREATE TABLE IF NOT EXISTS owner_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  date_of_birth DATE,
  country TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  prefecture TEXT,
  postal_code TEXT,
  company_phone TEXT,
  company_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add any missing columns
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS prefecture TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS company_email TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 3: Update any NULL full_name values
UPDATE owner_profiles 
SET full_name = '' 
WHERE full_name IS NULL;

-- Step 4: Set NOT NULL constraints
DO $$
BEGIN
  -- Set full_name to NOT NULL if it's not already
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'owner_profiles'
      AND column_name = 'full_name'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE owner_profiles ALTER COLUMN full_name SET NOT NULL;
    ALTER TABLE owner_profiles ALTER COLUMN full_name SET DEFAULT '';
  END IF;
END $$;

-- Step 5: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create updated_at trigger
DROP TRIGGER IF EXISTS update_owner_profiles_updated_at ON owner_profiles;
CREATE TRIGGER update_owner_profiles_updated_at
  BEFORE UPDATE ON owner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Enable RLS
ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop and recreate RLS Policies
DROP POLICY IF EXISTS "Owners can view their own profile" ON owner_profiles;
CREATE POLICY "Owners can view their own profile" ON owner_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owners can update their own profile" ON owner_profiles;
CREATE POLICY "Owners can update their own profile" ON owner_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owners can insert their own profile" ON owner_profiles;
CREATE POLICY "Owners can insert their own profile" ON owner_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Staff can view all owner profiles" ON owner_profiles;
CREATE POLICY "Staff can view all owner profiles" ON owner_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

-- Step 9: Refresh PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- Step 10: Verification
SELECT 
  'Verification' AS check_type,
  COUNT(*) AS total_columns,
  COUNT(CASE WHEN is_nullable = 'NO' THEN 1 END) AS not_null_columns,
  COUNT(CASE WHEN column_name = 'full_name' THEN 1 END) AS has_full_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'owner_profiles';

-- Note: After running this, wait 5-10 seconds for PostgREST to reload
-- If errors persist, you may need to restart the Supabase API service

