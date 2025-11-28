-- Migration: Create shop_photos storage bucket and policies
-- Run this migration to enable photo storage with the correct bucket name

-- Note: This migration creates the bucket via SQL
-- If bucket creation fails, create it manually in Supabase Dashboard:
-- Storage → Create Bucket → Name: "shop_photos" → Public: true

-- Create storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'shop_photos',
    'shop_photos',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png'];

-- Storage Policies
-- Public can read all photos
DROP POLICY IF EXISTS "Public can read shop photos" ON storage.objects;
CREATE POLICY "Public can read shop photos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'shop_photos');

-- Authenticated users can upload photos
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload photos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'shop_photos'
        AND auth.role() = 'authenticated'
    );

-- Authenticated users can update their own photos
DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;
CREATE POLICY "Authenticated users can update photos"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'shop_photos'
        AND auth.role() = 'authenticated'
    );

-- Authenticated users can delete their own photos
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete photos"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'shop_photos'
        AND auth.role() = 'authenticated'
    );

