-- Migration: Add performance indexes for shops table
-- These indexes improve query performance for pagination, filtering, and area tree building

-- Index for prefecture filtering
CREATE INDEX IF NOT EXISTS shops_prefecture_idx ON shops(prefecture);

-- Index for normalized_city filtering
CREATE INDEX IF NOT EXISTS shops_normalized_city_idx ON shops(normalized_city);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS shops_category_idx ON shops(category);

-- Index for subcategory filtering
CREATE INDEX IF NOT EXISTS shops_subcategory_idx ON shops(subcategory);

-- Index for address filtering and search
CREATE INDEX IF NOT EXISTS shops_address_idx ON shops(address);

-- Composite index for latitude/longitude (for geolocation queries)
CREATE INDEX IF NOT EXISTS shops_lat_lon_idx ON shops(latitude, longitude);

-- Index for category_id (used in category filtering)
CREATE INDEX IF NOT EXISTS shops_category_id_idx ON shops(category_id);

-- Index for claim_status (used to filter hidden shops)
CREATE INDEX IF NOT EXISTS shops_claim_status_idx ON shops(claim_status);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS shops_prefecture_city_idx ON shops(prefecture, normalized_city);

-- Index for owner filtering
CREATE INDEX IF NOT EXISTS shops_owner_user_id_idx ON shops(owner_user_id);

