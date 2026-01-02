-- Migration: Fix admin table structure to match target architecture
-- This renames admin_users to admins and fixes enum values
-- NO DATA DELETION - only structural changes

-- Step 1: Create correct admin_role enum (super_admin, support only)
DO $$ BEGIN
  CREATE TYPE admin_role_new AS ENUM ('super_admin', 'support');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create correct admin_status enum (active, disabled)
DO $$ BEGIN
  CREATE TYPE admin_status_new AS ENUM ('active', 'disabled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create new admins table with correct structure
-- NOTE: email is NOT stored here - it comes from auth.users join
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_role admin_role_new NOT NULL DEFAULT 'support',
  status admin_status_new NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admins_id_unique UNIQUE (id)
);

-- Step 4: Migrate data from admin_users to admins (if admin_users exists)
DO $$
DECLARE
  admin_user_record RECORD;
BEGIN
  -- Check if admin_users table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_users'
  ) THEN
    -- Migrate each admin user (email comes from auth.users, not stored in admins)
    FOR admin_user_record IN 
      SELECT id, role, status, created_at
      FROM admin_users
    LOOP
      -- Map old role to new role (admin -> support, super_admin -> super_admin, support -> support)
      INSERT INTO admins (id, admin_role, status, created_at)
      VALUES (
        admin_user_record.id,
        CASE 
          WHEN admin_user_record.role = 'super_admin' THEN 'super_admin'::admin_role_new
          WHEN admin_user_record.role = 'admin' THEN 'support'::admin_role_new
          WHEN admin_user_record.role = 'support' THEN 'support'::admin_role_new
          ELSE 'support'::admin_role_new
        END,
        CASE 
          WHEN admin_user_record.status = 'banned' THEN 'disabled'::admin_status_new
          WHEN admin_user_record.status = 'active' THEN 'active'::admin_status_new
          ELSE 'active'::admin_status_new
        END,
        admin_user_record.created_at
      )
      ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- Step 5: Add indexes
CREATE INDEX IF NOT EXISTS idx_admins_admin_role ON admins(admin_role);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);

-- Step 6: Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
DROP POLICY IF EXISTS "Service role can access all admins" ON admins;
CREATE POLICY "Service role can access all admins" ON admins
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admins can view their own profile" ON admins;
CREATE POLICY "Admins can view their own profile" ON admins
  FOR SELECT USING (auth.uid() = id);

-- Step 8: Add comments
COMMENT ON TABLE admins IS 'Admin user profiles - separate identity domain from owners and customers';
COMMENT ON COLUMN admins.admin_role IS 'Admin role: super_admin or support';
COMMENT ON COLUMN admins.status IS 'Admin status: active or disabled';

-- NOTE: Do NOT drop admin_users table yet - keep it for safety
-- It can be dropped manually after verifying admins table works correctly

