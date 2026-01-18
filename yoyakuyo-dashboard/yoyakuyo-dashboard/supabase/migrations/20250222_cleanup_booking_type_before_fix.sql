-- Cleanup script: Run this BEFORE running the main fix migration
-- This handles the case where the migration was partially run and booking_type column exists but has NULLs

-- ============================================
-- Step 1: Check if booking_type column exists and has NULLs
-- ============================================
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    -- Check if booking_type column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'booking_type'
    ) THEN
        -- Count NULL values
        SELECT COUNT(*) INTO null_count
        FROM bookings
        WHERE booking_type IS NULL;
        
        IF null_count > 0 THEN
            RAISE NOTICE 'Found % bookings with NULL booking_type - setting temporary defaults', null_count;
            
            -- Set temporary defaults based on existing data
            -- LINE bookings (have line_bookings record)
            UPDATE bookings b
            SET booking_type = 'line'
            FROM line_bookings lb
            WHERE b.id = lb.booking_id
              AND b.booking_type IS NULL;
            
            -- Web user bookings (have user_id, no line_bookings)
            UPDATE bookings b
            SET booking_type = 'user'
            WHERE b.booking_type IS NULL
              AND b.user_id IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM line_bookings lb WHERE lb.booking_id = b.id
              );
            
            -- Guest bookings (no user_id, no line_bookings)
            UPDATE bookings b
            SET booking_type = 'guest'
            WHERE b.booking_type IS NULL
              AND b.user_id IS NULL
              AND NOT EXISTS (
                  SELECT 1 FROM line_bookings lb WHERE lb.booking_id = b.id
              );
            
            -- Final check
            SELECT COUNT(*) INTO null_count
            FROM bookings
            WHERE booking_type IS NULL;
            
            IF null_count > 0 THEN
                RAISE WARNING 'Still have % bookings with NULL booking_type after cleanup', null_count;
            ELSE
                RAISE NOTICE 'All bookings now have booking_type set';
            END IF;
        ELSE
            RAISE NOTICE 'All bookings already have booking_type set';
        END IF;
    ELSE
        RAISE NOTICE 'booking_type column does not exist yet - main migration will create it';
    END IF;
END $$;

-- ============================================
-- Step 2: If booking_type is NOT NULL but shouldn't be, make it nullable temporarily
-- ============================================
DO $$
BEGIN
    -- Check if booking_type is NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'booking_type'
        AND is_nullable = 'NO'
    ) THEN
        -- Check if there are any NULLs (shouldn't be, but just in case)
        DECLARE
            null_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO null_count
            FROM bookings
            WHERE booking_type IS NULL;
            
            IF null_count > 0 THEN
                -- Make it nullable temporarily
                ALTER TABLE bookings 
                ALTER COLUMN booking_type DROP NOT NULL;
                
                RAISE NOTICE 'Made booking_type nullable temporarily to allow data migration';
            ELSE
                RAISE NOTICE 'booking_type is NOT NULL and all rows have values - no cleanup needed';
            END IF;
        END;
    END IF;
END $$;

COMMENT ON TABLE bookings IS 'Run this cleanup script BEFORE running 20250222_fix_booking_ownership_system.sql if the migration was partially run';

