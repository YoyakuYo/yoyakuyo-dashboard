-- ============================================================================
-- CREATE OWNER VERIFICATION SYSTEM
-- ============================================================================
-- This migration creates the new owner verification and shop claim documents system
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE owner_verification TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS owner_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,

  -- Personal Identity
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality TEXT NOT NULL,
  country_of_residence TEXT NOT NULL,
  home_address TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,

  -- Business Relationship
  role_in_business TEXT NOT NULL CHECK (role_in_business IN ('Owner', 'Manager', 'Authorized Agent')),
  position_title TEXT NOT NULL,
  since_when DATE NOT NULL,

  -- Verification State
  verification_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (verification_status IN ('pending', 'approved', 'rejected', 'resubmission_required')),

  -- Rejection tracking
  rejection_reason TEXT,
  failed_attempts INTEGER DEFAULT 0,
  last_rejection_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- STEP 2: CREATE shop_claim_documents TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS shop_claim_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES owner_verification(id) ON DELETE CASCADE,

  document_type TEXT NOT NULL CHECK (
    document_type IN (
      'business_registration',
      'tax_registration',
      'commercial_registry',
      'lease_contract',
      'utility_bill',
      'bank_statement',
      'government_id',
      'selfie_with_id'
    )
  ),

  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- STEP 3: ADD claim_status TO shops TABLE
-- ============================================================================

DO $$
BEGIN
  -- Add claim_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shops' 
    AND column_name = 'claim_status'
  ) THEN
    ALTER TABLE shops ADD COLUMN claim_status TEXT NOT NULL DEFAULT 'unclaimed'
      CHECK (claim_status IN ('unclaimed', 'pending', 'approved', 'rejected'));
  ELSE
    -- Update constraint if column exists but constraint doesn't match
    ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_claim_status_check;
    ALTER TABLE shops ADD CONSTRAINT shops_claim_status_check 
      CHECK (claim_status IN ('unclaimed', 'pending', 'approved', 'rejected'));
    
    -- Update existing NULL values
    UPDATE shops SET claim_status = 'unclaimed' WHERE claim_status IS NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_owner_verification_user_id ON owner_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_verification_shop_id ON owner_verification(shop_id);
CREATE INDEX IF NOT EXISTS idx_owner_verification_status ON owner_verification(verification_status);
CREATE INDEX IF NOT EXISTS idx_shop_claim_documents_verification_id ON shop_claim_documents(verification_id);
CREATE INDEX IF NOT EXISTS idx_shops_claim_status ON shops(claim_status);

-- ============================================================================
-- STEP 5: ENABLE RLS
-- ============================================================================

ALTER TABLE owner_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_claim_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: RLS POLICIES FOR owner_verification
-- ============================================================================

-- Users can view their own verification
CREATE POLICY "Users can view own verification"
  ON owner_verification FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own verification (only if status is pending or resubmission_required)
CREATE POLICY "Users can create own verification"
  ON owner_verification FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (verification_status = 'pending' OR verification_status = 'resubmission_required')
  );

-- Users can update their own verification (only if pending or resubmission_required)
CREATE POLICY "Users can update own verification if pending"
  ON owner_verification FOR UPDATE
  USING (
    auth.uid() = user_id AND
    (verification_status = 'pending' OR verification_status = 'resubmission_required')
  );

-- Staff can view all verifications
CREATE POLICY "Staff can view all verifications"
  ON owner_verification FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.auth_user_id = auth.uid()
      AND staff_profiles.active = true
    )
  );

-- Staff can update all verifications
CREATE POLICY "Staff can update all verifications"
  ON owner_verification FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.auth_user_id = auth.uid()
      AND staff_profiles.active = true
    )
  );

-- ============================================================================
-- STEP 7: RLS POLICIES FOR shop_claim_documents
-- ============================================================================

-- Users can view documents for their own verification
CREATE POLICY "Users can view own documents"
  ON shop_claim_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM owner_verification
      WHERE owner_verification.id = shop_claim_documents.verification_id
      AND owner_verification.user_id = auth.uid()
    )
  );

-- Users can insert documents for their own verification
CREATE POLICY "Users can insert own documents"
  ON shop_claim_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM owner_verification
      WHERE owner_verification.id = shop_claim_documents.verification_id
      AND owner_verification.user_id = auth.uid()
      AND (owner_verification.verification_status = 'pending' OR owner_verification.verification_status = 'resubmission_required')
    )
  );

-- Staff can view all documents
CREATE POLICY "Staff can view all documents"
  ON shop_claim_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.auth_user_id = auth.uid()
      AND staff_profiles.active = true
    )
  );

-- Staff can insert/update/delete all documents
CREATE POLICY "Staff can manage all documents"
  ON shop_claim_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.auth_user_id = auth.uid()
      AND staff_profiles.active = true
    )
  );

-- ============================================================================
-- STEP 8: UPDATE TRIGGER FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_owner_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_owner_verification_updated_at
  BEFORE UPDATE ON owner_verification
  FOR EACH ROW
  EXECUTE FUNCTION update_owner_verification_updated_at();

-- ============================================================================
-- STEP 9: COMMENTS
-- ============================================================================

COMMENT ON TABLE owner_verification IS 'Owner identity and business relationship verification';
COMMENT ON TABLE shop_claim_documents IS 'Documents uploaded for shop claim verification';
COMMENT ON COLUMN owner_verification.verification_status IS 'pending: awaiting review, approved: verified, rejected: denied, resubmission_required: needs more documents';
COMMENT ON COLUMN owner_verification.failed_attempts IS 'Number of failed verification attempts';
COMMENT ON COLUMN shops.claim_status IS 'unclaimed: no owner, pending: claim submitted, approved: claim approved, rejected: claim denied';

