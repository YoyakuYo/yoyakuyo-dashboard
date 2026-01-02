-- ============================================================
-- CREATE shop_photos STORAGE BUCKET
-- ============================================================
-- This creates the bucket for storing shop photos (logo, cover, gallery)
-- Bucket name: shop_photos (must match code exactly)
-- ============================================================

-- Step 1: Check if bucket already exists
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
    );
    
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
  allowed_mime_types
FROM storage.buckets
WHERE id = 'shop_photos';

-- ============================================================
-- STORAGE POLICIES SETUP
-- ============================================================
-- After creating the bucket, set up storage policies in Supabase Dashboard:
--
-- 1. Go to Storage → Policies
-- 2. Select the "shop_photos" bucket
-- 3. Create these policies:
--
-- Policy 1: "Public can read shop photos"
--   - Operation: SELECT
--   - USING expression: bucket_id = 'shop_photos'
--
-- Policy 2: "Authenticated users can upload shop photos"
--   - Operation: INSERT
--   - WITH CHECK expression: bucket_id = 'shop_photos' AND auth.role() = 'authenticated'
--
-- Policy 3: "Shop owners can update their photos"
--   - Operation: UPDATE
--   - USING expression: bucket_id = 'shop_photos' AND auth.role() = 'authenticated'
--
-- Policy 4: "Shop owners can delete their photos"
--   - Operation: DELETE
--   - USING expression: bucket_id = 'shop_photos' AND auth.role() = 'authenticated'
--
-- ============================================================

