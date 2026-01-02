-- Migration: Create legacy messages table
-- This table is referenced in messages.ts but appears to be legacy
-- Consider migrating to shop_messages in the future

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    sender_type TEXT NOT NULL,
    message TEXT NOT NULL,
    language_code TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS messages_shop_id_idx ON messages(shop_id);
CREATE INDEX IF NOT EXISTS messages_booking_id_idx ON messages(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Shop owners can view messages for their shops
CREATE POLICY "Shop owners can view their shop messages (legacy)"
    ON messages
    FOR SELECT
    USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_user_id = auth.uid()
        )
    );

-- Add comment
COMMENT ON TABLE messages IS 'Legacy messages table - consider migrating to shop_messages';

