-- ============================================================================
-- ADD 'draft' STATUS TO owner_verification
-- ============================================================================
-- This allows verifications to be created without documents, 
-- and only moved to 'pending' after documents are uploaded

-- Drop existing constraint
ALTER TABLE owner_verification DROP CONSTRAINT IF EXISTS owner_verification_verification_status_check;

-- Add new constraint with 'draft' status
ALTER TABLE owner_verification ADD CONSTRAINT owner_verification_verification_status_check
  CHECK (verification_status IN ('draft', 'pending', 'approved', 'rejected', 'resubmission_required'));

-- Update default to 'draft' for new verifications
ALTER TABLE owner_verification ALTER COLUMN verification_status SET DEFAULT 'draft';

COMMENT ON COLUMN owner_verification.verification_status IS 
  'draft: identity submitted but no documents yet, pending: awaiting review, approved: verified, rejected: denied, resubmission_required: needs more documents';

