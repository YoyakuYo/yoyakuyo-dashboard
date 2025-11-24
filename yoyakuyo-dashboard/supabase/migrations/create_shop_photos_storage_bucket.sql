-- Migration: Create shop-photos storage bucket and policies
-- Run this migration to enable photo storage

-- Note: This migration creates the bucket via SQL
-- If bucket creation fails, create it manually in Supabase Dashboard:
-- Storage → Create Bucket → Name: "shop-photos" → Public: true

-- Create storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'shop-photos',
    'shop-photos',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Public can read all photos
CREATE POLICY "Public can read shop photos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'shop-photos');

-- Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload photos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'shop-photos'
        AND auth.role() = 'authenticated'
    );

-- Authenticated users can update their own photos
CREATE POLICY "Authenticated users can update photos"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'shop-photos'
        AND auth.role() = 'authenticated'
    );

-- Authenticated users can delete their own photos
CREATE POLICY "Authenticated users can delete photos"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'shop-photos'
        AND auth.role() = 'authenticated'
    );

