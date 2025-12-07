-- ============================================================
-- VERIFY: shop_photos INSERT Policy
-- ============================================================
-- Run this to check if the INSERT policy is correctly configured
-- ============================================================

-- Check all INSERT policies for shop_photos
SELECT 
  'INSERT Policies' AS check_type,
  policyname,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND cmd = 'INSERT'
  AND (
    qual LIKE '%shop_photos%' 
    OR with_check LIKE '%shop_photos%' 
    OR policyname LIKE '%shop_photos%'
    OR policyname LIKE '%upload%'
  )
ORDER BY policyname;

-- Check if user is authenticated (run this as the uploading user)
SELECT 
  'Auth Status' AS check_type,
  auth.role() AS current_role,
  auth.uid() AS user_id,
  CASE 
    WHEN auth.role() = 'authenticated' THEN '✅ Authenticated'
    ELSE '❌ Not authenticated'
  END AS status;

-- Test policy evaluation (this simulates what happens during upload)
SELECT 
  'Policy Test' AS check_type,
  bucket_id = 'shop_photos' AS bucket_match,
  auth.role() = 'authenticated' AS auth_match,
  (bucket_id = 'shop_photos' AND auth.role() = 'authenticated') AS policy_passes
FROM storage.buckets
WHERE id = 'shop_photos'
LIMIT 1;

