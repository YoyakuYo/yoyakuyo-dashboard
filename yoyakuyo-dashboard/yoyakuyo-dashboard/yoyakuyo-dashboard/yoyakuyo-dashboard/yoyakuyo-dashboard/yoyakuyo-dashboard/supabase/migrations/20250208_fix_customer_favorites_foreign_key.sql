-- ============================================
-- Fix customer_favorites foreign key constraint
-- ============================================
-- The customer_favorites table currently references customer_profiles,
-- but it should reference customers table (canonical system)
-- For WEB customers: customers.id = auth.users.id
-- ============================================

-- Step 1: Drop the old foreign key constraint if it exists
DO $$
BEGIN
  -- Check if the old constraint exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'customer_favorites_customer_id_fkey'
    AND table_name = 'customer_favorites'
  ) THEN
    -- Drop the old constraint
    ALTER TABLE customer_favorites
    DROP CONSTRAINT customer_favorites_customer_id_fkey;
    
    RAISE NOTICE 'Dropped old foreign key constraint customer_favorites_customer_id_fkey';
  ELSE
    RAISE NOTICE 'Old foreign key constraint does not exist, skipping drop';
  END IF;
END $$;

-- Step 2: Check if customer_favorites table exists and has customer_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'customer_favorites'
  ) THEN
    RAISE EXCEPTION 'customer_favorites table does not exist';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_favorites'
    AND column_name = 'customer_id'
  ) THEN
    RAISE EXCEPTION 'customer_favorites.customer_id column does not exist';
  END IF;
  
  RAISE NOTICE 'customer_favorites table and customer_id column exist';
END $$;

-- Step 3: Ensure customers table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'customers'
  ) THEN
    RAISE EXCEPTION 'customers table does not exist. Run canonical customer system migration first.';
  END IF;
  
  RAISE NOTICE 'customers table exists';
END $$;

-- Step 4: Migrate existing customer_favorites data
-- Update customer_id to point to customers table instead of customer_profiles
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- For WEB customers: customer_profiles.customer_auth_id = customers.id
  -- Update customer_favorites.customer_id to use customers.id
  UPDATE customer_favorites cf
  SET customer_id = cp.customer_auth_id
  FROM customer_profiles cp
  WHERE cf.customer_id = cp.id
    AND cp.customer_auth_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = cp.customer_auth_id
    );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % customer_favorites records to use customers.id', updated_count;
  
  -- For LINE customers: customer_favorites.customer_id might already be correct
  -- (if it was already using customers.id)
  -- No action needed for LINE customers
  
END $$;

-- Step 5: Add new foreign key constraint pointing to customers table
DO $$
BEGIN
  -- Check if the new constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'customer_favorites_customer_id_fkey'
    AND table_name = 'customer_favorites'
  ) THEN
    -- Add the new constraint
    ALTER TABLE customer_favorites
    ADD CONSTRAINT customer_favorites_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Added new foreign key constraint customer_favorites.customer_id → customers.id';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists, skipping';
  END IF;
END $$;

-- Step 6: Verify the migration
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  -- Check for any customer_favorites with invalid customer_id
  SELECT COUNT(*) INTO invalid_count
  FROM customer_favorites cf
  WHERE NOT EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = cf.customer_id
  );
  
  IF invalid_count > 0 THEN
    RAISE WARNING 'WARNING: % customer_favorites have invalid customer_id references', invalid_count;
  ELSE
    RAISE NOTICE '✅ VERIFICATION PASSED: All customer_favorites have valid customer_id references';
  END IF;
END $$;

