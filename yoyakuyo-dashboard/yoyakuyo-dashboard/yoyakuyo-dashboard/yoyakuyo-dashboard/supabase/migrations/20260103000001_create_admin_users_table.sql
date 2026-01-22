-- Migration: Create admin_users table for admin identity management
-- This table is separate from owners and customers - admin has its own identity domain

-- Step 1: Create admin_role enum
DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'support');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create admin_status enum
DO $$ BEGIN
  CREATE TYPE admin_status AS ENUM ('active', 'banned');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role admin_role NOT NULL DEFAULT 'admin',
  status admin_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 4: Add indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);

-- Step 5: Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
-- Service role can access all (for API)
DROP POLICY IF EXISTS "Service role can access all admin users" ON admin_users;
CREATE POLICY "Service role can access all admin users" ON admin_users
  FOR ALL USING (true);

-- Admins can view their own profile
DROP POLICY IF EXISTS "Admins can view their own profile" ON admin_users;
CREATE POLICY "Admins can view their own profile" ON admin_users
  FOR SELECT USING (auth.uid() = id);

-- Step 7: Add comments
COMMENT ON TABLE admin_users IS 'Admin user profiles - separate identity domain from owners and customers';
COMMENT ON COLUMN admin_users.role IS 'Admin role: super_admin, admin, or support';
COMMENT ON COLUMN admin_users.status IS 'Admin status: active or banned';

