-- MIGRATE shop_claim_documents FROM OLD SCHEMA (verification_id) TO NEW SCHEMA (claim_id)
-- This script handles the migration from the old owner_verification system to the new shop_claims system

DO $$
DECLARE
  has_verification_id BOOLEAN;
  has_claim_id BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'shop_claim_documents'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE NOTICE 'Table does not exist. Please run the main migration first.';
    RETURN;
  END IF;

  -- Check what columns exist
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shop_claim_documents'
      AND column_name = 'verification_id'
  ) INTO has_verification_id;

  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shop_claim_documents'
      AND column_name = 'claim_id'
  ) INTO has_claim_id;

  IF has_verification_id AND NOT has_claim_id THEN
    RAISE NOTICE 'Migrating from old schema (verification_id) to new schema (claim_id)...';
    
    -- Step 1: Drop ALL RLS policies that depend on verification_id
    -- These policies reference verification_id in their USING/CHECK clauses
    DROP POLICY IF EXISTS "Users can view own documents" ON shop_claim_documents;
    DROP POLICY IF EXISTS "Users can insert own documents" ON shop_claim_documents;
    DROP POLICY IF EXISTS "Owners can view documents for their verifications" ON shop_claim_documents;
    DROP POLICY IF EXISTS "Owners can insert documents for their verifications" ON shop_claim_documents;
    DROP POLICY IF EXISTS "Owners can view documents for their claims" ON shop_claim_documents;
    DROP POLICY IF EXISTS "Owners can insert documents for their draft claims" ON shop_claim_documents;
    DROP POLICY IF EXISTS "Staff can view all documents" ON shop_claim_documents;
    DROP POLICY IF EXISTS "Staff can view all claim documents" ON shop_claim_documents;
    
    -- Step 2: Drop old foreign key constraint
    ALTER TABLE shop_claim_documents 
    DROP CONSTRAINT IF EXISTS shop_claim_documents_verification_id_fkey CASCADE;
    
    -- Step 3: Delete old index
    DROP INDEX IF EXISTS idx_shop_claim_documents_verification_id;
    
    -- Step 4: Delete all existing rows (they reference old owner_verification system)
    -- Since we're rebuilding the system, old data is incompatible
    DELETE FROM shop_claim_documents;
    
    -- Step 5: Drop the old column (now safe since policies and constraints are dropped)
    ALTER TABLE shop_claim_documents 
    DROP COLUMN IF EXISTS verification_id CASCADE;
    
    -- Step 6: Ensure shop_claims table exists, create if it doesn't
    IF NOT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'shop_claims'
    ) THEN
      RAISE NOTICE 'shop_claims table does not exist. Creating it...';
      
      -- Ensure claim_status enum exists
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
      END IF;
      
      -- Ensure owner_profiles exists (needed for foreign key)
      IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'owner_profiles'
      ) THEN
        CREATE TABLE IF NOT EXISTS owner_profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          full_name TEXT NOT NULL DEFAULT '',
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
        
        -- Enable RLS
        ALTER TABLE owner_profiles ENABLE ROW LEVEL SECURITY;
      END IF;
      
      -- Create shop_claims table
      CREATE TABLE shop_claims (
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
      
      -- Basic RLS policies for shop_claims
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
      
      RAISE NOTICE 'Created shop_claims table successfully';
    END IF;
    
    -- Step 7: Ensure claim_document_type enum exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_document_type') THEN
      CREATE TYPE claim_document_type AS ENUM (
        'business_proof',
        'id_document',
        'other'
      );
    END IF;
    
    -- Step 8: Add new claim_id column
    ALTER TABLE shop_claim_documents 
    ADD COLUMN claim_id UUID REFERENCES shop_claims(id) ON DELETE CASCADE;
    
    -- Step 9: Handle doc_type column
    -- Check if doc_type exists and what type it is
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'shop_claim_documents'
        AND column_name = 'document_type'
        AND data_type = 'text'
    ) THEN
      -- Old table has document_type (TEXT), need to convert to doc_type (enum)
      -- First, add new doc_type column
      ALTER TABLE shop_claim_documents 
      ADD COLUMN doc_type claim_document_type;
      
      -- Convert old document_type values to new enum values
      UPDATE shop_claim_documents 
      SET doc_type = CASE 
        WHEN document_type IN ('business_registration', 'tax_registration', 'commercial_registry', 'lease_contract', 'utility_bill', 'bank_statement') 
        THEN 'business_proof'::claim_document_type
        WHEN document_type IN ('government_id', 'selfie_with_id') 
        THEN 'id_document'::claim_document_type
        ELSE 'other'::claim_document_type
      END;
      
      -- Drop old document_type column
      ALTER TABLE shop_claim_documents 
      DROP COLUMN document_type;
      
      -- Set NOT NULL
      ALTER TABLE shop_claim_documents 
      ALTER COLUMN doc_type SET NOT NULL;
      
    ELSIF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'shop_claim_documents'
        AND column_name = 'doc_type'
        AND data_type = 'text'
    ) THEN
      -- doc_type exists but is TEXT, convert to enum
      ALTER TABLE shop_claim_documents 
      ALTER COLUMN doc_type TYPE claim_document_type 
      USING CASE 
        WHEN doc_type IN ('business_registration', 'tax_registration', 'commercial_registry', 'lease_contract', 'utility_bill', 'bank_statement') 
        THEN 'business_proof'::claim_document_type
        WHEN doc_type IN ('government_id', 'selfie_with_id') 
        THEN 'id_document'::claim_document_type
        ELSE 'other'::claim_document_type
      END;
      
    ELSIF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'shop_claim_documents'
        AND column_name = 'doc_type'
    ) THEN
      -- Add doc_type column if it doesn't exist
      ALTER TABLE shop_claim_documents 
      ADD COLUMN doc_type claim_document_type NOT NULL DEFAULT 'other';
    END IF;
    
    -- Step 10: Ensure file_url exists and is NOT NULL
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'shop_claim_documents'
        AND column_name = 'file_url'
    ) THEN
      ALTER TABLE shop_claim_documents 
      ADD COLUMN file_url TEXT NOT NULL DEFAULT '';
    ELSIF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'shop_claim_documents'
        AND column_name = 'file_url'
        AND is_nullable = 'YES'
    ) THEN
      -- Update NULL values
      UPDATE shop_claim_documents SET file_url = '' WHERE file_url IS NULL;
      ALTER TABLE shop_claim_documents 
      ALTER COLUMN file_url SET NOT NULL;
    END IF;
    
    -- Step 11: Ensure id column exists (primary key)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'shop_claim_documents'
        AND column_name = 'id'
    ) THEN
      ALTER TABLE shop_claim_documents 
      ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    END IF;
    
    -- Step 12: Ensure created_at exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'shop_claim_documents'
        AND column_name = 'created_at'
    ) THEN
      ALTER TABLE shop_claim_documents 
      ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Step 13: Set claim_id to NOT NULL (after ensuring all rows have values)
    -- Since we deleted all rows, this is safe
    ALTER TABLE shop_claim_documents 
    ALTER COLUMN claim_id SET NOT NULL;
    
    -- Step 14: Create new index
    CREATE INDEX IF NOT EXISTS idx_shop_claim_documents_claim_id 
    ON shop_claim_documents(claim_id);
    
    CREATE INDEX IF NOT EXISTS idx_shop_claim_documents_doc_type 
    ON shop_claim_documents(doc_type);
    
    -- Step 15: Create new RLS policies for claim_id
    CREATE POLICY "Owners can view documents for their claims" ON shop_claim_documents
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM shop_claims
          WHERE shop_claims.id = shop_claim_documents.claim_id
          AND shop_claims.owner_id = auth.uid()
        )
      );

    CREATE POLICY "Owners can insert documents for their draft claims" ON shop_claim_documents
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM shop_claims
          WHERE shop_claims.id = shop_claim_documents.claim_id
          AND shop_claims.owner_id = auth.uid()
          AND shop_claims.status IN ('draft', 'resubmission_required')
        )
      );

    CREATE POLICY "Staff can view all claim documents" ON shop_claim_documents
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM staff_profiles
          WHERE auth_user_id = auth.uid() AND active = true
        )
      );
    
    RAISE NOTICE 'Migration completed successfully';
    
  ELSIF has_claim_id THEN
    RAISE NOTICE 'Table already has claim_id column. No migration needed.';
  ELSE
    RAISE NOTICE 'Table exists but structure is unknown. Please check manually.';
  END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist (outside DO block)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shop_claims if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'shop_claims'
  ) THEN
    DROP TRIGGER IF EXISTS update_shop_claims_updated_at ON shop_claims;
    CREATE TRIGGER update_shop_claims_updated_at
      BEFORE UPDATE ON shop_claims
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Verification: Check the final structure
SELECT 
  'Final Structure' AS check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shop_claim_documents'
ORDER BY ordinal_position;

-- Refresh PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');

