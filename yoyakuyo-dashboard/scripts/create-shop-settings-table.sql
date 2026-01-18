-- Create shop_settings table manually if migration system is not working
-- This script creates the shop_settings table with closed_days column

CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
  -- Working hours (stored as JSONB for flexibility)
  -- Format: {"monday": {"open": "09:00", "close": "18:00"}, ...}
  working_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "18:00"},
    "tuesday": {"open": "09:00", "close": "18:00"},
    "wednesday": {"open": "09:00", "close": "18:00"},
    "thursday": {"open": "09:00", "close": "18:00"},
    "friday": {"open": "09:00", "close": "18:00"},
    "saturday": {"open": "09:00", "close": "18:00"},
    "sunday": {"open": null, "close": null}
  }'::jsonb,
  -- Closed days (array of day names and dates)
  closed_days TEXT[] DEFAULT ARRAY['sunday'],
  -- Buffer time between bookings (in minutes)
  buffer_time_minutes INTEGER DEFAULT 15,
  -- Auto-confirm bookings
  auto_confirm_bookings BOOLEAN DEFAULT FALSE,
  -- AI configuration
  ai_enabled BOOLEAN DEFAULT TRUE,
  ai_auto_reply BOOLEAN DEFAULT FALSE,
  -- Notification preferences
  notify_new_booking BOOLEAN DEFAULT TRUE,
  notify_booking_cancellation BOOLEAN DEFAULT TRUE,
  notify_new_message BOOLEAN DEFAULT TRUE,
  -- Calendar settings
  calendar_sync_enabled BOOLEAN DEFAULT FALSE,
  calendar_provider TEXT, -- 'google', 'outlook', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_id ON shop_settings(shop_id);

-- Enable RLS
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies (with IF NOT EXISTS)
DROP POLICY IF EXISTS "Owners can view their shop settings" ON shop_settings;
DROP POLICY IF EXISTS "Owners can update their shop settings" ON shop_settings;

CREATE POLICY "Owners can view their shop settings"
  ON shop_settings FOR SELECT
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Owners can update their shop settings"
  ON shop_settings FOR UPDATE
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
  );

-- Create default shop settings for existing shops that don't have them
INSERT INTO shop_settings (shop_id)
SELECT id FROM shops
WHERE id NOT IN (SELECT shop_id FROM shop_settings)
ON CONFLICT (shop_id) DO NOTHING;
