-- Migration: Ensure guest/line fields in bookings and correct nullability
-- Adds/updates columns to match critical guest/line booking requirements

ALTER TABLE IF EXISTS bookings
ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'guest';

ALTER TABLE IF EXISTS bookings
ADD COLUMN IF NOT EXISTS line_user_id UUID NULL;
ALTER TABLE IF EXISTS bookings
ALTER COLUMN line_user_id DROP NOT NULL;

ALTER TABLE IF EXISTS bookings
ADD COLUMN IF NOT EXISTS user_id UUID NULL;
ALTER TABLE IF EXISTS bookings
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE IF EXISTS bookings
ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE IF EXISTS bookings
ADD COLUMN IF NOT EXISTS guest_email TEXT;

COMMENT ON COLUMN bookings.channel IS 'Origin of booking: guest | line | web';
COMMENT ON COLUMN bookings.guest_name IS 'Full name of guest for guest bookings (required)';
COMMENT ON COLUMN bookings.guest_email IS 'Contact email of guest for guest bookings (required)';
COMMENT ON COLUMN bookings.line_user_id IS 'LINE user id for LINE channel bookings, nullable';
COMMENT ON COLUMN bookings.user_id IS 'App user id for web bookings, nullable';

