-- Add file_path column to shop_claim_documents for signed URL generation
-- This allows us to generate signed URLs for private bucket access

-- Add file_path column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shop_claim_documents'
      AND column_name = 'file_path'
  ) THEN
    ALTER TABLE shop_claim_documents
    ADD COLUMN file_path TEXT;
    
    -- Try to extract file_path from existing file_url values
    -- Format: https://xxx.supabase.co/storage/v1/object/public/verification-documents/USER_ID/CLAIM_ID/filename
    UPDATE shop_claim_documents
    SET file_path = SUBSTRING(
      file_url FROM 'verification-documents/(.+)$'
    )
    WHERE file_url IS NOT NULL
      AND file_path IS NULL
      AND file_url LIKE '%verification-documents/%';
    
    RAISE NOTICE 'Added file_path column and populated from existing file_url values';
  ELSE
    RAISE NOTICE 'file_path column already exists';
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN shop_claim_documents.file_path IS 'Storage path for generating signed URLs (e.g., user_id/claim_id/filename)';

