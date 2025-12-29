-- Normalize bookings table identity columns
ALTER TABLE IF EXISTS bookings
    ADD COLUMN IF NOT EXISTS auth_user_id UUID NULL,
    ADD COLUMN IF NOT EXISTS line_user_id TEXT NULL,
    ADD COLUMN IF NOT EXISTS guest_name TEXT NULL,
    ADD COLUMN IF NOT EXISTS guest_email TEXT NULL;

-- Remove possibly older/erroneous versions
ALTER TABLE IF EXISTS bookings DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE IF EXISTS bookings DROP COLUMN IF EXISTS customer_id CASCADE;
-- Optionally drop legacy columns, or keep as needed

