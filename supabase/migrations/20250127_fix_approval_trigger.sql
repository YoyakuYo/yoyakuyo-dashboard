-- ============================================================
-- FIX: Create trigger to sync shops table when verification is approved
-- ============================================================
-- Problem: When owner_verification.verification_status = 'approved',
-- the shops table must also be updated with:
-- - verification_status = 'approved'
-- - shop_status = 'claimed'
-- - owner_user_id = owner_verification.user_id
-- Otherwise, check_approved_shop constraint fails
-- ============================================================

-- Step 1: Create trigger function to sync shop when verification is approved
CREATE OR REPLACE FUNCTION sync_shop_on_verification_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when verification_status changes to 'approved'
  IF NEW.verification_status = 'approved' AND OLD.verification_status != 'approved' THEN
    -- Update the shop to reflect approval
    UPDATE shops
    SET
      owner_user_id = NEW.user_id,
      shop_status = 'claimed',
      verification_status = 'approved',
      claim_status = 'approved',
      is_verified = true,
      verified_at = NOW()
    WHERE id = NEW.shop_id;
    
    -- Also update users.shop_id if it's not set
    UPDATE users
    SET shop_id = NEW.shop_id
    WHERE id = NEW.user_id
      AND shop_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_shop_on_verification_approval_trigger ON owner_verification;

-- Step 3: Create the trigger
CREATE TRIGGER sync_shop_on_verification_approval_trigger
  AFTER UPDATE OF verification_status ON owner_verification
  FOR EACH ROW
  WHEN (NEW.verification_status = 'approved' AND OLD.verification_status != 'approved')
  EXECUTE FUNCTION sync_shop_on_verification_approval();

-- Step 4: Add comment
COMMENT ON FUNCTION sync_shop_on_verification_approval() IS 'Automatically syncs shops table when owner_verification is approved';

