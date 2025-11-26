-- Migration: Add website_url column to shops table
-- This migration adds the website_url field for Google Places API enrichment
-- IMPORTANT: This migration is idempotent and safe to run multiple times

ALTER TABLE shops ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN shops.website_url IS 'Website URL from Google Places API enrichment (TEXT type for flexibility)';

