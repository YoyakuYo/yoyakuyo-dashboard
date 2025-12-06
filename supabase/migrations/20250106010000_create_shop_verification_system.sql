-- ============================================================================
-- CREATE SHOP VERIFICATION REQUEST & DOCUMENTS SYSTEM
-- ============================================================================
-- This migration creates tables for:
-- 1. shop_verification_requests - tracks verification submissions
-- 2. shop_verification_documents - stores uploaded verification documents
-- ============================================================================

-- ============================================================================
-- STEP 1: Create shop_verification_requests table
-- ============================================================================
CREATE TABLE IF NOT EXISTS shop_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  owner_profile_id UUID REFERENCES owner_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by_staff_id UUID, -- References staff_profiles(id) if table exists
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_shop_id ON shop_verification_requests(shop_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON shop_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_owner_profile_id ON shop_verification_requests(owner_profile_id);

-- ============================================================================
-- STEP 2: Create shop_verification_documents table
-- ============================================================================
CREATE TABLE IF NOT EXISTS shop_verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_request_id UUID NOT NULL REFERENCES shop_verification_requests(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('owner_id', 'business_registration', 'tax_doc', 'lease', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_documents_request_id ON shop_verification_documents(verification_request_id);
CREATE INDEX IF NOT EXISTS idx_verification_documents_doc_type ON shop_verification_documents(doc_type);

-- ============================================================================
-- STEP 3: Enable RLS
-- ============================================================================
ALTER TABLE shop_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_verification_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: RLS Policies for shop_verification_requests
-- ============================================================================

-- Owners can view their own verification requests
DROP POLICY IF EXISTS "Owners can view their verification requests" ON shop_verification_requests;
CREATE POLICY "Owners can view their verification requests"
  ON shop_verification_requests FOR SELECT
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
    OR owner_profile_id IN (SELECT id FROM owner_profiles WHERE owner_user_id = auth.uid())
  );

-- Owners can create verification requests for their shops
DROP POLICY IF EXISTS "Owners can create verification requests" ON shop_verification_requests;
CREATE POLICY "Owners can create verification requests"
  ON shop_verification_requests FOR INSERT
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
    OR owner_profile_id IN (SELECT id FROM owner_profiles WHERE owner_user_id = auth.uid())
  );

-- Owners can update their own verification requests (only if pending)
DROP POLICY IF EXISTS "Owners can update pending verification requests" ON shop_verification_requests;
CREATE POLICY "Owners can update pending verification requests"
  ON shop_verification_requests FOR UPDATE
  USING (
    status = 'pending'
    AND (
      shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
      OR owner_profile_id IN (SELECT id FROM owner_profiles WHERE owner_user_id = auth.uid())
    )
  )
  WITH CHECK (
    status = 'pending'
    AND (
      shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
      OR owner_profile_id IN (SELECT id FROM owner_profiles WHERE owner_user_id = auth.uid())
    )
  );

-- Staff can view all verification requests
DROP POLICY IF EXISTS "Staff can view all verification requests" ON shop_verification_requests;
CREATE POLICY "Staff can view all verification requests"
  ON shop_verification_requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM staff_profiles WHERE auth_user_id = auth.uid() AND active = TRUE)
  );

-- Staff can update verification requests (approve/reject)
DROP POLICY IF EXISTS "Staff can update verification requests" ON shop_verification_requests;
CREATE POLICY "Staff can update verification requests"
  ON shop_verification_requests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM staff_profiles WHERE auth_user_id = auth.uid() AND active = TRUE)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff_profiles WHERE auth_user_id = auth.uid() AND active = TRUE)
  );

-- ============================================================================
-- STEP 5: RLS Policies for shop_verification_documents
-- ============================================================================

-- Owners can view documents for their verification requests
DROP POLICY IF EXISTS "Owners can view their verification documents" ON shop_verification_documents;
CREATE POLICY "Owners can view their verification documents"
  ON shop_verification_documents FOR SELECT
  USING (
    verification_request_id IN (
      SELECT id FROM shop_verification_requests
      WHERE shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
      OR owner_profile_id IN (SELECT id FROM owner_profiles WHERE owner_user_id = auth.uid())
    )
  );

-- Owners can create documents for their verification requests
DROP POLICY IF EXISTS "Owners can create verification documents" ON shop_verification_documents;
CREATE POLICY "Owners can create verification documents"
  ON shop_verification_documents FOR INSERT
  WITH CHECK (
    verification_request_id IN (
      SELECT id FROM shop_verification_requests
      WHERE shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
      OR owner_profile_id IN (SELECT id FROM owner_profiles WHERE owner_user_id = auth.uid())
    )
  );

-- Staff can view all verification documents
DROP POLICY IF EXISTS "Staff can view all verification documents" ON shop_verification_documents;
CREATE POLICY "Staff can view all verification documents"
  ON shop_verification_documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM staff_profiles WHERE auth_user_id = auth.uid() AND active = TRUE)
  );

-- ============================================================================
-- STEP 6: Create updated_at trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_verification_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_verification_requests_updated_at ON shop_verification_requests;
CREATE TRIGGER update_verification_requests_updated_at
  BEFORE UPDATE ON shop_verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_requests_updated_at();

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================
COMMENT ON TABLE shop_verification_requests IS 'Verification requests submitted by shop owners';
COMMENT ON TABLE shop_verification_documents IS 'Documents uploaded for shop verification';
COMMENT ON COLUMN shop_verification_requests.status IS 'Verification status: pending, approved, or rejected';
COMMENT ON COLUMN shop_verification_requests.notes IS 'Notes from staff reviewers';
COMMENT ON COLUMN shop_verification_requests.reviewed_by_staff_id IS 'Staff member who reviewed the request';
COMMENT ON COLUMN shop_verification_documents.doc_type IS 'Type of document: owner_id, business_registration, tax_doc, lease, or other';

