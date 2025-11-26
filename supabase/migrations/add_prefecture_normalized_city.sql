-- Add prefecture and normalized_city columns to shops table
-- These columns will be populated by the backend automatically

-- Add prefecture column (nullable, will be populated by backend)
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS prefecture TEXT;

-- Add normalized_city column (nullable, will be populated by backend)
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS normalized_city TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shops_prefecture ON shops(prefecture);
CREATE INDEX IF NOT EXISTS idx_shops_normalized_city ON shops(normalized_city);

-- Add comment to columns
COMMENT ON COLUMN shops.prefecture IS 'Normalized prefecture key (e.g., "tokyo", "osaka") extracted from address';
COMMENT ON COLUMN shops.normalized_city IS 'Normalized city name extracted from address';

