-- ============================================================
-- Fix: verification-documents INSERT RLS Policy
-- ============================================================
-- Error: "new row violates row-level security policy"
-- The INSERT policy is blocking authenticated user uploads to verification-documents bucket
-- ============================================================

-- Step 1: Drop ALL existing INSERT policies for verification-documents (to avoid conflicts)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Find and drop all INSERT policies that reference verification-documents
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'INSERT'
      AND (
        qual LIKE '%verification%' 
        OR with_check LIKE '%verification%' 
        OR policyname LIKE '%verification%'
        OR policyname LIKE '%upload%document%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- Step 2: Create correct INSERT policy for verification-documents bucket
-- This allows authenticated users to upload verification documents
-- Path format: {verification_id}/{filename}
-- We check that the verification_id belongs to the current user
CREATE POLICY "Authenticated users can upload verification documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND auth.role() = 'authenticated'
    AND (
      -- Check if the first folder (verification_id) belongs to the current user
      EXISTS (
        SELECT 1 FROM owner_verification
        WHERE id::text = (storage.foldername(name))[1]
        AND user_id = auth.uid()
      )
    )
  );

-- Step 3: Verify policy was created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Authenticated users can upload verification documents'
    AND cmd = 'INSERT';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ INSERT policy created successfully';
  ELSE
    RAISE WARNING '❌ INSERT policy not found after creation';
  END IF;
END $$;

-- ============================================================
-- VERIFICATION QUERY
-- ============================================================
-- Run this to verify all verification-documents policies:
--
-- SELECT 
--   policyname,
--   cmd AS operation,
--   qual AS using_expression,
--   with_check AS with_check_expression
-- FROM pg_policies
-- WHERE schemaname = 'storage'
--   AND tablename = 'objects'
--   AND (qual LIKE '%verification%' 
--        OR with_check LIKE '%verification%' 
--        OR policyname LIKE '%verification%')
-- ORDER BY cmd, policyname;
-- ============================================================

