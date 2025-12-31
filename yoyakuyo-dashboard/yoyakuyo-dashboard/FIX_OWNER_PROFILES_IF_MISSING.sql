-- Fix owner_profiles table if it's missing or incomplete
-- Run this ONLY if the migration hasn't been applied yet

-- First, check if table exists
DO $$
BEGIN
  -- Create owner_profiles table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'owner_profiles'
  ) THEN
    CREATE TABLE owner_profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
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

    -- Create updated_at trigger
    CREATE TRIGGER update_owner_profiles_updated_at
      BEFORE UPDATE ON owner_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    -- Enable RLS
    ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;

    -- RLS Policies
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

    RAISE NOTICE 'owner_profiles table created successfully';
  ELSE
    -- Table exists, check if full_name column exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'owner_profiles'
        AND column_name = 'full_name'
    ) THEN
      -- Add missing columns
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

      -- Make full_name NOT NULL if it's not already
      ALTER TABLE owner_profiles ALTER COLUMN full_name SET NOT NULL;

      RAISE NOTICE 'Added missing columns to owner_profiles table';
    ELSE
      RAISE NOTICE 'owner_profiles table already exists with correct structure';
    END IF;
  END IF;
END $$;

-- Refresh PostgREST schema cache (this requires service role)
-- Note: You may need to restart the API or wait for cache refresh
-- Or run: SELECT pg_notify('pgrst', 'reload schema');


