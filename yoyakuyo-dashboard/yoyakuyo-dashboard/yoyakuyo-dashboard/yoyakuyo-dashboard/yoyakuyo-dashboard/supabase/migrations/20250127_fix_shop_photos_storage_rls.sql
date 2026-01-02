-- Migration: Create shop_photos storage bucket
-- This creates the bucket for storing shop photos
-- Date: 2025-01-27
--
-- NOTE: Storage policies must be created manually through the Supabase Dashboard
-- due to permission requirements. See instructions below.

-- Create the storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'shop_photos',
    'shop_photos',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ============================================================================
-- MANUAL SETUP REQUIRED: Storage Policies
-- ============================================================================
-- Due to permission restrictions, storage policies must be created manually
-- through the Supabase Dashboard. Follow these steps:
--
-- 1. Go to Supabase Dashboard → Storage → Policies
-- 2. Select the "shop_photos" bucket
-- 3. Click "New Policy" and create the following policies:
--
-- Policy 1: "Public can read shop photos"
--   - Policy type: SELECT
--   - Target roles: public
--   - USING expression: bucket_id = 'shop_photos'
--
-- Policy 2: "Authenticated users can upload photos"
--   - Policy type: INSERT
--   - Target roles: authenticated
--   - WITH CHECK expression: bucket_id = 'shop_photos' AND auth.role() = 'authenticated'
--
-- Policy 3: "Authenticated users can update photos"
--   - Policy type: UPDATE
--   - Target roles: authenticated
--   - USING expression: bucket_id = 'shop_photos' AND auth.role() = 'authenticated'
--
-- Policy 4: "Authenticated users can delete photos"
--   - Policy type: DELETE
--   - Target roles: authenticated
--   - USING expression: bucket_id = 'shop_photos' AND auth.role() = 'authenticated'
--
-- Alternatively, you can run the SQL policies directly in the Supabase Dashboard
-- SQL Editor (which has elevated permissions):
--
-- CREATE POLICY "Public can read shop photos"
--     ON storage.objects FOR SELECT
--     USING (bucket_id = 'shop_photos');
--
-- CREATE POLICY "Authenticated users can upload photos"
--     ON storage.objects FOR INSERT
--     WITH CHECK (bucket_id = 'shop_photos' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "Authenticated users can update photos"
--     ON storage.objects FOR UPDATE
--     USING (bucket_id = 'shop_photos' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "Authenticated users can delete photos"
--     ON storage.objects FOR DELETE
--     USING (bucket_id = 'shop_photos' AND auth.role() = 'authenticated');
-- ============================================================================

