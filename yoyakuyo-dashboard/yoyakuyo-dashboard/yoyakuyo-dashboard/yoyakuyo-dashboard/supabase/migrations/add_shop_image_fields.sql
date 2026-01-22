-- Migration: Add image URL fields to shops table
-- Run this migration to enable shop logo and cover photo uploads

-- Add new columns to shops table
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;

-- Add index for faster lookups (optional, but helpful if you query by these fields)
CREATE INDEX IF NOT EXISTS shops_logo_url_idx ON shops(logo_url) WHERE logo_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS shops_cover_photo_url_idx ON shops(cover_photo_url) WHERE cover_photo_url IS NOT NULL;

