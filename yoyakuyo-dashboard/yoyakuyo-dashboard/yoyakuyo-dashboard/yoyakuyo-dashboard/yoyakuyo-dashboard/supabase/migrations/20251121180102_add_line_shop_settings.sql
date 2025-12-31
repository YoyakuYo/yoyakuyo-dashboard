-- Migration: Add LINE shop settings table for multi-tenant LINE webhook
-- Each LINE Official Account maps to one shop via line_destination_id

CREATE TABLE IF NOT EXISTS line_shop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  line_destination_id text NOT NULL UNIQUE,
  line_channel_secret text NULL,
  line_access_token text NULL,
  welcome_message_template text NOT NULL DEFAULT 'Hello, welcome to {{shop_name}}! How can I help you today?',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_line_shop_settings_destination
  ON line_shop_settings(line_destination_id);

CREATE INDEX IF NOT EXISTS idx_line_shop_settings_shop_id
  ON line_shop_settings(shop_id);

-- Enable RLS
ALTER TABLE line_shop_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Shop owners can view their own LINE settings
CREATE POLICY "Shop owners can view their own LINE settings"
  ON line_shop_settings
  FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_user_id = auth.uid()
    )
  );

-- Shop owners can insert their own LINE settings
CREATE POLICY "Shop owners can insert their own LINE settings"
  ON line_shop_settings
  FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE owner_user_id = auth.uid()
    )
  );

-- Shop owners can update their own LINE settings
CREATE POLICY "Shop owners can update their own LINE settings"
  ON line_shop_settings
  FOR UPDATE
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_line_shop_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_line_shop_settings_updated_at ON line_shop_settings;
CREATE TRIGGER update_line_shop_settings_updated_at
  BEFORE UPDATE ON line_shop_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_line_shop_settings_updated_at();

-- Add line_user_id to shop_threads for LINE conversation isolation
ALTER TABLE shop_threads
ADD COLUMN IF NOT EXISTS line_user_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_shop_threads_line_user_id
  ON shop_threads(shop_id, line_user_id)
  WHERE line_user_id IS NOT NULL;

COMMENT ON COLUMN shop_threads.line_user_id IS 'LINE user ID for isolating conversations per shop + LINE user';

