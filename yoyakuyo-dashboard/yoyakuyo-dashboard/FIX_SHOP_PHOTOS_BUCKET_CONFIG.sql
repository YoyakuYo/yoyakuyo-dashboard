-- ============================================================
-- FIX: Update shop_photos Bucket Configuration
-- ============================================================
-- Bucket exists but file_size_limit and allowed_mime_types are NULL
-- This SQL updates the bucket configuration
-- ============================================================

-- Step 1: Update bucket configuration
UPDATE storage.buckets
SET 
  file_size_limit = 10485760, -- 10 MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ]::text[]
WHERE id = 'shop_photos';

-- Step 2: Verify update
SELECT 
  'Updated Bucket' AS check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'shop_photos';

-- ============================================================
-- CHECK STORAGE POLICIES
-- ============================================================
-- Verify that storage policies exist for shop_photos bucket
-- ============================================================

SELECT 
  'Storage Policies' AS check_type,
  policyname,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (qual LIKE '%shop_photos%' OR with_check LIKE '%shop_photos%')
ORDER BY policyname;

-- ============================================================
-- CREATE STORAGE POLICIES (if missing)
-- ============================================================
-- Run these if policies don't exist
-- ============================================================

-- Policy 1: Public can read shop photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public can read shop photos'
  ) THEN
    CREATE POLICY "Public can read shop photos"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'shop_photos');
    
    RAISE NOTICE '✅ Created policy: Public can read shop photos';
  ELSE
    RAISE NOTICE 'ℹ️ Policy already exists: Public can read shop photos';
  END IF;
END $$;

-- Policy 2: Authenticated users can upload shop photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Authenticated users can upload shop photos'
  ) THEN
    CREATE POLICY "Authenticated users can upload shop photos"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'shop_photos' AND auth.role() = 'authenticated');
    
    RAISE NOTICE '✅ Created policy: Authenticated users can upload shop photos';
  ELSE
    RAISE NOTICE 'ℹ️ Policy already exists: Authenticated users can upload shop photos';
  END IF;
END $$;

-- Policy 3: Authenticated users can update shop photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Authenticated users can update shop photos'
  ) THEN
    CREATE POLICY "Authenticated users can update shop photos"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'shop_photos' AND auth.role() = 'authenticated');
    
    RAISE NOTICE '✅ Created policy: Authenticated users can update shop photos';
  ELSE
    RAISE NOTICE 'ℹ️ Policy already exists: Authenticated users can update shop photos';
  END IF;
END $$;

-- Policy 4: Authenticated users can delete shop photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Authenticated users can delete shop photos'
  ) THEN
    CREATE POLICY "Authenticated users can delete shop photos"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'shop_photos' AND auth.role() = 'authenticated');
    
    RAISE NOTICE '✅ Created policy: Authenticated users can delete shop photos';
  ELSE
    RAISE NOTICE 'ℹ️ Policy already exists: Authenticated users can delete shop photos';
  END IF;
END $$;

-- ============================================================
-- FINAL VERIFICATION
-- ============================================================
-- Check bucket and policies are correctly configured
-- ============================================================

-- Bucket configuration
SELECT 
  'Bucket Config' AS check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'shop_photos';

-- Storage policies
SELECT 
  'Policies' AS check_type,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (qual LIKE '%shop_photos%' OR with_check LIKE '%shop_photos%')
ORDER BY policyname;

