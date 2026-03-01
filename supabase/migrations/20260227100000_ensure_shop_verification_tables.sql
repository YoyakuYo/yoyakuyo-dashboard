-- ============================================================================
-- Ensure shop_verification_requests and shop_verification_documents exist
-- (API expects these; schema may have only owner_verification from earlier migrations)
-- ============================================================================

-- STEP 1: Create shop_verification_requests if not exists
-- Use auth.users for owner_profile_id FK so we don't depend on owner_profiles existing
CREATE TABLE IF NOT EXISTS shop_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  owner_profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by_staff_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_shop_id ON shop_verification_requests(shop_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON shop_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_owner_profile_id ON shop_verification_requests(owner_profile_id);

-- STEP 2: Create shop_verification_documents if not exists
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

-- STEP 3: Enable RLS
ALTER TABLE shop_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_verification_documents ENABLE ROW LEVEL SECURITY;

-- STEP 4: RLS for shop_verification_requests (owner_profile_id stores auth user id)
DROP POLICY IF EXISTS "Owners can view their verification requests" ON shop_verification_requests;
CREATE POLICY "Owners can view their verification requests"
  ON shop_verification_requests FOR SELECT
  USING (owner_profile_id = auth.uid());

DROP POLICY IF EXISTS "Owners can create verification requests" ON shop_verification_requests;
CREATE POLICY "Owners can create verification requests"
  ON shop_verification_requests FOR INSERT
  WITH CHECK (owner_profile_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update pending verification requests" ON shop_verification_requests;
CREATE POLICY "Owners can update pending verification requests"
  ON shop_verification_requests FOR UPDATE
  USING (status = 'pending' AND owner_profile_id = auth.uid())
  WITH CHECK (status = 'pending' AND owner_profile_id = auth.uid());

-- STEP 5: RLS for shop_verification_documents
DROP POLICY IF EXISTS "Owners can view their verification documents" ON shop_verification_documents;
CREATE POLICY "Owners can view their verification documents"
  ON shop_verification_documents FOR SELECT
  USING (
    verification_request_id IN (
      SELECT id FROM shop_verification_requests WHERE owner_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can create verification documents" ON shop_verification_documents;
CREATE POLICY "Owners can create verification documents"
  ON shop_verification_documents FOR INSERT
  WITH CHECK (
    verification_request_id IN (
      SELECT id FROM shop_verification_requests WHERE owner_profile_id = auth.uid()
    )
  );

-- STEP 6: updated_at trigger
CREATE OR REPLACE FUNCTION update_verification_requests_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
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

COMMENT ON TABLE shop_verification_requests IS 'Verification requests submitted by shop owners';
COMMENT ON TABLE shop_verification_documents IS 'Documents uploaded for shop verification';
