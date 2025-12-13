-- Migration: Ensure customer_profiles has name column
-- This migration adds the name column if it doesn't exist
-- Required for LINE user profile creation

-- Add name column if it doesn't exist
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
        
        -- Update existing rows to use line_display_name or email as fallback
        UPDATE customer_profiles
        SET name = COALESCE(
            line_display_name,
            email,
            'Customer'
        )
        WHERE name IS NULL;
        
        -- Make name NOT NULL after backfilling
        ALTER TABLE customer_profiles
        ALTER COLUMN name SET NOT NULL;
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN customer_profiles.name IS 'Customer display name. For LINE users, this is synced with line_display_name.';

