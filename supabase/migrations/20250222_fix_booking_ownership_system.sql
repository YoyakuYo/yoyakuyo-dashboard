-- Migration: Fix Booking Ownership System
-- This migration implements the canonical booking ownership model with three distinct types:
-- 1. LINE users (LIFF)
-- 2. Registered web users
-- 3. Guests (no account, no LINE)
--
-- CRITICAL: This migration enforces strict ownership rules via DB constraints

-- ============================================
-- STEP 1: Create booking_type enum
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_type_enum') THEN
        CREATE TYPE booking_type_enum AS ENUM ('line', 'user', 'guest');
        RAISE NOTICE 'Created booking_type_enum';
    ELSE
        RAISE NOTICE 'booking_type_enum already exists';
    END IF;
END $$;

-- ============================================
-- STEP 2: Create guests table
-- ============================================
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for guests
CREATE INDEX IF NOT EXISTS guests_email_idx ON guests(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS guests_phone_idx ON guests(phone) WHERE phone IS NOT NULL;

-- Enable RLS
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guests (service role only - guests don't authenticate)
DROP POLICY IF EXISTS "Service role can manage guests" ON guests;
CREATE POLICY "Service role can manage guests"
ON guests
FOR ALL
USING (true)
WITH CHECK (true);

COMMENT ON TABLE guests IS 'Guest bookings - users who book without account or LINE';

-- ============================================
-- STEP 3: Add new columns to bookings table
-- ============================================

-- Add booking_type column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'booking_type'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN booking_type booking_type_enum;
        
        RAISE NOTICE 'Added booking_type column to bookings';
    ELSE
        RAISE NOTICE 'booking_type column already exists';
    END IF;
END $$;

-- Add guest_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'guest_id'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN guest_id UUID REFERENCES guests(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS bookings_guest_id_idx ON bookings(guest_id) WHERE guest_id IS NOT NULL;
        
        RAISE NOTICE 'Added guest_id column to bookings';
    ELSE
        RAISE NOTICE 'guest_id column already exists';
    END IF;
END $$;

-- Add line_user_id directly to bookings (for direct querying)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'line_user_id'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN line_user_id TEXT;
        
        CREATE INDEX IF NOT EXISTS bookings_line_user_id_idx ON bookings(line_user_id) WHERE line_user_id IS NOT NULL;
        
        RAISE NOTICE 'Added line_user_id column to bookings';
    ELSE
        RAISE NOTICE 'line_user_id column already exists';
    END IF;
END $$;

-- ============================================
-- STEP 4: Make user_id nullable (for guest bookings)
-- ============================================
DO $$
BEGIN
    -- Check if user_id is currently NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'user_id'
        AND is_nullable = 'NO'
    ) THEN
        -- Drop NOT NULL constraint
        ALTER TABLE bookings 
        ALTER COLUMN user_id DROP NOT NULL;
        
        RAISE NOTICE 'Made user_id nullable for guest bookings';
    ELSE
        RAISE NOTICE 'user_id is already nullable';
    END IF;
END $$;

-- ============================================
-- STEP 5: Add DB constraints to enforce ownership rules
-- ============================================

-- Drop existing check constraints if they exist
DO $$
BEGIN
    -- Drop old user_id NOT NULL constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'bookings_user_id_not_null'
        AND conrelid = 'public.bookings'::regclass
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_user_id_not_null;
        RAISE NOTICE 'Dropped old bookings_user_id_not_null constraint';
    END IF;
END $$;

-- Constraint 1: booking_type='line' → line_user_id NOT NULL, user_id NOT NULL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'bookings_line_type_constraint'
        AND conrelid = 'public.bookings'::regclass
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_line_type_constraint
        CHECK (
            (booking_type != 'line') OR 
            (booking_type = 'line' AND line_user_id IS NOT NULL AND user_id IS NOT NULL)
        );
        
        RAISE NOTICE 'Added bookings_line_type_constraint';
    END IF;
END $$;

-- Constraint 2: booking_type='user' → user_id NOT NULL, line_user_id IS NULL, guest_id IS NULL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'bookings_user_type_constraint'
        AND conrelid = 'public.bookings'::regclass
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_user_type_constraint
        CHECK (
            (booking_type != 'user') OR 
            (booking_type = 'user' AND user_id IS NOT NULL AND line_user_id IS NULL AND guest_id IS NULL)
        );
        
        RAISE NOTICE 'Added bookings_user_type_constraint';
    END IF;
END $$;

-- Constraint 3: booking_type='guest' → guest_id NOT NULL, user_id IS NULL, line_user_id IS NULL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'bookings_guest_type_constraint'
        AND conrelid = 'public.bookings'::regclass
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_guest_type_constraint
        CHECK (
            (booking_type != 'guest') OR 
            (booking_type = 'guest' AND guest_id IS NOT NULL AND user_id IS NULL AND line_user_id IS NULL)
        );
        
        RAISE NOTICE 'Added bookings_guest_type_constraint';
    END IF;
END $$;

-- Constraint 4: booking_type must be set (NOT NULL)
-- NOTE: This is done AFTER data migration (Step 6) to ensure all rows are classified first

-- ============================================
-- STEP 6: Data Migration - Classify existing bookings
-- ============================================
-- CRITICAL: This must happen BEFORE making booking_type NOT NULL

DO $$
DECLARE
    booking_record RECORD;
    line_booking_count INTEGER := 0;
    user_booking_count INTEGER := 0;
    guest_booking_count INTEGER := 0;
    guest_record_id UUID;
BEGIN
    RAISE NOTICE 'Starting data migration to classify existing bookings...';
    
    -- Step 6.1: Classify LINE bookings (have line_bookings record)
    UPDATE bookings b
    SET 
        booking_type = 'line',
        line_user_id = lb.line_user_id,
        user_id = COALESCE(
            b.user_id,
            (SELECT ui.user_id FROM user_identities ui 
             WHERE ui.provider = 'line' AND ui.provider_user_id = lb.line_user_id LIMIT 1)
        )
    FROM line_bookings lb
    WHERE b.id = lb.booking_id
      AND (b.booking_type IS NULL OR b.booking_type = 'user'); -- Only update if not already set
    
    GET DIAGNOSTICS line_booking_count = ROW_COUNT;
    RAISE NOTICE 'Classified % bookings as LINE bookings', line_booking_count;
    
    -- Step 6.2: For LINE bookings without user_id, create/get user via user_identities
    FOR booking_record IN
        SELECT b.id, b.line_user_id
        FROM bookings b
        WHERE b.booking_type = 'line'
          AND b.user_id IS NULL
          AND b.line_user_id IS NOT NULL
    LOOP
        -- Get or create user via RPC function
        DECLARE
            resolved_user_id UUID;
        BEGIN
            SELECT get_or_create_user_from_line_sub(booking_record.line_user_id) INTO resolved_user_id;
            
            UPDATE bookings
            SET user_id = resolved_user_id
            WHERE id = booking_record.id;
            
            RAISE NOTICE 'Resolved user_id % for LINE booking %', resolved_user_id, booking_record.id;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to resolve user_id for LINE booking %: %', booking_record.id, SQLERRM;
        END;
    END LOOP;
    
    -- Step 6.3: Classify web user bookings (have user_id, no line_bookings record)
    UPDATE bookings b
    SET booking_type = 'user'
    WHERE b.booking_type IS NULL
      AND b.user_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM line_bookings lb WHERE lb.booking_id = b.id
      );
    
    GET DIAGNOSTICS user_booking_count = ROW_COUNT;
    RAISE NOTICE 'Classified % bookings as web user bookings', user_booking_count;
    
    -- Step 6.4: Classify guest bookings (no user_id, no line_bookings, have customer_name/email)
    FOR booking_record IN
        SELECT id, customer_name, customer_email, customer_phone, created_at
        FROM bookings
        WHERE booking_type IS NULL
          AND user_id IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM line_bookings lb WHERE lb.booking_id = bookings.id
          )
          AND (customer_name IS NOT NULL OR customer_email IS NOT NULL)
    LOOP
        -- Create guest record
        INSERT INTO guests (full_name, email, phone, created_at)
        VALUES (
            COALESCE(booking_record.customer_name, 'Guest'),
            booking_record.customer_email,
            booking_record.customer_phone,
            COALESCE(booking_record.created_at, NOW())
        )
        RETURNING id INTO guest_record_id;
        
        -- Update booking
        UPDATE bookings
        SET 
            booking_type = 'guest',
            guest_id = guest_record_id
        WHERE id = booking_record.id;
        
        guest_booking_count := guest_booking_count + 1;
        RAISE NOTICE 'Created guest record % for booking %', guest_record_id, booking_record.id;
    END LOOP;
    
    RAISE NOTICE 'Classified % bookings as guest bookings', guest_booking_count;
    
    -- Step 6.5: Handle orphaned bookings (no clear ownership)
    DECLARE
        orphaned_count INTEGER := 0;
        remaining_null_count INTEGER := 0;
    BEGIN
        -- First pass: Try to classify remaining bookings
        SELECT COUNT(*) INTO orphaned_count
        FROM bookings
        WHERE booking_type IS NULL;
        
        IF orphaned_count > 0 THEN
            RAISE NOTICE 'Found % bookings with unclear ownership - classifying as guest type', orphaned_count;
            
            -- Create guest records for orphaned bookings
            FOR booking_record IN
                SELECT id, customer_name, customer_email, customer_phone, created_at
                FROM bookings
                WHERE booking_type IS NULL
            LOOP
                BEGIN
                    INSERT INTO guests (full_name, email, phone, created_at)
                    VALUES (
                        COALESCE(booking_record.customer_name, 'Orphaned Guest'),
                        COALESCE(booking_record.customer_email, 'orphaned_' || REPLACE(booking_record.id::TEXT, '-', '') || '@yoyakuyo.com'),
                        booking_record.customer_phone,
                        COALESCE(booking_record.created_at, NOW())
                    )
                    RETURNING id INTO guest_record_id;
                    
                    UPDATE bookings
                    SET 
                        booking_type = 'guest',
                        guest_id = guest_record_id
                    WHERE id = booking_record.id;
                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING 'Failed to create guest for booking %: %', booking_record.id, SQLERRM;
                END;
            END LOOP;
        END IF;
        
        -- Final check: Ensure ALL bookings have a booking_type
        SELECT COUNT(*) INTO remaining_null_count
        FROM bookings
        WHERE booking_type IS NULL;
        
        IF remaining_null_count > 0 THEN
            -- Last resort: Set default booking_type for any remaining NULLs
            RAISE WARNING 'Setting default booking_type for % remaining bookings', remaining_null_count;
            
            UPDATE bookings
            SET booking_type = 'user'
            WHERE booking_type IS NULL
              AND user_id IS NOT NULL;
            
            UPDATE bookings
            SET booking_type = 'guest'
            WHERE booking_type IS NULL;
            
            -- Final verification
            SELECT COUNT(*) INTO remaining_null_count
            FROM bookings
            WHERE booking_type IS NULL;
            
            IF remaining_null_count > 0 THEN
                RAISE EXCEPTION 'CRITICAL: % bookings still have NULL booking_type after migration. Cannot proceed.', remaining_null_count;
            END IF;
        END IF;
    END;
    
    RAISE NOTICE 'Data migration completed successfully - all bookings classified';
END $$;

-- ============================================
-- STEP 6.5: NOW make booking_type NOT NULL (after all rows are classified)
-- ============================================
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    -- Check if there are any NULL booking_type values
    SELECT COUNT(*) INTO null_count
    FROM bookings
    WHERE booking_type IS NULL;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Cannot make booking_type NOT NULL: % bookings still have NULL booking_type. Data migration failed.', null_count;
    END IF;
    
    -- Set default for future inserts
    ALTER TABLE bookings 
    ALTER COLUMN booking_type SET DEFAULT 'user';
    
    -- Make it NOT NULL
    ALTER TABLE bookings 
    ALTER COLUMN booking_type SET NOT NULL;
    
    RAISE NOTICE 'Made booking_type NOT NULL (all existing rows classified)';
END $$;

-- ============================================
-- STEP 7: Update shop_notifications trigger to work with all booking types
-- ============================================
-- The existing trigger should already work, but verify it exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_create_shop_notification'
    ) THEN
        -- Recreate trigger if it doesn't exist
        CREATE TRIGGER trigger_create_shop_notification
        AFTER INSERT ON bookings
        FOR EACH ROW
        EXECUTE FUNCTION create_shop_notification_on_booking();
        
        RAISE NOTICE 'Created shop_notification trigger';
    ELSE
        RAISE NOTICE 'shop_notification trigger already exists';
    END IF;
END $$;

-- ============================================
-- STEP 8: Add comments for documentation
-- ============================================
COMMENT ON COLUMN bookings.booking_type IS 'Type of booking: line (LIFF), user (web authenticated), guest (no account)';
COMMENT ON COLUMN bookings.user_id IS 'User ID for LINE and web user bookings. NULL for guest bookings.';
COMMENT ON COLUMN bookings.guest_id IS 'Guest ID for guest bookings. NULL for LINE and web user bookings.';
COMMENT ON COLUMN bookings.line_user_id IS 'LINE user sub (from ID token) for LINE bookings. NULL for web user and guest bookings.';

-- ============================================
-- STEP 9: Create helper function to get booking owner info
-- ============================================
CREATE OR REPLACE FUNCTION get_booking_owner_info(booking_uuid UUID)
RETURNS TABLE (
    booking_type booking_type_enum,
    user_id UUID,
    guest_id UUID,
    line_user_id TEXT,
    owner_name TEXT,
    owner_email TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.booking_type,
        b.user_id,
        b.guest_id,
        b.line_user_id,
        CASE 
            WHEN b.booking_type = 'guest' THEN g.full_name
            WHEN b.booking_type = 'line' THEN cp.line_display_name
            WHEN b.booking_type = 'user' THEN u.name
            ELSE NULL
        END as owner_name,
        CASE 
            WHEN b.booking_type = 'guest' THEN g.email
            WHEN b.booking_type = 'line' THEN cp.email
            WHEN b.booking_type = 'user' THEN u.email
            ELSE NULL
        END as owner_email
    FROM bookings b
    LEFT JOIN guests g ON b.guest_id = g.id
    LEFT JOIN public.users u ON b.user_id = u.id
    LEFT JOIN user_identities ui ON b.line_user_id = ui.provider_user_id AND ui.provider = 'line'
    LEFT JOIN customer_profiles cp ON ui.user_id = cp.customer_auth_id OR b.user_id = cp.customer_auth_id
    WHERE b.id = booking_uuid;
END;
$$;

COMMENT ON FUNCTION get_booking_owner_info IS 'Returns owner information for a booking based on booking_type';

