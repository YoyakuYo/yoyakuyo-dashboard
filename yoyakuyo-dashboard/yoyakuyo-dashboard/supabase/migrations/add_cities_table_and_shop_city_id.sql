-- Migration: Add cities table and city_id to shops
-- This migration creates a dedicated table for cities and links shops to it.

-- Step 1: Create the cities table
CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    prefecture_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create a function to update the 'updated_at' column for cities table
CREATE OR REPLACE FUNCTION update_cities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 3: Create a trigger to automatically update 'updated_at' on city updates
DROP TRIGGER IF EXISTS update_cities_updated_at ON cities;
CREATE TRIGGER update_cities_updated_at
    BEFORE UPDATE ON cities
    FOR EACH ROW
    EXECUTE FUNCTION update_cities_updated_at();

-- Step 4: Add city_id to the shops table
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id) ON DELETE SET NULL;

-- Step 5: Create an index for faster lookups on shops.city_id
CREATE INDEX IF NOT EXISTS shops_city_id_idx ON shops(city_id);

-- Step 6: Add comments for documentation
COMMENT ON TABLE cities IS 'Stores unique city names in Japan with slugs and associated prefectures.';
COMMENT ON COLUMN cities.name IS 'The full name of the city.';
COMMENT ON COLUMN cities.slug IS 'A URL-friendly, unique identifier for the city (lowercase, snake_case).';
COMMENT ON COLUMN cities.prefecture_name IS 'The name of the prefecture the city belongs to.';
COMMENT ON COLUMN shops.city_id IS 'Foreign key reference to the cities table.';

