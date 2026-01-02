-- Migration: Ensure customer_profiles has name column (optional for LINE users)
-- This migration adds the name column if it doesn't exist
-- LINE users don't need a name since they use line_display_name

-- Add name column if it doesn't exist (make it nullable for LINE users)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'customer_profiles' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE customer_profiles
        ADD COLUMN name TEXT;
        
        -- Update existing non-LINE rows to use email as fallback
        -- LINE users can keep name as NULL since they use line_display_name
        UPDATE customer_profiles
        SET name = COALESCE(email, 'Customer')
        WHERE name IS NULL 
        AND line_user_id IS NULL; -- Only update non-LINE users
        
        -- Keep name as nullable - LINE users don't need it
        -- Regular customers will have name, LINE users use line_display_name
    END IF;
    
    -- If column exists but is NOT NULL, make it nullable for LINE users
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'customer_profiles' 
        AND column_name = 'name'
        AND is_nullable = 'NO'
    ) THEN
        -- Make it nullable to allow LINE users without name
        ALTER TABLE customer_profiles
        ALTER COLUMN name DROP NOT NULL;
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN customer_profiles.name IS 'Customer display name (optional). For LINE users, use line_display_name instead.';

