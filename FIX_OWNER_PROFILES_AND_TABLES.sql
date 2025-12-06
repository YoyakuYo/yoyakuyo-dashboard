-- Comprehensive fix for owner_profiles and all claim-related tables
-- This script handles existing data and creates missing tables

-- ============================================================================
-- STEP 1: Fix owner_profiles table
-- ============================================================================

-- First, ensure the table exists
CREATE TABLE IF NOT EXISTS owner_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
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

-- Add missing columns if they don't exist
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS prefecture TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS company_email TEXT;
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update any null full_name values before setting NOT NULL
UPDATE owner_profiles 
SET full_name = '' 
WHERE full_name IS NULL;

-- Now set NOT NULL constraint
DO $$
BEGIN
  -- Check if constraint already exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'owner_profiles_full_name_not_null'
  ) THEN
    RAISE NOTICE 'NOT NULL constraint already exists on full_name';
  ELSE
    ALTER TABLE owner_profiles ALTER COLUMN full_name SET NOT NULL;
    ALTER TABLE owner_profiles ALTER COLUMN full_name SET DEFAULT '';
    RAISE NOTICE 'Set full_name to NOT NULL with default empty string';
  END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_owner_profiles_updated_at ON owner_profiles;
CREATE TRIGGER update_owner_profiles_updated_at
  BEFORE UPDATE ON owner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS Policies
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

-- ============================================================================
-- STEP 2: Create claim_status enum if it doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_status') THEN
    CREATE TYPE claim_status AS ENUM (
      'draft',
      'submitted',
      'pending',
      'approved',
      'resubmission_required',
      'rejected',
      'cancelled'
    );
    RAISE NOTICE 'Created claim_status enum';
  ELSE
    RAISE NOTICE 'claim_status enum already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create claim_document_type enum if it doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_document_type') THEN
    CREATE TYPE claim_document_type AS ENUM (
      'business_proof',
      'id_document',
      'other'
    );
    RAISE NOTICE 'Created claim_document_type enum';
  ELSE
    RAISE NOTICE 'claim_document_type enum already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Create shop_claims table
-- ============================================================================

CREATE TABLE IF NOT EXISTS shop_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owner_profiles(id) ON DELETE CASCADE,
  status claim_status NOT NULL DEFAULT 'draft',
  staff_reviewer_id UUID REFERENCES auth.users(id),
  staff_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partial unique index for active claims
DROP INDEX IF EXISTS unique_active_claim_per_shop;
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_claim_per_shop 
ON shop_claims (shop_id, owner_id, status) 
WHERE status IN ('draft', 'submitted', 'pending', 'resubmission_required');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shop_claims_shop_id ON shop_claims(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_claims_owner_id ON shop_claims(owner_id);
CREATE INDEX IF NOT EXISTS idx_shop_claims_status ON shop_claims(status);
CREATE INDEX IF NOT EXISTS idx_shop_claims_staff_reviewer_id ON shop_claims(staff_reviewer_id);

-- Enable RLS
ALTER TABLE shop_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_claims
DROP POLICY IF EXISTS "Owners can view their own claims" ON shop_claims;
CREATE POLICY "Owners can view their own claims" ON shop_claims
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can insert their own claims" ON shop_claims;
CREATE POLICY "Owners can insert their own claims" ON shop_claims
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their own draft claims" ON shop_claims;
CREATE POLICY "Owners can update their own draft claims" ON shop_claims
  FOR UPDATE USING (
    auth.uid() = owner_id 
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

-- ============================================================================
-- STEP 5: Create shop_claim_documents table
-- ============================================================================

CREATE TABLE IF NOT EXISTS shop_claim_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES shop_claims(id) ON DELETE CASCADE,
  doc_type claim_document_type NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shop_claim_documents_claim_id ON shop_claim_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_shop_claim_documents_doc_type ON shop_claim_documents(doc_type);

-- Enable RLS
ALTER TABLE shop_claim_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_claim_documents
DROP POLICY IF EXISTS "Owners can view documents for their claims" ON shop_claim_documents;
CREATE POLICY "Owners can view documents for their claims" ON shop_claim_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shop_claims
      WHERE shop_claims.id = shop_claim_documents.claim_id
      AND shop_claims.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can insert documents for their draft claims" ON shop_claim_documents;
CREATE POLICY "Owners can insert documents for their draft claims" ON shop_claim_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_claims
      WHERE shop_claims.id = shop_claim_documents.claim_id
      AND shop_claims.owner_id = auth.uid()
      AND shop_claims.status IN ('draft', 'resubmission_required')
    )
  );

DROP POLICY IF EXISTS "Staff can view all claim documents" ON shop_claim_documents;
CREATE POLICY "Staff can view all claim documents" ON shop_claim_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

-- ============================================================================
-- STEP 6: Create complaint_status enum if it doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaint_status') THEN
    CREATE TYPE complaint_status AS ENUM (
      'open',
      'in_review',
      'resolved',
      'dismissed'
    );
    RAISE NOTICE 'Created complaint_status enum';
  ELSE
    RAISE NOTICE 'complaint_status enum already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 7: Create complaints table
-- ============================================================================

CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  complainant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'open',
  staff_reviewer_id UUID REFERENCES auth.users(id),
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_complaints_shop_id ON complaints(shop_id);
CREATE INDEX IF NOT EXISTS idx_complaints_complainant_id ON complaints(complainant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_staff_reviewer_id ON complaints(staff_reviewer_id);

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for complaints
DROP POLICY IF EXISTS "Users can view their own complaints" ON complaints;
CREATE POLICY "Users can view their own complaints" ON complaints
  FOR SELECT USING (auth.uid() = complainant_id);

DROP POLICY IF EXISTS "Users can create complaints" ON complaints;
CREATE POLICY "Users can create complaints" ON complaints
  FOR INSERT WITH CHECK (auth.uid() = complainant_id);

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

-- ============================================================================
-- STEP 8: Create staff_owner_threads table
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_owner_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES shop_claims(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owner_profiles(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_owner_threads_claim_id ON staff_owner_threads(claim_id);
CREATE INDEX IF NOT EXISTS idx_staff_owner_threads_owner_id ON staff_owner_threads(owner_id);
CREATE INDEX IF NOT EXISTS idx_staff_owner_threads_staff_id ON staff_owner_threads(staff_id);

-- Enable RLS
ALTER TABLE staff_owner_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_owner_threads
DROP POLICY IF EXISTS "Owners can view their threads" ON staff_owner_threads;
CREATE POLICY "Owners can view their threads" ON staff_owner_threads
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Staff can view all threads" ON staff_owner_threads;
CREATE POLICY "Staff can view all threads" ON staff_owner_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

DROP POLICY IF EXISTS "Staff can create threads" ON staff_owner_threads;
CREATE POLICY "Staff can create threads" ON staff_owner_threads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

-- ============================================================================
-- STEP 9: Create staff_owner_messages table
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_owner_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES staff_owner_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_owner_messages_thread_id ON staff_owner_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_staff_owner_messages_sender_id ON staff_owner_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_staff_owner_messages_created_at ON staff_owner_messages(created_at DESC);

-- Enable RLS
ALTER TABLE staff_owner_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_owner_messages
DROP POLICY IF EXISTS "Users can view messages in their threads" ON staff_owner_messages;
CREATE POLICY "Users can view messages in their threads" ON staff_owner_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_owner_threads
      WHERE staff_owner_threads.id = staff_owner_messages.thread_id
      AND (
        staff_owner_threads.owner_id = auth.uid()
        OR staff_owner_threads.staff_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their threads" ON staff_owner_messages;
CREATE POLICY "Users can send messages in their threads" ON staff_owner_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_owner_threads
      WHERE staff_owner_threads.id = staff_owner_messages.thread_id
      AND (
        staff_owner_threads.owner_id = auth.uid()
        OR staff_owner_threads.staff_id = auth.uid()
      )
    )
    AND sender_id = auth.uid()
  );

-- ============================================================================
-- STEP 10: Refresh PostgREST schema cache
-- ============================================================================

-- Notify PostgREST to reload schema (if using PostgREST)
SELECT pg_notify('pgrst', 'reload schema');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all tables exist
SELECT 
  'owner_profiles' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'owner_profiles') as exists
UNION ALL
SELECT 'shop_claims', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shop_claims')
UNION ALL
SELECT 'shop_claim_documents', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shop_claim_documents')
UNION ALL
SELECT 'complaints', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'complaints')
UNION ALL
SELECT 'staff_owner_threads', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_owner_threads')
UNION ALL
SELECT 'staff_owner_messages', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_owner_messages');

-- Verify owner_profiles has full_name column
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'owner_profiles'
  AND column_name = 'full_name';

