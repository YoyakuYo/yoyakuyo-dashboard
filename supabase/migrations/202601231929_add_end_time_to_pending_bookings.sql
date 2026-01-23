-- ============================================
-- ADD END_TIME COLUMN TO PENDING_BOOKINGS
-- ============================================
-- Fix for booking creation error: "Could not find the 'end_time' column of 'pending_bookings'"

ALTER TABLE pending_bookings
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Add comment to document the column
COMMENT ON COLUMN pending_bookings.end_time IS 'End time of the booking (calculated from service duration)';

-- ============================================