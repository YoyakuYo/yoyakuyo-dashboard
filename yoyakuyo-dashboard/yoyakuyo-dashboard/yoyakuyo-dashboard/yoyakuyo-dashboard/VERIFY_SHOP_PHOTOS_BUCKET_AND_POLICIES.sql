-- ============================================================
-- VERIFY shop_photos BUCKET AND POLICIES
-- ============================================================
-- Check if bucket exists and policies are configured
-- ============================================================

-- Step 1: Verify bucket exists
SELECT 
  'Bucket Exists' AS check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'shop_photos';

-- Step 2: Check storage policies for shop_photos
SELECT 
  'Storage Policies' AS check_type,
  policyname,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (qual LIKE '%shop_photos%' OR with_check LIKE '%shop_photos%' OR policyname LIKE '%shop_photos%')
ORDER BY policyname;

-- Step 3: Check if RLS is enabled on storage.objects
SELECT 
  'RLS Status' AS check_type,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'storage'
  AND tablename = 'objects';

-- Step 4: List ALL storage policies (to see what's configured)
SELECT 
  'All Storage Policies' AS check_type,
  policyname,
  cmd AS operation,
  CASE 
    WHEN qual LIKE '%shop_photos%' THEN '✅ shop_photos policy'
    WHEN qual LIKE '%verification%' THEN '✅ verification policy'
    ELSE 'Other policy'
  END AS policy_type
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- ============================================================
-- DIAGNOSIS
-- ============================================================
-- If bucket exists but policies are missing, that's the issue
-- If RLS is enabled but no policies exist, access will be denied
-- ============================================================

