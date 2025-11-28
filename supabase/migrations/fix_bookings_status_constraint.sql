-- Migration: Fix bookings status constraint to ensure all valid statuses are allowed
-- This migration ensures the status column accepts all valid booking statuses
-- Safe to run multiple times (idempotent)

-- Drop the existing check constraint if it exists (handles both naming variations)
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_status_check1;

-- Add the new check constraint with all status values
ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed'));

-- Verify the constraint was created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'bookings_status_check' 
        AND conrelid = 'bookings'::regclass
    ) THEN
        RAISE EXCEPTION 'Failed to create bookings_status_check constraint';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN bookings.status IS 'Booking status: pending, confirmed, rejected, cancelled, or completed';

