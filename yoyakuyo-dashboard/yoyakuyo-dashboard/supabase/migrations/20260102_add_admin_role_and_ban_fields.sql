-- Migration: Add Admin Role and Ban Fields
-- Adds admin role to owners table and ban fields to both owners and customers tables

-- ============================================
-- 1. Add role column to owners table
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'owners' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE owners 
        ADD COLUMN role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin'));
        
        CREATE INDEX IF NOT EXISTS owners_role_idx ON owners(role);
    END IF;
END $$;

-- ============================================
-- 2. Add ban fields to owners table
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'owners' 
        AND column_name = 'is_banned'
    ) THEN
        ALTER TABLE owners 
        ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN banned_at TIMESTAMPTZ,
        ADD COLUMN banned_reason TEXT;
        
        CREATE INDEX IF NOT EXISTS owners_is_banned_idx ON owners(is_banned);
    END IF;
END $$;

-- ============================================
-- 3. Add ban fields to customers table
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'is_banned'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN banned_at TIMESTAMPTZ,
        ADD COLUMN banned_reason TEXT;
        
        CREATE INDEX IF NOT EXISTS customers_is_banned_idx ON customers(is_banned);
    END IF;
END $$;

-- ============================================
-- 4. Add comment for documentation
-- ============================================
COMMENT ON COLUMN owners.role IS 'User role: owner or admin';
COMMENT ON COLUMN owners.is_banned IS 'Whether the owner account is banned';
COMMENT ON COLUMN owners.banned_at IS 'Timestamp when the owner was banned';
COMMENT ON COLUMN owners.banned_reason IS 'Reason for banning the owner account';
COMMENT ON COLUMN customers.is_banned IS 'Whether the customer account is banned';
COMMENT ON COLUMN customers.banned_at IS 'Timestamp when the customer was banned';
COMMENT ON COLUMN customers.banned_reason IS 'Reason for banning the customer account';

