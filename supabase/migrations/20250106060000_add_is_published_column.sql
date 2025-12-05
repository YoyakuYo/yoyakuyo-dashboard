-- ============================================================================
-- ADD is_published COLUMN TO SHOPS TABLE
-- ============================================================================
-- This migration adds the is_published column to control shop visibility
-- Shops are not published until verified and approved
-- ============================================================================

-- Add is_published column if it doesn't exist
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- Set is_published to true for shops that are verified and approved
UPDATE shops
SET is_published = TRUE
WHERE is_verified = TRUE 
AND verification_status = 'approved'
AND is_published IS NULL;

-- Create index for published shops queries
CREATE INDEX IF NOT EXISTS idx_shops_is_published ON shops(is_published) WHERE is_published = TRUE;

-- Add comment
COMMENT ON COLUMN shops.is_published IS 'Whether the shop is published and visible to the public (requires verification approval)';

