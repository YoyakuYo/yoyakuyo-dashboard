-- ============================================================
-- FIX: shop_photos RLS Policy Violation
-- ============================================================
-- Error: "new row violates row-level security policy"
-- This means the INSERT policy is blocking the upload
-- ============================================================

-- Step 1: Check current INSERT policy
SELECT 
  'Current INSERT Policy' AS check_type,
  policyname,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND cmd = 'INSERT'
  AND (qual LIKE '%shop_photos%' OR with_check LIKE '%shop_photos%' OR policyname LIKE '%shop_photos%');

-- Step 2: Drop existing INSERT policy if it's too restrictive
DO $$
BEGIN
  -- Drop the existing INSERT policy
  DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload shop photos" ON storage.objects;
  
  RAISE NOTICE '✅ Dropped existing INSERT policies';
END $$;

-- Step 3: Create new INSERT policy that allows authenticated users to upload
CREATE POLICY "Authenticated users can upload shop photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shop_photos'
    AND auth.role() = 'authenticated'
  );

-- Step 4: Verify policy was created
SELECT 
  'New INSERT Policy' AS check_type,
  policyname,
  cmd AS operation,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname = 'Authenticated users can upload shop photos';

-- ============================================================
-- ALTERNATIVE: More Permissive Policy (if above doesn't work)
-- ============================================================
-- If the above still blocks, try this more permissive policy:
--
-- DROP POLICY IF EXISTS "Authenticated users can upload shop photos" ON storage.objects;
-- CREATE POLICY "Authenticated users can upload shop photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'shop_photos');
--
-- This allows ANY authenticated user to upload (less secure but works)
-- ============================================================

