-- Add columns required by admin soft-delete (DELETE /admin/shops/:id)
-- Safe: IF NOT EXISTS so already-present columns are skipped.

ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN shops.is_deleted IS 'Soft delete flag for admin';
COMMENT ON COLUMN shops.is_hidden IS 'Hide from public listing';
COMMENT ON COLUMN shops.deleted_at IS 'When the shop was soft-deleted';
