-- Refactor availability_windows to support slot-based availability
-- Add booking_id column and ensure proper slot-based structure

-- ============================================
-- PART 1: ADD BOOKING_ID COLUMN
-- ============================================

-- Add booking_id column to link slots to bookings
ALTER TABLE availability_windows
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Create index for booking_id lookups
CREATE INDEX IF NOT EXISTS idx_availability_windows_booking_id ON availability_windows(booking_id);

-- ============================================
-- PART 2: UPDATE COMMENTS AND DOCUMENTATION
-- ============================================

COMMENT ON TABLE availability_windows IS 'Slot-based availability system. Each row represents a single time slot. Multiple slots per date are supported.';
COMMENT ON COLUMN availability_windows.booking_id IS 'If status is "booked", this links to the booking that occupies this slot. NULL for available/blocked slots.';

-- ============================================
-- PART 3: UPDATE RLS POLICIES
-- ============================================

-- Ensure users can read available slots for booking
-- (Already exists, but ensure it's correct)
DROP POLICY IF EXISTS "authenticated_read_availability_windows" ON availability_windows;
CREATE POLICY "authenticated_read_availability_windows" ON availability_windows
    FOR SELECT TO authenticated, anon
    USING (status = 'available');

-- ============================================
-- PART 4: DATA MIGRATION (if needed)
-- ============================================

-- If there are any existing bookings, try to link them to availability windows
-- This is a best-effort migration - new bookings will properly link slots
DO $$
DECLARE
    booking_record RECORD;
    slot_record RECORD;
BEGIN
    -- For each booking, try to find matching availability window and link it
    -- Note: bookings table only has date and start_time (no end_time column)
    FOR booking_record IN 
        SELECT id, shop_id, date, start_time
        FROM bookings
        WHERE date IS NOT NULL
        AND start_time IS NOT NULL
    LOOP
        -- Try to find a matching availability window (slot) that is already marked as booked
        -- Match by shop_id, date, and start_time
        SELECT id INTO slot_record
        FROM availability_windows
        WHERE shop_id = booking_record.shop_id
        AND date = booking_record.date
        AND start_time::TIME = booking_record.start_time::TIME
        AND status = 'booked'
        AND booking_id IS NULL -- Only link slots that aren't already linked
        LIMIT 1;
        
        -- If found, link it
        IF FOUND THEN
            UPDATE availability_windows
            SET booking_id = booking_record.id
            WHERE id = slot_record.id;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- PART 5: REMOVE AUTO-GENERATION LOGIC
-- ============================================

-- Update generate_availability_from_weekly to create slots instead of full-day blocks
-- This function should now create individual slots, not full-day windows
CREATE OR REPLACE FUNCTION generate_availability_from_weekly(
    p_shop_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
    v_date DATE;
    v_weekday INTEGER;
BEGIN
    -- NOTE: This function is now DEPRECATED for slot-based system
    -- Owners should manually create slots instead of auto-generating full days
    -- This function is kept for backward compatibility but should not be used
    
    -- Clear existing available slots in the date range (keep booked/blocked)
    DELETE FROM availability_windows
    WHERE shop_id = p_shop_id
    AND date >= p_start_date
    AND date <= p_end_date
    AND source = 'owner'
    AND status = 'available'; -- Only clear available slots, keep booked/blocked

    -- Generate availability slots for each date in range
    v_date := p_start_date;
    WHILE v_date <= p_end_date LOOP
        v_weekday := EXTRACT(DOW FROM v_date)::INTEGER; -- 0=Sunday, 6=Saturday

        -- Check if we have weekly hours for this weekday
        -- Create a SINGLE slot for the entire day (not multiple slots)
        -- Owners should manually split this into smaller slots if needed
        INSERT INTO availability_windows (shop_id, date, start_time, end_time, status, source)
        SELECT
            p_shop_id,
            v_date,
            wh.open_time,
            wh.close_time,
            'available',
            'owner'
        FROM weekly_hours wh
        WHERE wh.shop_id = p_shop_id
        AND wh.weekday = v_weekday
        AND wh.is_closed = FALSE
        AND NOT EXISTS (
            -- Don't create if we already have availability for this exact time slot
            SELECT 1 FROM availability_windows aw
            WHERE aw.shop_id = p_shop_id
            AND aw.date = v_date
            AND aw.start_time = wh.open_time
            AND aw.end_time = wh.close_time
            AND aw.status IN ('available', 'booked')
        )
        ON CONFLICT DO NOTHING;

        GET DIAGNOSTICS v_count = ROW_COUNT;
        v_date := v_date + INTERVAL '1 day';
    END LOOP;

    RETURN v_count;
END;
$$;

-- ============================================
-- PART 6: UPDATE OVERLAP CHECK
-- ============================================

-- Update overlap check to allow multiple non-overlapping slots per day
-- This is already correct, but ensure it's clear
CREATE OR REPLACE FUNCTION check_availability_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Slot-based system: Multiple slots per day are allowed
    -- Only prevent overlaps between active slots (available/booked)
    -- Blocked slots can overlap anything (for manual blocking)

    IF NEW.status IN ('available', 'booked') THEN
        IF EXISTS (
            SELECT 1 FROM availability_windows aw
            WHERE aw.shop_id = NEW.shop_id
            AND aw.date = NEW.date
            AND aw.status IN ('available', 'booked')
            AND aw.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
            AND (
                -- NEW slot starts during existing slot
                (NEW.start_time >= aw.start_time AND NEW.start_time < aw.end_time) OR
                -- NEW slot ends during existing slot
                (NEW.end_time > aw.start_time AND NEW.end_time <= aw.end_time) OR
                -- NEW slot completely contains existing slot
                (NEW.start_time <= aw.start_time AND NEW.end_time >= aw.end_time) OR
                -- Existing slot completely contains NEW slot
                (aw.start_time <= NEW.start_time AND aw.end_time >= NEW.end_time)
            )
        ) THEN
            RAISE EXCEPTION 'Cannot create availability slot that overlaps with existing slot. Shop: %, Date: %, Time: %-%',
                NEW.shop_id, NEW.date, NEW.start_time, NEW.end_time;
        END IF;
    END IF;

    -- Blocked slots can overlap anything (for manual blocking/unavailability)

    RETURN NEW;
END;
$$;

