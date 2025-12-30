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

-- Step 4: Verify trigger was created
SELECT 
  'Trigger Created' AS status,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'sync_shop_on_verification_approval_trigger';

-- ============================================================
-- SUMMARY
-- ============================================================
-- This trigger will automatically:
-- 1. Set shops.owner_user_id = owner_verification.user_id
-- 2. Set shops.shop_status = 'claimed'
-- 3. Set shops.verification_status = 'approved'
-- 4. Set shops.claim_status = 'approved'
-- 5. Set shops.is_verified = true
-- 6. Set shops.verified_at = NOW()
-- 7. Set users.shop_id = owner_verification.shop_id
-- 
-- When owner_verification.verification_status is updated to 'approved'
-- ============================================================

