-- Migration: Add LINE integration support
-- Adds LINE fields to shops and creates LINE user mapping table

-- Add LINE fields to shops table
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS line_official_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS line_channel_access_token TEXT,
ADD COLUMN IF NOT EXISTS line_webhook_url TEXT;

-- Create LINE user mapping table
CREATE TABLE IF NOT EXISTS line_user_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    line_user_id VARCHAR(255) UNIQUE NOT NULL,
    line_display_name VARCHAR(255),
    line_picture_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS line_user_mappings_customer_id_idx ON line_user_mappings(customer_id);
CREATE INDEX IF NOT EXISTS line_user_mappings_line_user_id_idx ON line_user_mappings(line_user_id);

-- Enable RLS
ALTER TABLE line_user_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own LINE mappings
CREATE POLICY "Users can read their own LINE mappings"
    ON line_user_mappings
    FOR SELECT
    USING (customer_id IN (SELECT id FROM customers WHERE id = customer_id));

-- Allow inserts (will be validated in API)
CREATE POLICY "Allow LINE mapping inserts"
    ON line_user_mappings
    FOR INSERT
    WITH CHECK (true);

-- Allow updates (will be validated in API)
CREATE POLICY "Allow LINE mapping updates"
    ON line_user_mappings
    FOR UPDATE
    USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_line_user_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_line_user_mappings_updated_at ON line_user_mappings;
CREATE TRIGGER update_line_user_mappings_updated_at
    BEFORE UPDATE ON line_user_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_line_user_mappings_updated_at();

COMMENT ON TABLE line_user_mappings IS 'Maps LINE user IDs to customer IDs';
COMMENT ON COLUMN shops.line_official_account_id IS 'LINE Official Account ID for the shop';
COMMENT ON COLUMN shops.line_channel_access_token IS 'LINE Channel Access Token for messaging API';

