-- Migration: Add admin role to customers table (role-based approach)
-- This makes admin a ROLE, not a separate identity
-- Admin is layered on top of existing customers table

-- Step 1: Add is_admin boolean column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_customers_is_admin ON customers(is_admin) WHERE is_admin = true;

-- Step 3: Migrate existing admins from admins table to customers.is_admin
-- This ensures existing admin accounts are preserved
DO $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Check if admins table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admins'
  ) THEN
    -- For each admin in admins table, set is_admin = true in customers
    FOR admin_record IN 
      SELECT id FROM admins WHERE status = 'active'
    LOOP
      -- Ensure customer record exists (should exist if they're in auth.users)
      INSERT INTO customers (id, role, is_admin, created_at)
      VALUES (admin_record.id, 'customer', true, NOW())
      ON CONFLICT (id) DO UPDATE SET is_admin = true;
      
      RAISE NOTICE 'Set is_admin = true for customer ID: %', admin_record.id;
    END LOOP;
  END IF;
END $$;

-- Step 4: Add comment
COMMENT ON COLUMN customers.is_admin IS 'True if user has admin privileges. Admin is a role, not a separate identity.';

-- Step 5: Update check constraint to allow admin role (if needed)
-- Note: We keep role as 'guest', 'customer', 'owner' - admin is separate flag
-- This allows users to be both admin AND owner/customer

