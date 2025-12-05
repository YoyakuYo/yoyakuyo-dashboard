-- ============================================================================
-- ADD is_published AND is_visible COLUMNS TO SHOPS TABLE
-- ============================================================================
-- This migration adds the is_published and is_visible columns to control shop visibility
-- Shops are not published until verified and approved
-- ============================================================================

-- Add is_visible column if it doesn't exist
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

-- Add is_published column if it doesn't exist
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- Set is_visible to true for existing shops (default visibility)
UPDATE shops
SET is_visible = TRUE
WHERE is_visible IS NULL;

-- Set is_published to true for shops that are verified and approved
UPDATE shops
SET is_published = TRUE
WHERE is_verified = TRUE 
AND verification_status = 'approved'
AND is_published IS NULL;

-- Create indexes for visibility queries
CREATE INDEX IF NOT EXISTS idx_shops_is_visible ON shops(is_visible) WHERE is_visible = TRUE;
CREATE INDEX IF NOT EXISTS idx_shops_is_published ON shops(is_published) WHERE is_published = TRUE;

-- Add comments
COMMENT ON COLUMN shops.is_visible IS 'Whether the shop is visible in listings (can be hidden by owner or staff)';
COMMENT ON COLUMN shops.is_published IS 'Whether the shop is published and visible to the public (requires verification approval)';

