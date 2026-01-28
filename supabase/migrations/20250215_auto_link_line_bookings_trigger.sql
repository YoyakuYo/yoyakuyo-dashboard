-- Migration: Auto-link LINE bookings via database trigger
-- Automatically creates line_bookings record when a booking is created for a LINE user
-- This ensures bookings are always linked to LINE users even if the API call fails

-- Add unique constraint to prevent duplicate line_bookings records
DO $$
BEGIN
  -- Check if unique constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'line_bookings_booking_id_line_user_id_unique'
  ) THEN
    -- Create unique constraint on (booking_id, line_user_id)
    ALTER TABLE line_bookings
    ADD CONSTRAINT line_bookings_booking_id_line_user_id_unique 
    UNIQUE (booking_id, line_user_id);
  END IF;
END $$;

-- Function to auto-create line_bookings record
-- Updated to use customer_id from customers table (not customer_profile_id)
-- Guests don't have profiles, so we use the unified customers table
CREATE OR REPLACE FUNCTION auto_create_line_booking()
RETURNS TRIGGER AS $$
DECLARE
  line_user_id_value TEXT;
BEGIN
  -- Check if the booking has a customer_id
  IF NEW.customer_id IS NOT NULL THEN
    -- Look up the customer in the customers table to get line_user_id
    -- Only LINE customers have line_user_id (guests and web customers have NULL)
    SELECT c.line_user_id INTO line_user_id_value
    FROM customers c
    WHERE c.id = NEW.customer_id
      AND c.line_user_id IS NOT NULL
      AND c.role = 'line';
    
    -- If LINE user ID found, create line_bookings record
    IF line_user_id_value IS NOT NULL THEN
      -- Check if line_bookings record already exists (avoid duplicates)
      IF NOT EXISTS (
        SELECT 1 FROM line_bookings 
        WHERE booking_id = NEW.id 
          AND line_user_id = line_user_id_value
      ) THEN
        BEGIN
          INSERT INTO line_bookings (booking_id, line_user_id)
          VALUES (NEW.id, line_user_id_value);
          
          RAISE NOTICE 'Auto-created line_bookings record for booking % and LINE user %', NEW.id, line_user_id_value;
        EXCEPTION WHEN unique_violation THEN
          -- Ignore if already exists (race condition)
          RAISE NOTICE 'line_bookings record already exists for booking % and LINE user %', NEW.id, line_user_id_value;
        END;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_create_line_booking ON bookings;

-- Create trigger
CREATE TRIGGER trigger_auto_create_line_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_line_booking();

-- Comment
COMMENT ON FUNCTION auto_create_line_booking() IS 'Automatically creates line_bookings record when a booking is created for a LINE user';

