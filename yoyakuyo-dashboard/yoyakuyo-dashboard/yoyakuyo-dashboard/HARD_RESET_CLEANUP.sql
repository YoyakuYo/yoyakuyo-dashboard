-- HARD RESET: Database Cleanup Script
-- This script deletes ghost claims and orphan documents

-- STEP 1: Delete ALL shop_claims where status IN ('draft','submitted','resubmission_required')
-- AND owner_id = current test user
-- NOTE: Replace 'YOUR_TEST_USER_ID' with actual test user ID before running

-- First, let's see what we're deleting
SELECT 
  'Claims to delete' AS action,
  COUNT(*) AS count,
  status
FROM shop_claims
WHERE status IN ('draft', 'submitted', 'resubmission_required')
  -- AND owner_id = 'YOUR_TEST_USER_ID'  -- Uncomment and set user ID
GROUP BY status;

-- Delete orphan documents first (where claim_id no longer exists)
DELETE FROM shop_claim_documents
WHERE claim_id NOT IN (SELECT id FROM shop_claims);

-- Now delete the claims (uncomment when ready)
-- DELETE FROM shop_claims
-- WHERE status IN ('draft', 'submitted', 'resubmission_required')
--   AND owner_id = 'YOUR_TEST_USER_ID';  -- Set your test user ID

-- Verify cleanup
SELECT 
  'Remaining active claims' AS check_type,
  COUNT(*) AS count,
  status
FROM shop_claims
WHERE status IN ('draft', 'submitted', 'resubmission_required')
GROUP BY status;

SELECT 
  'Orphan documents remaining' AS check_type,
  COUNT(*) AS count
FROM shop_claim_documents
WHERE claim_id NOT IN (SELECT id FROM shop_claims);

