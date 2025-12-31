-- Migration: Add thread_type, source fields, and LINE QR code support
-- Part A: Conversation visibility and roles
-- Part B: Per-shop premium LINE QR codes

-- ============================================================================
-- A) CONVERSATION VISIBILITY & ROLES
-- ============================================================================

-- Add thread_type to shop_threads
ALTER TABLE shop_threads
ADD COLUMN IF NOT EXISTS thread_type TEXT NOT NULL DEFAULT 'customer' CHECK (thread_type IN ('owner', 'customer'));

-- Add source to shop_messages
ALTER TABLE shop_messages
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('dashboard', 'public', 'line'));

-- Add anonymous_session_id to shop_threads for public visitors
ALTER TABLE shop_threads
ADD COLUMN IF NOT EXISTS anonymous_session_id TEXT;

-- Create indexes for thread_type filtering
CREATE INDEX IF NOT EXISTS shop_threads_thread_type_idx ON shop_threads(thread_type);
CREATE INDEX IF NOT EXISTS shop_threads_shop_type_idx ON shop_threads(shop_id, thread_type);
CREATE INDEX IF NOT EXISTS shop_threads_anonymous_session_idx ON shop_threads(anonymous_session_id) WHERE anonymous_session_id IS NOT NULL;

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS shop_messages_source_idx ON shop_messages(source);

-- Update existing threads to have thread_type (default to 'customer' for existing)
UPDATE shop_threads
SET thread_type = 'customer'
WHERE thread_type IS NULL;

-- ============================================================================
-- B) PER-SHOP PREMIUM LINE QR CODES
-- ============================================================================

-- Add LINE QR code fields to shops table
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS line_qr_image_url TEXT,
ADD COLUMN IF NOT EXISTS line_deeplink_url TEXT;

-- Create index for LINE QR lookups
CREATE INDEX IF NOT EXISTS shops_line_deeplink_idx ON shops(line_deeplink_url) WHERE line_deeplink_url IS NOT NULL;

-- Add comments
COMMENT ON COLUMN shop_threads.thread_type IS 'Type of thread: owner (internal AI assistant) or customer (public/LINE chat)';
COMMENT ON COLUMN shop_threads.anonymous_session_id IS 'Session ID for anonymous public visitors to identify their thread';
COMMENT ON COLUMN shop_messages.source IS 'Source of message: dashboard (owner), public (shop page), or line (LINE app)';
COMMENT ON COLUMN shops.line_qr_image_url IS 'Public URL to the LINE QR code image for this shop';
COMMENT ON COLUMN shops.line_deeplink_url IS 'LINE deep link URL that encodes shop_id for QR code';

