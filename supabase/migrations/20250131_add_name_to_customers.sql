-- Migration: Add name column to customers table if it doesn't exist
-- This ensures the customers table has all required columns for the new auth system

-- ============================================
-- 1. Add name column if it doesn't exist
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE customers
        ADD COLUMN name TEXT;
        
        COMMENT ON COLUMN customers.name IS 'Customer full name';
    END IF;
END $$;

-- ============================================
-- 2. Add phone column if it doesn't exist
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE customers
        ADD COLUMN phone TEXT;
        
        COMMENT ON COLUMN customers.phone IS 'Customer phone number';
    END IF;
END $$;

-- ============================================
-- 3. Ensure password_hash column exists
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE customers
        ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
        
        COMMENT ON COLUMN customers.password_hash IS 'Hashed password for customer authentication';
    END IF;
END $$;

-- ============================================
-- 4. Ensure created_at and updated_at columns exist
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE customers
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE customers
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

