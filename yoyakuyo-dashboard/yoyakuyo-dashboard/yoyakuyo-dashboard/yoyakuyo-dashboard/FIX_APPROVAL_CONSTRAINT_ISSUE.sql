-- ============================================================
-- FIX: Make check_approved_shop constraint DEFERRABLE
-- ============================================================
-- Problem: When trigger updates shops table, constraint is checked
-- before the update completes. Making it DEFERRABLE allows it to
-- be checked at the end of the transaction.
-- ============================================================

-- Step 1: Drop existing constraint
ALTER TABLE shops DROP CONSTRAINT IF EXISTS check_approved_shop;

-- Step 2: Recreate as DEFERRABLE INITIALLY DEFERRED
-- This means the constraint is checked at the END of the transaction
-- instead of immediately, allowing the trigger to complete first
ALTER TABLE shops ADD CONSTRAINT check_approved_shop 
  CHECK (
    verification_status != 'approved' OR 
    (shop_status = 'claimed' AND COALESCE(owner_user_id, owner_id) IS NOT NULL)
  ) DEFERRABLE INITIALLY DEFERRED;

-- Step 3: Verify constraint
SELECT 
  'Constraint Updated' AS status,
  constraint_name,
  constraint_type,
  is_deferrable,
  initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'shops'
  AND tc.constraint_name = 'check_approved_shop';

