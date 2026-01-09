-- Create new availability windows system to replace static opening hours
-- This completely replaces the shops.opening_hours JSONB system

-- ============================================
-- PART 1: CREATE NEW TABLES
-- ============================================

-- Weekly template (OPTIONAL) - used to auto-generate future availability
CREATE TABLE IF NOT EXISTS weekly_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6), -- 0=Sunday, 6=Saturday
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(shop_id, weekday)
);

-- Availability windows (PRIMARY DATA) - actual bookable time slots per shop
CREATE TABLE IF NOT EXISTS availability_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('available', 'booked', 'blocked')),
    source TEXT NOT NULL CHECK (source IN ('booking', 'owner', 'admin', 'ai')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Note: Overlapping windows prevention is handled by application logic
    -- and the split_availability_on_booking function

    -- Ensure start_time < end_time
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- ============================================
-- PART 2: INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_weekly_hours_shop_id ON weekly_hours(shop_id);
CREATE INDEX IF NOT EXISTS idx_weekly_hours_weekday ON weekly_hours(weekday);

CREATE INDEX IF NOT EXISTS idx_availability_windows_shop_id ON availability_windows(shop_id);
CREATE INDEX IF NOT EXISTS idx_availability_windows_date ON availability_windows(date);
CREATE INDEX IF NOT EXISTS idx_availability_windows_status ON availability_windows(status);
CREATE INDEX IF NOT EXISTS idx_availability_windows_shop_date ON availability_windows(shop_id, date);

-- ============================================
-- PART 3: RLS POLICIES
-- ============================================

ALTER TABLE weekly_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_windows ENABLE ROW LEVEL SECURITY;

-- Service role can manage everything
CREATE POLICY "service_role_manage_weekly_hours" ON weekly_hours
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_manage_availability_windows" ON availability_windows
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Shop owners can manage their own weekly hours and availability
CREATE POLICY "owners_manage_weekly_hours" ON weekly_hours
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM shops
            WHERE shops.id = weekly_hours.shop_id
            AND shops.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "owners_manage_availability_windows" ON availability_windows
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM shops
            WHERE shops.id = availability_windows.shop_id
            AND shops.owner_user_id = auth.uid()
        )
    );

-- Authenticated users can read availability windows (for booking)
CREATE POLICY "authenticated_read_availability_windows" ON availability_windows
    FOR SELECT TO authenticated, anon
    USING (status = 'available');

-- ============================================
-- PART 4: FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to generate availability windows from weekly template
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
    -- First, clear existing manually created availability windows in the date range
    -- (Keep booked windows and blocked windows)
    DELETE FROM availability_windows
    WHERE shop_id = p_shop_id
    AND date >= p_start_date
    AND date <= p_end_date
    AND source = 'owner'
    AND status IN ('available'); -- Only clear available slots, keep booked/blocked

    -- Generate availability for each date in range
    v_date := p_start_date;
    WHILE v_date <= p_end_date LOOP
        v_weekday := EXTRACT(DOW FROM v_date)::INTEGER; -- 0=Sunday, 6=Saturday

        -- Check if we have weekly hours for this weekday
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
        );

        GET DIAGNOSTICS v_count = ROW_COUNT;
        v_date := v_date + INTERVAL '1 day';
    END LOOP;

    RETURN v_count;
END;
$$;

-- Function to check for overlapping availability windows
CREATE OR REPLACE FUNCTION check_availability_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the new/updated window overlaps with existing available/booked windows
    IF EXISTS (
        SELECT 1 FROM availability_windows
        WHERE shop_id = NEW.shop_id
        AND date = NEW.date
        AND status IN ('available', 'booked')
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND (
            (start_time <= NEW.start_time AND end_time > NEW.start_time) OR
            (start_time < NEW.end_time AND end_time >= NEW.end_time) OR
            (start_time >= NEW.start_time AND end_time <= NEW.end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Cannot create availability window that overlaps with existing windows. Please check existing availability for shop % on date %.',
            NEW.shop_id, NEW.date;
    END IF;

    RETURN NEW;
END;
$$;

-- Function to split availability window when partially booked
CREATE OR REPLACE FUNCTION split_availability_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_original_end TIME;
BEGIN
    -- Only process if this is a booking that affects availability
    IF NEW.status = 'booked' AND OLD.status = 'available' THEN
        v_original_end := OLD.end_time;

        -- Update the original window to end at booking start
        UPDATE availability_windows
        SET end_time = NEW.start_time,
            updated_at = NOW()
        WHERE id = OLD.id
        AND NEW.start_time > OLD.start_time;

        -- Create a new window from booking end to original end
        IF NEW.end_time < v_original_end THEN
            INSERT INTO availability_windows (
                shop_id, date, start_time, end_time, status, source
            ) VALUES (
                NEW.shop_id, NEW.date, NEW.end_time, v_original_end, 'available', 'booking'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger to check for overlaps before insert/update
DROP TRIGGER IF EXISTS trg_check_availability_overlap ON availability_windows;
CREATE TRIGGER trg_check_availability_overlap
    BEFORE INSERT OR UPDATE ON availability_windows
    FOR EACH ROW
    EXECUTE FUNCTION check_availability_overlap();

-- Trigger to split availability windows when booked
DROP TRIGGER IF EXISTS trg_split_availability_on_booking ON availability_windows;
CREATE TRIGGER trg_split_availability_on_booking
    AFTER UPDATE ON availability_windows
    FOR EACH ROW
    EXECUTE FUNCTION split_availability_on_booking();

-- ============================================
-- PART 5: MIGRATE EXISTING DATA (OPTIONAL)
-- ============================================

-- This section would migrate existing shops.opening_hours to weekly_hours
-- But since we're doing a complete replacement, we'll leave this for manual migration

-- ============================================
-- PART 6: CLEANUP (will be done separately)
-- ============================================

-- NOTE: We'll remove shops.opening_hours column in a separate migration
-- to ensure we don't break anything during the transition

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE weekly_hours IS 'Weekly availability templates for shops (optional, used to auto-generate future availability)';
COMMENT ON TABLE availability_windows IS 'Actual bookable time slots for each shop with minute-level precision';
COMMENT ON FUNCTION generate_availability_from_weekly IS 'Generates availability windows from weekly template for a date range';
COMMENT ON FUNCTION split_availability_on_booking IS 'Automatically splits availability windows when partially booked';
