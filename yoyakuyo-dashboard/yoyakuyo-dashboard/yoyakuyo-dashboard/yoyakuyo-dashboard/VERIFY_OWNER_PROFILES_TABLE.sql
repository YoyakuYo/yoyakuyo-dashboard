-- Verify owner_profiles table structure
-- Run this in Supabase SQL Editor to check if the table exists and has the correct columns

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'owner_profiles'
) AS table_exists;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'owner_profiles'
ORDER BY ordinal_position;

-- If table doesn't exist or is missing columns, the migration needs to be run


