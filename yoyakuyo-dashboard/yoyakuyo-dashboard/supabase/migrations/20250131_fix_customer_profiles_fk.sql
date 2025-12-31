-- Migration: Fix customer_profiles foreign key constraint
-- customer_profiles.id was referencing auth.users(id), but we're using custom customers table
-- This migration removes the FK constraint and allows customer_profiles.id to be independent

-- ============================================
-- 1. Remove the foreign key constraint from customer_profiles.id
-- ============================================
DO $$
BEGIN
    -- Check if the foreign key constraint exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'customer_profiles_id_fkey'
        AND table_name = 'customer_profiles'
    ) THEN
        -- Drop the foreign key constraint
        ALTER TABLE customer_profiles
        DROP CONSTRAINT customer_profiles_id_fkey;
    END IF;
END $$;

-- ============================================
-- 2. Ensure customer_auth_id column exists and has proper constraint
-- ============================================
DO $$
BEGIN
    -- Add customer_auth_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'customer_profiles' 
        AND column_name = 'customer_auth_id'
    ) THEN
        ALTER TABLE customer_profiles
        ADD COLUMN customer_auth_id UUID REFERENCES customers(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'customer_profiles_customer_auth_id_fkey'
        AND table_name = 'customer_profiles'
    ) THEN
        ALTER TABLE customer_profiles
        ADD CONSTRAINT customer_profiles_customer_auth_id_fkey 
        FOREIGN KEY (customer_auth_id) REFERENCES customers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 3. Create index on customer_auth_id for performance
-- ============================================
CREATE INDEX IF NOT EXISTS customer_profiles_customer_auth_id_idx 
ON customer_profiles(customer_auth_id);

-- Add comment
COMMENT ON COLUMN customer_profiles.customer_auth_id IS 'Links to customers table for authentication';

