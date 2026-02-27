-- ============================================================================
-- VERIFY: verification-documents bucket and related setup
-- Run this in Supabase Dashboard → SQL Editor to check if everything exists.
-- ============================================================================

-- 1) Storage bucket: verification-documents
SELECT
  'storage.buckets' AS check_type,
  id AS name,
  CASE WHEN id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'verification-documents';

-- If no row returned, bucket does NOT exist
-- If one row returned, bucket EXISTS (check public/file_size_limit/allowed_mime_types as needed)

-- 2) Storage policies on storage.objects for verification-documents
SELECT
  'storage.objects policies' AS check_type,
  policyname AS name,
  'EXISTS' AS status,
  cmd AS operation,
  qual IS NOT NULL AS has_using,
  with_check IS NOT NULL AS has_with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (qual::text LIKE '%verification-documents%' OR with_check::text LIKE '%verification-documents%')
ORDER BY policyname;

-- 3) Tables used by shop verification document flow (optional)
SELECT
  'public tables' AS check_type,
  table_name AS name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'shops',
    'shop_verification_requests',
    'shop_verification_documents',
    'owner_verification',
    'owner_verification_documents'
  )
ORDER BY table_name;

-- 4) Single summary: does the bucket exist? (run alone for a quick yes/no)
-- SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'verification-documents') AS bucket_verification_documents_exists;
