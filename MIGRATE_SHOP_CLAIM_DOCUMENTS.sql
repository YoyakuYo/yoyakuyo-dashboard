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
    
    -- Step 6: Ensure shop_claims table exists
    IF NOT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'shop_claims'
    ) THEN
      RAISE EXCEPTION 'shop_claims table does not exist. Please run the main migration first.';
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

