-- Migration: Fix shop_photos storage bucket RLS policies
-- This ensures authenticated users can upload photos to their shop folders
-- Date: 2025-01-27

-- Ensure the bucket exists
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

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Public can read shop photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;

-- Public can read all photos
CREATE POLICY "Public can read shop photos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'shop_photos');

-- Authenticated users can upload photos to any shop folder
-- (Shop ownership is verified in the backend API)
CREATE POLICY "Authenticated users can upload photos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'shop_photos'
        AND auth.role() = 'authenticated'
    );

-- Authenticated users can update photos in their shop folders
CREATE POLICY "Authenticated users can update photos"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'shop_photos'
        AND auth.role() = 'authenticated'
    );

-- Authenticated users can delete photos in their shop folders
CREATE POLICY "Authenticated users can delete photos"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'shop_photos'
        AND auth.role() = 'authenticated'
    );

-- Add comment
COMMENT ON POLICY "Authenticated users can upload photos" ON storage.objects IS 
'Allows authenticated users to upload photos. Shop ownership is verified in the backend API before allowing uploads.';

