-- Failsafe: Ensure no NULL channels, backfill and enforce DB-level default
UPDATE bookings SET channel = 'guest' WHERE channel IS NULL;
ALTER TABLE bookings ALTER COLUMN channel SET DEFAULT 'guest';

