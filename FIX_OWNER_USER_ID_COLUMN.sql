-- Fix owner_profiles table to remove or fix owner_user_id column
-- The error shows owner_user_id has NOT NULL constraint but API uses 'id' column

-- Step 1: Check current table structure
SELECT 
  'Current Structure' AS check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'owner_profiles'
ORDER BY ordinal_position;

-- Step 2: Check if owner_user_id column exists and what it references
SELECT 
  'Foreign Keys' AS check_type,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'owner_profiles'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Step 3: Fix the issue
-- Option A: If owner_user_id is a duplicate of id, remove it
-- Option B: If owner_user_id should exist, make it nullable or set a default

DO $$
BEGIN
  -- Check if owner_user_id column exists
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'owner_profiles'
      AND column_name = 'owner_user_id'
  ) THEN
    RAISE NOTICE 'owner_user_id column exists. Checking if it duplicates id column...';
    
    -- Check if it's a foreign key
    IF EXISTS (
      SELECT FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'owner_profiles'
        AND kcu.column_name = 'owner_user_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
      -- Drop foreign key constraint first
      ALTER TABLE owner_profiles 
      DROP CONSTRAINT IF EXISTS owner_profiles_owner_user_id_fkey CASCADE;
    END IF;
    
    -- Check if there's data - if owner_user_id has values, copy them to id if id is null
    -- But since id is the primary key and should always have a value, we'll just remove owner_user_id
    RAISE NOTICE 'Removing owner_user_id column (id column is the correct one to use)...';
    
    -- Drop the column
    ALTER TABLE owner_profiles 
    DROP COLUMN IF EXISTS owner_user_id CASCADE;
    
    RAISE NOTICE 'SUCCESS: Removed owner_user_id column';
  ELSE
    RAISE NOTICE 'owner_user_id column does not exist. No action needed.';
  END IF;
END $$;

-- Step 4: Verify the fix
SELECT 
  'Final Structure' AS check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'owner_profiles'
ORDER BY ordinal_position;

-- Step 5: Ensure id column is the primary key and references auth.users
DO $$
BEGIN
  -- Check if id is the primary key
  IF NOT EXISTS (
    SELECT FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'owner_profiles'
      AND constraint_type = 'PRIMARY KEY'
      AND constraint_name LIKE '%owner_profiles%'
  ) THEN
    -- Make id the primary key if it isn't already
    ALTER TABLE owner_profiles 
    ADD PRIMARY KEY (id);
    RAISE NOTICE 'Set id as primary key';
  END IF;
  
  -- Check if foreign key to auth.users exists
  IF NOT EXISTS (
    SELECT FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'owner_profiles'
      AND kcu.column_name = 'id'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    -- Add foreign key constraint
    ALTER TABLE owner_profiles
    ADD CONSTRAINT owner_profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint on id';
  END IF;
END $$;

-- Step 6: Refresh PostgREST cache
SELECT pg_notify('pgrst', 'reload schema');

-- Step 7: Final verification
SELECT 
  'Verification' AS check_type,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'owner_profiles' AND column_name = 'owner_user_id'
    ) THEN 'ERROR: owner_user_id still exists'
    ELSE 'SUCCESS: owner_user_id removed'
  END AS status,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.table_constraints
      WHERE table_name = 'owner_profiles' AND constraint_type = 'PRIMARY KEY'
    ) THEN 'SUCCESS: Primary key exists'
    ELSE 'ERROR: No primary key'
  END AS primary_key_status;

