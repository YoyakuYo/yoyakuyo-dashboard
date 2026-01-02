-- Migration: Add indexes for fast category and location-based shop queries
-- Optimizes the public shop list page with 100,000+ shops

-- Index on category_id for fast category filtering
CREATE INDEX IF NOT EXISTS shops_category_id_idx ON shops(category_id) WHERE category_id IS NOT NULL;

-- Index on claim_status for filtering visible shops
CREATE INDEX IF NOT EXISTS shops_claim_status_idx ON shops(claim_status) WHERE claim_status IS NULL OR claim_status != 'hidden';

-- Composite index for category + claim_status (most common query pattern)
CREATE INDEX IF NOT EXISTS shops_category_claim_idx ON shops(category_id, claim_status) 
  WHERE (claim_status IS NULL OR claim_status != 'hidden');

-- Index on address for location extraction (using GIN for text search if needed)
-- Note: Address parsing is done client-side, but this helps with search queries
CREATE INDEX IF NOT EXISTS shops_address_idx ON shops USING gin(to_tsvector('english', address)) 
  WHERE address IS NOT NULL;

-- Index on name for search queries
CREATE INDEX IF NOT EXISTS shops_name_idx ON shops USING gin(to_tsvector('english', name)) 
  WHERE name IS NOT NULL;

-- Add comment
COMMENT ON INDEX shops_category_id_idx IS 'Fast category filtering for public shop list';
COMMENT ON INDEX shops_claim_status_idx IS 'Fast filtering of visible (non-hidden) shops';
COMMENT ON INDEX shops_category_claim_idx IS 'Composite index for category + visibility filtering';

