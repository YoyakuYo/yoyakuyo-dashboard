-- ============================================================
-- VERIFY: verification-documents Storage Policies
-- ============================================================
-- Check all policies for the verification-documents bucket
-- ============================================================

-- Check bucket exists and configuration
SELECT 
  'Bucket Config' AS check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'verification-documents';

-- Check all policies for verification-documents
SELECT 
  'All Policies' AS check_type,
  policyname,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual LIKE '%verification%' 
    OR with_check LIKE '%verification%' 
    OR policyname LIKE '%verification%'
  )
ORDER BY cmd, policyname;

-- Specifically check INSERT policy
SELECT 
  'INSERT Policy' AS check_type,
  policyname,
  cmd AS operation,
  with_check AS with_check_expression,
  CASE 
    WHEN with_check LIKE '%verification-documents%' AND with_check LIKE '%authenticated%' 
    THEN '✅ Correctly configured'
    ELSE '❌ Needs fixing'
  END AS status
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND cmd = 'INSERT'
  AND (
    qual LIKE '%verification%' 
    OR with_check LIKE '%verification%' 
    OR policyname LIKE '%verification%'
  );

-- Check if user is authenticated (run this as the uploading user)
SELECT 
  'Auth Status' AS check_type,
  auth.role() AS current_role,
  auth.uid() AS user_id,
  CASE 
    WHEN auth.role() = 'authenticated' THEN '✅ Authenticated'
    ELSE '❌ Not authenticated'
  END AS status;

