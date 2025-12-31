-- Fix bookings table foreign key relationship with users
-- PostgREST error: Could not find relationship between 'bookings' and 'users'

-- Step 1: Check current bookings table structure
SELECT 
  'Bookings Table Structure' AS check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
ORDER BY ordinal_position;

-- Step 2: Check existing foreign key constraints on bookings
SELECT
  'Existing Foreign Keys' AS check_type,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'bookings'
ORDER BY kcu.column_name;

-- Step 3: Fix the foreign key relationship
DO $$
BEGIN
  -- Check if customer_id column exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'customer_id'
  ) THEN
    RAISE EXCEPTION 'customer_id column does not exist in bookings table';
  END IF;

  -- Check if foreign key already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'bookings'
      AND kcu.column_name = 'customer_id'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE NOTICE 'Foreign key constraint does not exist. Creating it...';
    
    -- Clean up orphaned rows first (rows where customer_id doesn't exist in auth.users)
    DELETE FROM bookings 
    WHERE customer_id NOT IN (SELECT id FROM auth.users);
    
    -- Add the foreign key constraint
    BEGIN
      ALTER TABLE bookings
      ADD CONSTRAINT bookings_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      RAISE NOTICE 'SUCCESS: Added foreign key constraint bookings_customer_id_fkey';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error adding foreign key: %. Trying to clean up more orphaned rows...', SQLERRM;
        -- Delete any remaining orphaned rows
        DELETE FROM bookings 
        WHERE customer_id NOT IN (SELECT id FROM auth.users);
        -- Try again
        BEGIN
          ALTER TABLE bookings
          ADD CONSTRAINT bookings_customer_id_fkey 
          FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
          RAISE NOTICE 'SUCCESS: Added foreign key constraint after cleanup';
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE 'Still cannot add foreign key: %. This may be OK if constraint already exists.', SQLERRM;
        END;
    END;
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
    
    -- Verify it's pointing to the right table
    IF EXISTS (
      SELECT FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'bookings'
        AND kcu.column_name = 'customer_id'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_schema = 'auth'
        AND ccu.table_name = 'users'
    ) THEN
      RAISE NOTICE 'Foreign key is correctly pointing to auth.users';
    ELSE
      RAISE NOTICE 'WARNING: Foreign key exists but may not be pointing to auth.users correctly';
    END IF;
  END IF;
END $$;

-- Step 4: Verify the foreign key was created
SELECT
  'Verification' AS check_type,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'bookings'
  AND kcu.column_name = 'customer_id';

-- Step 5: Refresh PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- Step 6: Final status
SELECT 
  'Final Status' AS check_type,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'bookings'
        AND kcu.column_name = 'customer_id'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_schema = 'auth'
        AND ccu.table_name = 'users'
        AND tc.constraint_name = 'bookings_customer_id_fkey'
    ) THEN 'SUCCESS: Foreign key relationship exists and is correct'
    ELSE 'WARNING: Foreign key may not be set up correctly'
  END AS status;

