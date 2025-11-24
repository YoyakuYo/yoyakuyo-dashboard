-- Migration: Fix shops table schema to match all code expectations
-- This migration adds all missing columns that are referenced in the codebase

-- Add missing location fields
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS city VARCHAR(255),
ADD COLUMN IF NOT EXISTS country VARCHAR(255),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);

-- Add description field (used in API and frontend)
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add language_code field (used in frontend)
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS language_code VARCHAR(10);

-- Add created_at and updated_at timestamps (used in API select statements)
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for new fields for better query performance
CREATE INDEX IF NOT EXISTS shops_city_idx ON shops(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS shops_country_idx ON shops(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS shops_zip_code_idx ON shops(zip_code) WHERE zip_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS shops_language_code_idx ON shops(language_code) WHERE language_code IS NOT NULL;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on shop updates
DROP TRIGGER IF EXISTS update_shops_updated_at ON shops;
CREATE TRIGGER update_shops_updated_at
    BEFORE UPDATE ON shops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Backfill created_at for existing rows that don't have it
UPDATE shops
SET created_at = NOW()
WHERE created_at IS NULL;

-- Backfill updated_at for existing rows that don't have it
UPDATE shops
SET updated_at = NOW()
WHERE updated_at IS NULL;

