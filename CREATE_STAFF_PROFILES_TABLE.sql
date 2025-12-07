-- Create staff_profiles table if it doesn't exist
-- This is for platform staff (admins, managers, verifiers), not shop employees

CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_profiles_auth_user_id ON staff_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_email ON staff_profiles(email);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_active ON staff_profiles(active);

-- Enable RLS
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Staff can view all staff profiles
DROP POLICY IF EXISTS "Staff can view all staff profiles" ON staff_profiles;
CREATE POLICY "Staff can view all staff profiles"
  ON staff_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.active = TRUE
    )
  );

-- Only super admins can insert/update staff profiles
DROP POLICY IF EXISTS "Super admins can manage staff profiles" ON staff_profiles;
CREATE POLICY "Super admins can manage staff profiles"
  ON staff_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.is_super_admin = TRUE
      AND sp.active = TRUE
    )
  );

-- Service role can manage all (for initial setup)
DROP POLICY IF EXISTS "Service role can manage all staff profiles" ON staff_profiles;
CREATE POLICY "Service role can manage all staff profiles"
  ON staff_profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE staff_profiles IS 'Unified staff/manager profile system for admins, managers, verifiers, and support';
COMMENT ON COLUMN staff_profiles.is_super_admin IS 'Super admins can manage other staff profiles';

-- Verify table was created
SELECT 
  'Table Created' AS status,
  COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'staff_profiles';

