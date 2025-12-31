-- ============================================================
-- FIX: Create shop_photos Storage Bucket
-- ============================================================
-- Error: "Bucket not found" when uploading shop photos
-- Bucket name used in code: shop_photos
-- ============================================================

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
WHERE id = 'shop_photos';

-- Step 2: Create bucket if it doesn't exist
-- NOTE: This requires service role permissions
-- If this fails, create the bucket manually in Supabase Dashboard

DO $$
BEGIN
  -- Check if bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'shop_photos'
  ) THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'shop_photos',
      'shop_photos',
      true, -- Public bucket (photos need to be publicly accessible)
      10485760, -- 10 MB file size limit
      ARRAY[
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp'
      ]::text[]
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Created shop_photos storage bucket';
  ELSE
    RAISE NOTICE 'ℹ️ shop_photos bucket already exists';
  END IF;
END $$;

-- Step 3: Verify bucket was created
SELECT 
  'Verification' AS check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'shop_photos';

-- ============================================================
-- STORAGE POLICIES SETUP (REQUIRED)
-- ============================================================
-- After creating the bucket, set up storage policies in Supabase Dashboard:
--
-- 1. Go to Storage → Policies
-- 2. Select the "shop_photos" bucket
-- 3. Create these policies:
--
-- Policy 1: "Public can read shop photos"
--   - Operation: SELECT
--   - Target roles: public
--   - USING expression: bucket_id = 'shop_photos'
--
-- Policy 2: "Authenticated users can upload shop photos"
--   - Operation: INSERT
--   - Target roles: authenticated
--   - WITH CHECK expression: bucket_id = 'shop_photos' AND auth.role() = 'authenticated'
--
-- Policy 3: "Authenticated users can update shop photos"
--   - Operation: UPDATE
--   - Target roles: authenticated
--   - USING expression: bucket_id = 'shop_photos' AND auth.role() = 'authenticated'
--
-- Policy 4: "Authenticated users can delete shop photos"
--   - Operation: DELETE
--   - Target roles: authenticated
--   - USING expression: bucket_id = 'shop_photos' AND auth.role() = 'authenticated'
--
-- ============================================================
-- ALTERNATIVE: Create policies via SQL (requires service role)
-- ============================================================
-- Run these in Supabase SQL Editor (with service role):
--
-- CREATE POLICY "Public can read shop photos"
--     ON storage.objects FOR SELECT
--     USING (bucket_id = 'shop_photos');
--
-- CREATE POLICY "Authenticated users can upload shop photos"
--     ON storage.objects FOR INSERT
--     WITH CHECK (bucket_id = 'shop_photos' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "Authenticated users can update shop photos"
--     ON storage.objects FOR UPDATE
--     USING (bucket_id = 'shop_photos' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "Authenticated users can delete shop photos"
--     ON storage.objects FOR DELETE
--     USING (bucket_id = 'shop_photos' AND auth.role() = 'authenticated');
--
-- ============================================================

