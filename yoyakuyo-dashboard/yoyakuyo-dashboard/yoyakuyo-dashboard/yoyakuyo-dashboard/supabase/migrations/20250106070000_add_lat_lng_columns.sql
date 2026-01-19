-- ============================================================================
-- ADD lat/lng COLUMNS TO SHOPS TABLE
-- ============================================================================
-- This migration adds latitude and longitude columns for shop geolocation
-- ============================================================================

-- Add lat/lng columns if they don't exist (for geolocation)
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS lng NUMERIC(11, 8);

-- Create indexes for location queries
CREATE INDEX IF NOT EXISTS idx_shops_lat ON shops(lat) WHERE lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shops_lng ON shops(lng) WHERE lng IS NOT NULL;

-- Add comments
COMMENT ON COLUMN shops.lat IS 'Latitude coordinate for shop location';
COMMENT ON COLUMN shops.lng IS 'Longitude coordinate for shop location';

