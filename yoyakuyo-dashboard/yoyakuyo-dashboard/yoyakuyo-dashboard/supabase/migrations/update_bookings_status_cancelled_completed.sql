-- Migration: Update bookings status to include 'cancelled' and 'completed'
-- This migration extends the status column to support cancelled and completed bookings

-- Drop the existing check constraint if it exists
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add the new check constraint with all status values
ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed'));

