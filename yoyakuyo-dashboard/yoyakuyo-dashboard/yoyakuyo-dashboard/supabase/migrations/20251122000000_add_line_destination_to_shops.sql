-- Migration: Add line_destination_id and line_qr_code_url to shops table
-- This allows each shop to have its own LINE destination ID and QR code

-- Add line_destination_id to shops table
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS line_destination_id TEXT;

-- Add line_qr_code_url to shops table (replaces line_qr_image_url)
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS line_qr_code_url TEXT;

-- Create index for line_destination_id lookups
CREATE INDEX IF NOT EXISTS shops_line_destination_id_idx ON shops(line_destination_id) WHERE line_destination_id IS NOT NULL;

-- Copy line_destination_id from line_shop_settings to shops if exists
UPDATE shops s
SET line_destination_id = lss.line_destination_id
FROM line_shop_settings lss
WHERE s.id = lss.shop_id
  AND s.line_destination_id IS NULL
  AND lss.line_destination_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN shops.line_destination_id IS 'LINE destination ID for this shop (used to generate QR code)';
COMMENT ON COLUMN shops.line_qr_code_url IS 'Public URL to the LINE QR code image for this shop';

