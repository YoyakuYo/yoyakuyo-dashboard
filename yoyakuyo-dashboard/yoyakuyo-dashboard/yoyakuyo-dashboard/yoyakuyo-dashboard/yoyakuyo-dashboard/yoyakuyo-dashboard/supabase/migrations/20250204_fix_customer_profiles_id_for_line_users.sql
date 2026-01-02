-- Migration: Fix customer_profiles id for LINE users
-- LINE users don't have auth.users accounts, so id needs to be auto-generated
-- This migration makes id auto-generate UUIDs for LINE users

-- First, check if id column has a default
DO $$
BEGIN
    -- If id doesn't have a default, add one for new inserts
    -- This allows LINE users (who don't have auth.users) to get auto-generated UUIDs
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'customer_profiles' 
        AND column_name = 'id'
        AND column_default IS NOT NULL
    ) THEN
        -- Remove the foreign key constraint if it exists (for LINE users)
        IF EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'customer_profiles_id_fkey'
            AND table_name = 'customer_profiles'
        ) THEN
            ALTER TABLE customer_profiles
            DROP CONSTRAINT customer_profiles_id_fkey;
        END IF;
        
        -- Add default UUID generation for id column
        ALTER TABLE customer_profiles
        ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN customer_profiles.id IS 'Primary key UUID. Auto-generated for LINE users, references auth.users(id) for regular customers.';

