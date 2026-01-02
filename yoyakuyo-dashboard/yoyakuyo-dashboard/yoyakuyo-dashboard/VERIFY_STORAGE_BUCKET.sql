-- Verify Storage Bucket Exists
-- Bucket name used in code: verification-documents

-- Step 1: Check if bucket exists
SELECT 
  'Bucket Check' AS check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'verification-documents';

-- Step 2: If bucket doesn't exist, you'll see 0 rows
-- In that case, run the creation SQL below

-- Step 3: Check storage policies for this bucket
SELECT 
  'Storage Policies' AS check_type,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%verification%'
ORDER BY policyname;

