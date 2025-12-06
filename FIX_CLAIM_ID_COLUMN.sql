-- Fix script to ensure shop_claim_documents table has claim_id column
-- This handles the case where the table exists but is missing the column

-- Step 1: Check if table exists and what columns it has
DO $$
DECLARE
  table_exists BOOLEAN;
  has_claim_id BOOLEAN;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'shop_claim_documents'
  ) INTO table_exists;

  IF table_exists THEN
    -- Check if claim_id column exists
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'shop_claim_documents'
        AND column_name = 'claim_id'
    ) INTO has_claim_id;

    IF NOT has_claim_id THEN
      RAISE NOTICE 'Table exists but claim_id column is missing. Adding column...';
      
      -- First, ensure shop_claims table exists
      IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'shop_claims'
      ) THEN
        RAISE EXCEPTION 'shop_claims table does not exist. Please run the main migration first.';
      END IF;

      -- Add the claim_id column
      ALTER TABLE shop_claim_documents 
      ADD COLUMN claim_id UUID REFERENCES shop_claims(id) ON DELETE CASCADE;

      -- Update any existing rows (set to NULL for now, or delete them)
      -- Since we can't know which claim they belong to, we'll set them to NULL temporarily
      -- But claim_id is NOT NULL, so we need to either:
      -- 1. Delete existing rows, or
      -- 2. Create a dummy claim for orphaned documents
      
      -- Option: Delete orphaned documents (safer)
      DELETE FROM shop_claim_documents WHERE claim_id IS NULL;
      
      -- Now set NOT NULL
      ALTER TABLE shop_claim_documents ALTER COLUMN claim_id SET NOT NULL;

      RAISE NOTICE 'Added claim_id column successfully';
    ELSE
      RAISE NOTICE 'claim_id column already exists';
    END IF;
  ELSE
    RAISE NOTICE 'Table does not exist. Creating it...';
    
    -- Ensure shop_claims table exists first
    IF NOT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'shop_claims'
    ) THEN
      RAISE EXCEPTION 'shop_claims table does not exist. Please run the main migration first.';
    END IF;

    -- Check if claim_document_type enum exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_document_type') THEN
      CREATE TYPE claim_document_type AS ENUM (
        'business_proof',
        'id_document',
        'other'
      );
    END IF;

    -- Create the table with correct structure
    CREATE TABLE shop_claim_documents (
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

    -- RLS Policies
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

    RAISE NOTICE 'Created shop_claim_documents table successfully';
  END IF;
END $$;

-- Step 15: Verify the fix
SELECT 
  'Verification' AS check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shop_claim_documents'
  AND column_name = 'claim_id';

-- Step 16: Refresh PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');

