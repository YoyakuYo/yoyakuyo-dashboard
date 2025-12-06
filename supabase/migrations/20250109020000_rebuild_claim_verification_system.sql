-- Rebuild Claim & Verification System from Scratch
-- This migration creates the new strict claim/verification system

-- 1. Create enums
DO $$ BEGIN
  CREATE TYPE claim_status AS ENUM (
    'draft',
    'submitted',
    'pending',
    'approved',
    'resubmission_required',
    'rejected',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE claim_document_type AS ENUM (
    'business_proof',
    'id_document',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE complaint_status AS ENUM (
    'open',
    'in_review',
    'resolved',
    'dismissed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create owner_profiles table
CREATE TABLE IF NOT EXISTS owner_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  country TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  prefecture TEXT,
  postal_code TEXT,
  company_phone TEXT,
  company_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create shop_claims table
CREATE TABLE IF NOT EXISTS shop_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owner_profiles(id) ON DELETE CASCADE,
  status claim_status NOT NULL DEFAULT 'draft',
  staff_reviewer_id UUID REFERENCES auth.users(id),
  staff_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_active_claim_per_shop UNIQUE (shop_id, owner_id, status) 
    WHERE status IN ('draft', 'submitted', 'pending', 'resubmission_required')
);

-- 4. Create shop_claim_documents table
CREATE TABLE IF NOT EXISTS shop_claim_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES shop_claims(id) ON DELETE CASCADE,
  doc_type claim_document_type NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  message TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create staff_owner_threads table
CREATE TABLE IF NOT EXISTS staff_owner_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owner_profiles(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create staff_owner_messages table
CREATE TABLE IF NOT EXISTS staff_owner_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES staff_owner_threads(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('staff', 'owner')),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create indexes
CREATE INDEX IF NOT EXISTS idx_shop_claims_shop_id ON shop_claims(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_claims_owner_id ON shop_claims(owner_id);
CREATE INDEX IF NOT EXISTS idx_shop_claims_status ON shop_claims(status);
CREATE INDEX IF NOT EXISTS idx_shop_claim_documents_claim_id ON shop_claim_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_complaints_shop_id ON complaints(shop_id);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_staff_owner_threads_shop_id ON staff_owner_threads(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_owner_threads_owner_id ON staff_owner_threads(owner_id);
CREATE INDEX IF NOT EXISTS idx_staff_owner_messages_thread_id ON staff_owner_messages(thread_id);

-- 9. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Apply triggers
DROP TRIGGER IF EXISTS update_owner_profiles_updated_at ON owner_profiles;
CREATE TRIGGER update_owner_profiles_updated_at
  BEFORE UPDATE ON owner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shop_claims_updated_at ON shop_claims;
CREATE TRIGGER update_shop_claims_updated_at
  BEFORE UPDATE ON shop_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints;
CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 11. Enable RLS
ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_owner_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_owner_messages ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies for owner_profiles
DROP POLICY IF EXISTS "Owners can view their own profile" ON owner_profiles;
CREATE POLICY "Owners can view their own profile" ON owner_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owners can update their own profile" ON owner_profiles;
CREATE POLICY "Owners can update their own profile" ON owner_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owners can insert their own profile" ON owner_profiles;
CREATE POLICY "Owners can insert their own profile" ON owner_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Staff can view all owner profiles" ON owner_profiles;
CREATE POLICY "Staff can view all owner profiles" ON owner_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

-- 13. RLS Policies for shop_claims
DROP POLICY IF EXISTS "Owners can view their own claims" ON shop_claims;
CREATE POLICY "Owners can view their own claims" ON shop_claims
  FOR SELECT USING (
    owner_id IN (SELECT id FROM owner_profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Owners can insert their own claims" ON shop_claims;
CREATE POLICY "Owners can insert their own claims" ON shop_claims
  FOR INSERT WITH CHECK (
    owner_id IN (SELECT id FROM owner_profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Owners can update their own draft claims" ON shop_claims;
CREATE POLICY "Owners can update their own draft claims" ON shop_claims
  FOR UPDATE USING (
    owner_id IN (SELECT id FROM owner_profiles WHERE id = auth.uid())
    AND status IN ('draft', 'resubmission_required')
  );

DROP POLICY IF EXISTS "Staff can view all claims" ON shop_claims;
CREATE POLICY "Staff can view all claims" ON shop_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

DROP POLICY IF EXISTS "Staff can update claims" ON shop_claims;
CREATE POLICY "Staff can update claims" ON shop_claims
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

-- 14. RLS Policies for shop_claim_documents
DROP POLICY IF EXISTS "Owners can view documents for their claims" ON shop_claim_documents;
CREATE POLICY "Owners can view documents for their claims" ON shop_claim_documents
  FOR SELECT USING (
    claim_id IN (
      SELECT id FROM shop_claims
      WHERE owner_id IN (SELECT id FROM owner_profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owners can insert documents for their claims" ON shop_claim_documents;
CREATE POLICY "Owners can insert documents for their claims" ON shop_claim_documents
  FOR INSERT WITH CHECK (
    claim_id IN (
      SELECT id FROM shop_claims
      WHERE owner_id IN (SELECT id FROM owner_profiles WHERE id = auth.uid())
      AND status IN ('draft', 'resubmission_required')
    )
  );

DROP POLICY IF EXISTS "Staff can view all documents" ON shop_claim_documents;
CREATE POLICY "Staff can view all documents" ON shop_claim_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

-- 15. RLS Policies for complaints
DROP POLICY IF EXISTS "Users can view their own complaints" ON complaints;
CREATE POLICY "Users can view their own complaints" ON complaints
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own complaints" ON complaints;
CREATE POLICY "Users can insert their own complaints" ON complaints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can view all complaints" ON complaints;
CREATE POLICY "Staff can view all complaints" ON complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

DROP POLICY IF EXISTS "Staff can update complaints" ON complaints;
CREATE POLICY "Staff can update complaints" ON complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

-- 16. RLS Policies for staff_owner_threads
DROP POLICY IF EXISTS "Owners can view their threads" ON staff_owner_threads;
CREATE POLICY "Owners can view their threads" ON staff_owner_threads
  FOR SELECT USING (
    owner_id IN (SELECT id FROM owner_profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Staff can view all threads" ON staff_owner_threads;
CREATE POLICY "Staff can view all threads" ON staff_owner_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

DROP POLICY IF EXISTS "Staff can insert threads" ON staff_owner_threads;
CREATE POLICY "Staff can insert threads" ON staff_owner_threads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

-- 17. RLS Policies for staff_owner_messages
DROP POLICY IF EXISTS "Owners can view messages in their threads" ON staff_owner_messages;
CREATE POLICY "Owners can view messages in their threads" ON staff_owner_messages
  FOR SELECT USING (
    thread_id IN (
      SELECT id FROM staff_owner_threads
      WHERE owner_id IN (SELECT id FROM owner_profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owners can send messages in their threads" ON staff_owner_messages;
CREATE POLICY "Owners can send messages in their threads" ON staff_owner_messages
  FOR INSERT WITH CHECK (
    sender_role = 'owner'
    AND sender_id = auth.uid()
    AND thread_id IN (
      SELECT id FROM staff_owner_threads
      WHERE owner_id IN (SELECT id FROM owner_profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Staff can view all messages" ON staff_owner_messages;
CREATE POLICY "Staff can view all messages" ON staff_owner_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

DROP POLICY IF EXISTS "Staff can send messages" ON staff_owner_messages;
CREATE POLICY "Staff can send messages" ON staff_owner_messages
  FOR INSERT WITH CHECK (
    sender_role = 'staff'
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

-- 18. Create function to check if user is staff
CREATE OR REPLACE FUNCTION is_staff_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE auth_user_id = user_id AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

