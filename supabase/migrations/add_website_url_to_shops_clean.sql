ALTER TABLE shops ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN shops.website_url IS 'Website URL from Google Places API enrichment (TEXT type for flexibility)';

