-- Fix overlap detection to better handle slot updates and provide clearer errors

-- ============================================
-- IMPROVED OVERLAP CHECK FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION check_availability_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conflicting_slot RECORD;
BEGIN
    -- Slot-based system: Multiple slots per day are allowed
    -- Only prevent overlaps between active slots (available/booked)
    -- Blocked slots can overlap anything (for manual blocking/unavailability)

    -- If creating/updating a blocked slot, allow it regardless of overlaps
    IF NEW.status = 'blocked' THEN
        RETURN NEW;
    END IF;

    -- Only check overlaps for available/booked slots
    IF NEW.status IN ('available', 'booked') THEN
        -- Check for overlapping slots
        SELECT aw.* INTO conflicting_slot
        FROM availability_windows aw
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
        LIMIT 1;

        IF FOUND THEN
            -- Provide detailed error message with conflicting slot info
            RAISE EXCEPTION 'Cannot create availability slot that overlaps with existing slot. Shop: %, Date: %, New slot: %-%, Conflicting slot: %-% (ID: %, Status: %)',
                NEW.shop_id,
                NEW.date,
                NEW.start_time,
                NEW.end_time,
                conflicting_slot.start_time,
                conflicting_slot.end_time,
                conflicting_slot.id,
                conflicting_slot.status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

