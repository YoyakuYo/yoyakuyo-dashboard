-- Add OSM ID column to track OpenStreetMap place IDs
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS osm_id TEXT;

-- Create index for faster duplicate checks
CREATE INDEX IF NOT EXISTS shops_osm_id_idx ON shops(osm_id) WHERE osm_id IS NOT NULL;

