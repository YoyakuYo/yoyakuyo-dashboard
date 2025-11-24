-- Migration: Add status column to bookings table
-- Run this migration to enable booking status management (pending, confirmed, rejected)

-- Add status column to bookings table if it doesn't exist
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected'));

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);

-- Set default status for existing bookings that don't have one
UPDATE bookings
SET status = 'pending'
WHERE status IS NULL;

