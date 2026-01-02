-- Migration: Add Google Places API fields to shops table
-- Run this migration before using the Tokyo importer

-- Add new columns to shops table
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS opening_hours JSONB,
ADD COLUMN IF NOT EXISTS website VARCHAR(500);

-- Create unique index on google_place_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS shops_google_place_id_unique ON shops(google_place_id) WHERE google_place_id IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS shops_google_place_id_idx ON shops(google_place_id);

