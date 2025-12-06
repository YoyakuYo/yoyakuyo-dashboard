-- ============================================================================
-- FIX VERIFICATION STATUS LOGIC
-- ============================================================================
-- This migration:
-- 1. Cleans existing bad data (shops with 'pending' but no verification request)
-- 2. Sets default verification_status to 'not_submitted' for new shops
-- ============================================================================

-- ============================================================================
-- STEP 1: Clean existing bad data
-- ===========================================================================
-- For all shops that have verification_status = 'pending' 
-- BUT have NO row in shop_verification_requests
-- → set verification_status = 'not_submitted'
-- ============================================================================
UPDATE shops
SET verification_status = 'not_submitted'
WHERE verification_status = 'pending'
AND NOT EXISTS (
  SELECT 1 
  FROM shop_verification_requests svr
  WHERE svr.shop_id = shops.id
);

-- ============================================================================
-- STEP 2: Sync verification_status from shop_verification_requests
-- ============================================================================
-- For shops that DO have verification requests, sync the status
-- ============================================================================
UPDATE shops s
SET verification_status = svr.status
FROM shop_verification_requests svr
WHERE s.id = svr.shop_id
AND svr.id = (
  -- Get the most recent verification request for each shop
  SELECT id
  FROM shop_verification_requests svr2
  WHERE svr2.shop_id = s.id
  ORDER BY svr2.submitted_at DESC
  LIMIT 1
);

-- ============================================================================
-- STEP 3: Set default for shops with NULL verification_status
-- ============================================================================
UPDATE shops
SET verification_status = 'not_submitted'
WHERE verification_status IS NULL;

-- ============================================================================
-- STEP 4: Update default value for new shops
-- ============================================================================
-- Change the default from 'pending' to 'not_submitted'
ALTER TABLE shops
ALTER COLUMN verification_status SET DEFAULT 'not_submitted';

-- ============================================================================
-- STEP 5: Add comment explaining the logic
-- ============================================================================
COMMENT ON COLUMN shops.verification_status IS 
'Verification status derived from shop_verification_requests: 
- not_submitted: No verification request exists
- pending: Verification request exists with status = pending
- approved: Verification request exists with status = approved
- rejected: Verification request exists with status = rejected';

