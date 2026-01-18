-- Migration: Create shop_photos table
-- Run this migration to enable photo management for shops

-- Create shop_photos table
CREATE TABLE IF NOT EXISTS shop_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('logo', 'cover', 'gallery')),
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS shop_photos_shop_id_idx ON shop_photos(shop_id);
CREATE INDEX IF NOT EXISTS shop_photos_type_idx ON shop_photos(type);
CREATE INDEX IF NOT EXISTS shop_photos_shop_id_type_idx ON shop_photos(shop_id, type);

-- Enable RLS
ALTER TABLE shop_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can read all photos
CREATE POLICY "Public can read shop photos"
    ON shop_photos
    FOR SELECT
    USING (true);

-- Authenticated users can insert photos for shops they own
CREATE POLICY "Owners can insert photos"
    ON shop_photos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM shops
            WHERE shops.id = shop_photos.shop_id
            AND shops.owner_user_id = auth.uid()
        )
    );

-- Owners can update their own shop photos
CREATE POLICY "Owners can update their photos"
    ON shop_photos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM shops
            WHERE shops.id = shop_photos.shop_id
            AND shops.owner_user_id = auth.uid()
        )
    );

-- Owners can delete their own shop photos
CREATE POLICY "Owners can delete their photos"
    ON shop_photos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM shops
            WHERE shops.id = shop_photos.shop_id
            AND shops.owner_user_id = auth.uid()
        )
    );

