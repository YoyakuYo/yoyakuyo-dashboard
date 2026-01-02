-- ============================================================
-- Fix: shop_photos INSERT RLS Policy
-- ============================================================
-- Error: "new row violates row-level security policy"
-- The INSERT policy is blocking authenticated user uploads
-- ============================================================

-- Step 1: Drop ALL existing INSERT policies for shop_photos (to avoid conflicts)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Find and drop all INSERT policies that reference shop_photos
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'INSERT'
      AND (
        qual LIKE '%shop_photos%' 
        OR with_check LIKE '%shop_photos%' 
        OR policyname LIKE '%shop_photos%'
        OR policyname LIKE '%upload%photos%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- Step 2: Create correct INSERT policy
-- This allows ANY authenticated user to upload to shop_photos bucket
-- IMPORTANT: WITH CHECK is used for INSERT operations
CREATE POLICY "Authenticated users can upload shop photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shop_photos'
    AND auth.role() = 'authenticated'
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
    AND policyname = 'Authenticated users can upload shop photos'
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
-- Run this to verify all shop_photos policies:
--
-- SELECT 
--   policyname,
--   cmd AS operation,
--   qual AS using_expression,
--   with_check AS with_check_expression
-- FROM pg_policies
-- WHERE schemaname = 'storage'
--   AND tablename = 'objects'
--   AND (qual LIKE '%shop_photos%' 
--        OR with_check LIKE '%shop_photos%' 
--        OR policyname LIKE '%shop_photos%')
-- ORDER BY cmd, policyname;
-- ============================================================

