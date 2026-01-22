-- ============================================
-- FIX BOOKING DATE VALIDATION
-- ============================================
-- Ensures bookings always have valid date and start_time
-- Prevents "Invalid Date" errors in frontend

-- Ensure date is NOT NULL (should already be, but enforce it)
DO $$
BEGIN
    -- Check if date column exists and is nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'date'
        AND is_nullable = 'YES'
    ) THEN
        -- Set default for any NULL dates (use today as fallback)
        UPDATE bookings
        SET date = COALESCE(date, CURRENT_DATE)
        WHERE date IS NULL;
        
        -- Make NOT NULL
        ALTER TABLE bookings
        ALTER COLUMN date SET NOT NULL;
        
        RAISE NOTICE 'Enforced bookings.date NOT NULL constraint';
    END IF;
    
    -- Check if start_time column exists and is nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'start_time'
        AND is_nullable = 'YES'
    ) THEN
        -- Set default for any NULL start_times (use 09:00 as fallback)
        UPDATE bookings
        SET start_time = COALESCE(start_time, '09:00:00'::TIME)
        WHERE start_time IS NULL;
        
        -- Make NOT NULL
        ALTER TABLE bookings
        ALTER COLUMN start_time SET NOT NULL;
        
        RAISE NOTICE 'Enforced bookings.start_time NOT NULL constraint';
    END IF;
END $$;

-- Add check constraint to ensure date is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'bookings_date_valid'
        AND conrelid = 'public.bookings'::regclass
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_date_valid
        CHECK (date IS NOT NULL AND date >= '2000-01-01'::DATE);
        
        RAISE NOTICE 'Added bookings_date_valid constraint';
    END IF;
END $$;

-- Add check constraint to ensure start_time is valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'bookings_start_time_valid'
        AND conrelid = 'public.bookings'::regclass
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_start_time_valid
        CHECK (start_time IS NOT NULL);
        
        RAISE NOTICE 'Added bookings_start_time_valid constraint';
    END IF;
END $$;

COMMENT ON COLUMN bookings.date IS 'Booking date (DATE type). Always use this with start_time to construct datetime.';
COMMENT ON COLUMN bookings.start_time IS 'Booking start time (TIME type, format HH:MM:SS). Combine with date to get full datetime.';

