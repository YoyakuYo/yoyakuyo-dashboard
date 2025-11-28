-- Migration: Add fields required for automatic booking functionality
-- This migration adds missing fields to bookings and shops tables

-- PART A: Add missing fields to bookings table
-- Check and add created_at if missing
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Check and add updated_at if missing
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add customer_name if missing
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add date field if missing (DATE type for YYYY-MM-DD format)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS date DATE;

-- Add time_slot field if missing (TEXT for HH:MM format)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS time_slot TEXT;

-- Ensure status exists with correct enum values
-- Status already exists from add_bookings_status.sql, but ensure it has all required values
-- The constraint already includes: 'pending', 'confirmed', 'rejected', 'cancelled', 'completed'

-- PART B: Add timezone field to shops table if missing
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Tokyo';

-- Add comment for documentation
COMMENT ON COLUMN shops.timezone IS 'Timezone for the shop (default: Asia/Tokyo). Used for booking time validation.';

-- PART C: Create trigger function for updated_at on bookings
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on bookings
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_bookings_updated_at();

-- Backfill created_at for existing bookings that don't have it
UPDATE bookings
SET created_at = NOW()
WHERE created_at IS NULL;

-- Backfill updated_at for existing bookings that don't have it
UPDATE bookings
SET updated_at = NOW()
WHERE updated_at IS NULL;

-- Backfill timezone for existing shops that don't have it
UPDATE shops
SET timezone = 'Asia/Tokyo'
WHERE timezone IS NULL;

