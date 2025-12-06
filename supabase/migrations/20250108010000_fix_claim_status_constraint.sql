-- ============================================================================
-- FIX claim_status CONSTRAINT
-- ============================================================================
-- Add constraint to ensure claim_status = 'unclaimed' only when owner_user_id is NULL
-- ============================================================================

-- Drop existing constraint if it exists
ALTER TABLE shops DROP CONSTRAINT IF EXISTS check_claim_status_unclaimed;

-- Add constraint: claim_status = 'unclaimed' → owner_user_id MUST be NULL
ALTER TABLE shops ADD CONSTRAINT check_claim_status_unclaimed
  CHECK (
    claim_status != 'unclaimed' OR 
    COALESCE(owner_user_id, owner_id) IS NULL
  );

-- Fix any existing data that violates this constraint
-- If claim_status = 'unclaimed' but owner_user_id is set, set claim_status based on shop_status
UPDATE shops
SET claim_status = CASE
  WHEN shop_status = 'pending' THEN 'pending'
  WHEN shop_status = 'claimed' THEN 'approved'
  WHEN shop_status = 'rejected' THEN 'rejected'
  ELSE 'unclaimed'
END
WHERE claim_status = 'unclaimed' 
  AND COALESCE(owner_user_id, owner_id) IS NOT NULL;

-- Also ensure shop_status and claim_status are consistent
-- If claim_status = 'pending', shop_status should be 'pending'
UPDATE shops
SET shop_status = 'pending'
WHERE claim_status = 'pending' 
  AND shop_status != 'pending'
  AND COALESCE(owner_user_id, owner_id) IS NOT NULL;

-- If claim_status = 'approved', shop_status should be 'claimed'
UPDATE shops
SET shop_status = 'claimed'
WHERE claim_status = 'approved' 
  AND shop_status != 'claimed'
  AND COALESCE(owner_user_id, owner_id) IS NOT NULL;

-- If claim_status = 'rejected', shop_status should be 'rejected'
UPDATE shops
SET shop_status = 'rejected'
WHERE claim_status = 'rejected' 
  AND shop_status != 'rejected'
  AND COALESCE(owner_user_id, owner_id) IS NOT NULL;

COMMENT ON CONSTRAINT check_claim_status_unclaimed ON shops IS 
  'Ensures claim_status = unclaimed only when no owner is assigned';

