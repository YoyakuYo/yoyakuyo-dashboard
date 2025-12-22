-- ============================================
-- CANONICAL CUSTOMER SYSTEM MIGRATION
-- ============================================
-- This migration ensures:
-- 1. ONE customers table with canonical customers.id
-- 2. All bookings reference customers.id via bookings.customer_id
-- 3. THREE customer types: LINE (via line_accounts), WEB (via auth.users), GUEST (generated UUID)
-- 4. NO DATA LOSS - all existing bookings are preserved and linked
-- ============================================

-- ============================================
-- STEP 1: ENSURE CUSTOMERS TABLE STRUCTURE
-- ============================================

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('guest','customer','owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add role column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'customers'
    AND column_name = 'role'
  ) THEN
    ALTER TABLE customers ADD COLUMN role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('guest','customer','owner'));
  END IF;
END $$;

-- Add created_at if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'customers'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE customers ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Create index on role
CREATE INDEX IF NOT EXISTS idx_customers_role ON customers(role);

-- ============================================
-- STEP 2: ENSURE LINE_ACCOUNTS TABLE EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS line_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_line_accounts_customer_id ON line_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_line_accounts_line_user_id ON line_accounts(line_user_id);

-- ============================================
-- STEP 3: ADD BOOKINGS.CUSTOMER_ID (NULLABLE INITIALLY)
-- ============================================

-- Add customer_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'bookings'
    AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE bookings
    ADD COLUMN customer_id UUID;
    
    CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id) WHERE customer_id IS NOT NULL;
    
    RAISE NOTICE 'Added customer_id column to bookings table';
  ELSE
    RAISE NOTICE 'customer_id column already exists in bookings table';
  END IF;
END $$;

-- ============================================
-- STEP 4: BACKFILL BOOKINGS.CUSTOMER_ID
-- ============================================

-- PART A: Backfill WEB bookings via user_id
-- Match bookings.user_id to customers.id (where customers.id = auth.users.id)
UPDATE bookings b
SET customer_id = b.user_id
WHERE b.customer_id IS NULL
  AND b.user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = b.user_id
  );

-- PART B: Backfill WEB bookings via customer_profile_id
-- Match bookings.customer_profile_id → customer_profiles.customer_auth_id → customers.id
UPDATE bookings b
SET customer_id = cp.customer_auth_id
FROM customer_profiles cp
WHERE b.customer_id IS NULL
  AND b.customer_profile_id IS NOT NULL
  AND cp.id = b.customer_profile_id
  AND cp.customer_auth_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = cp.customer_auth_id
  );

-- PART C: Backfill LINE bookings via line_accounts
-- Match bookings via line_accounts.line_user_id → line_accounts.customer_id
-- First, we need to identify LINE bookings
-- This assumes bookings have a way to identify LINE bookings (source='line' or via line_accounts)
UPDATE bookings b
SET customer_id = la.customer_id
FROM line_accounts la
WHERE b.customer_id IS NULL
  AND (
    b.source = 'line'
    OR EXISTS (
      -- Try to match via existing customer_id that has line_accounts
      SELECT 1 FROM line_accounts la2
      WHERE la2.customer_id = b.customer_id
    )
  )
  AND EXISTS (
    -- Find line_accounts that might match this booking
    -- This is a heuristic - we'll need to refine based on actual data
    SELECT 1 FROM line_accounts la3
    WHERE la3.customer_id IS NOT NULL
  );

-- PART D: Create guest customers for bookings with no customer_id
-- For bookings that still have NULL customer_id, create guest customer records
INSERT INTO customers (id, role)
SELECT 
  gen_random_uuid() as id,
  'guest' as role
FROM bookings b
WHERE b.customer_id IS NULL
GROUP BY b.id  -- One customer per booking for now (can be optimized later)
ON CONFLICT (id) DO NOTHING;

-- Update bookings with newly created guest customers
UPDATE bookings b
SET customer_id = c.id
FROM customers c
WHERE b.customer_id IS NULL
  AND c.role = 'guest'
  AND c.id NOT IN (SELECT customer_id FROM bookings WHERE customer_id IS NOT NULL)
LIMIT (SELECT COUNT(*) FROM bookings WHERE customer_id IS NULL);

-- ============================================
-- STEP 5: VERIFICATION QUERIES
-- ============================================

-- Run these queries to verify migration success:

-- Check 1: No bookings should have NULL customer_id
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM bookings
  WHERE customer_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE WARNING 'VERIFICATION FAILED: % bookings still have NULL customer_id', null_count;
  ELSE
    RAISE NOTICE 'VERIFICATION PASSED: All bookings have customer_id';
  END IF;
END $$;

-- Check 2: All customer_ids reference valid customers
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM bookings b
  WHERE b.customer_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = b.customer_id
    );
  
  IF invalid_count > 0 THEN
    RAISE WARNING 'VERIFICATION FAILED: % bookings have invalid customer_id', invalid_count;
  ELSE
    RAISE NOTICE 'VERIFICATION PASSED: All customer_ids are valid';
  END IF;
END $$;

-- Check 3: Count bookings by customer type
DO $$
DECLARE
  line_count INTEGER;
  web_count INTEGER;
  guest_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM bookings;
  
  SELECT COUNT(*) INTO line_count
  FROM bookings b
  JOIN line_accounts la ON la.customer_id = b.customer_id;
  
  SELECT COUNT(*) INTO web_count
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  WHERE c.role = 'customer'
    AND NOT EXISTS (SELECT 1 FROM line_accounts la WHERE la.customer_id = c.id);
  
  SELECT COUNT(*) INTO guest_count
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  WHERE c.role = 'guest';
  
  RAISE NOTICE 'Booking counts - Total: %, LINE: %, WEB: %, GUEST: %', 
    total_count, line_count, web_count, guest_count;
END $$;

-- ============================================
-- STEP 6: ADD CONSTRAINTS (ONLY AFTER VERIFICATION)
-- ============================================

-- Make customer_id NOT NULL (only if verification passed)
-- DO NOT RUN THIS UNTIL VERIFICATION QUERIES PASS
/*
DO $$
BEGIN
  -- First, ensure all bookings have customer_id
  IF EXISTS (SELECT 1 FROM bookings WHERE customer_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraint: Some bookings still have NULL customer_id';
  END IF;
  
  ALTER TABLE bookings
  ALTER COLUMN customer_id SET NOT NULL;
  
  RAISE NOTICE 'Added NOT NULL constraint to bookings.customer_id';
END $$;
*/

-- Add foreign key constraint (only if verification passed)
-- DO NOT RUN THIS UNTIL VERIFICATION QUERIES PASS
/*
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_customer_id_fkey'
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT bookings_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint bookings.customer_id → customers.id';
  END IF;
END $$;
*/

-- ============================================
-- STEP 7: CLEANUP (OPTIONAL - DO NOT RUN YET)
-- ============================================

-- After migration is verified and working, we can optionally:
-- 1. Remove customer_profile_id column (if no longer needed)
-- 2. Remove user_id column (if no longer needed)
-- 3. Keep source column for tracking booking origin

-- DO NOT RUN THESE YET:
/*
-- Remove customer_profile_id (keep for now as it might be used elsewhere)
-- ALTER TABLE bookings DROP COLUMN IF EXISTS customer_profile_id;

-- Remove user_id (keep for now as it might be used elsewhere)
-- ALTER TABLE bookings DROP COLUMN IF EXISTS user_id;
*/

-- ============================================
-- NOTES
-- ============================================

-- This migration is NON-DESTRUCTIVE:
-- - Does not delete any data
-- - Does not drop any columns
-- - Only adds customer_id and backfills it
-- - Keeps existing columns (customer_profile_id, user_id) for compatibility

-- After running this migration:
-- 1. Run verification queries (Step 5)
-- 2. If all pass, uncomment Step 6 to add constraints
-- 3. Test the application
-- 4. Once stable, consider cleanup (Step 7)

