-- Migration: Create separate admins table for platform administrators
-- This separates platform operators (admins) from regular users (customers/owners)
-- Admins are NOT customers - they are platform operators with full control

-- Step 1: Create admin_role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin', 'support');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create admin_status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE admin_status AS ENUM ('active', 'disabled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create admins table (platform operators, not customers)
-- Drop existing table if it has wrong structure, then recreate
DROP TABLE IF EXISTS admins CASCADE;

CREATE TABLE admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_role admin_role NOT NULL DEFAULT 'support',
  status admin_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admins_id_unique UNIQUE (id)
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_admin_role ON admins(admin_role);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);
CREATE INDEX IF NOT EXISTS idx_admins_created_at ON admins(created_at DESC);

-- Step 5: Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
-- Service role can access all (for API)
DROP POLICY IF EXISTS "Service role can access all admins" ON admins;
CREATE POLICY "Service role can access all admins" ON admins
  FOR ALL USING (true);

-- Admins can view their own profile
DROP POLICY IF EXISTS "Admins can view their own profile" ON admins;
CREATE POLICY "Admins can view their own profile" ON admins
  FOR SELECT USING (auth.uid() = id);

-- Step 7: Migrate existing admins from customers table
-- Move all users with is_admin = true to the admins table
DO $$
DECLARE
  admin_customer RECORD;
BEGIN
  -- Check if customers table has is_admin column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'is_admin'
  ) THEN
    -- Migrate each admin from customers to admins table
    FOR admin_customer IN 
      SELECT auth_user_id, created_at
      FROM customers 
      WHERE is_admin = true 
      AND auth_user_id IS NOT NULL
    LOOP
      -- Insert into admins table (default to 'support' role, 'active' status)
      INSERT INTO admins (id, admin_role, status, created_at, updated_at)
      VALUES (
        admin_customer.auth_user_id,
        'support'::admin_role, -- Default role, can be updated later
        'active'::admin_status,
        admin_customer.created_at,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE 
      SET 
        status = 'active'::admin_status,
        updated_at = NOW();
      
      RAISE NOTICE 'Migrated admin with auth_user_id: %', admin_customer.auth_user_id;
    END LOOP;
  ELSE
    RAISE NOTICE 'customers.is_admin column does not exist. Skipping migration.';
  END IF;
END $$;

-- Step 8: Add comments for documentation
COMMENT ON TABLE admins IS 'Platform administrators - separate from customers and owners. Admins have full platform control.';
COMMENT ON COLUMN admins.id IS 'References auth.users.id - admin authentication identity';
COMMENT ON COLUMN admins.admin_role IS 'Admin role: super_admin (full control) or support (limited admin)';
COMMENT ON COLUMN admins.status IS 'Admin status: active (can access) or disabled (banned/suspended)';

-- Step 9: Note about customers.is_admin column
-- We keep the is_admin column in customers for now to avoid breaking anything
-- It can be removed in a future migration after full verification
-- For now, admins table is the source of truth for admin identity

