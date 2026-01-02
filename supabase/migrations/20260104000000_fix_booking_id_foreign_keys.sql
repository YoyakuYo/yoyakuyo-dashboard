-- Migration: Fix booking_id foreign key relationships for PostgREST
-- This ensures PostgREST can properly detect relationships between reviews/conversations and bookings
-- PostgREST requires explicit named foreign key constraints to auto-detect relationships

-- ============================================
-- FIX REVIEWS TABLE booking_id FOREIGN KEY
-- ============================================

-- Check if the foreign key constraint already exists with a name
DO $$
BEGIN
    -- Drop existing unnamed constraint if it exists (inline REFERENCES)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'reviews'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'booking_id'
            AND tc.constraint_name NOT LIKE 'reviews_booking_id%'
    ) THEN
        -- Find and drop the unnamed constraint
        EXECUTE (
            SELECT 'ALTER TABLE reviews DROP CONSTRAINT ' || constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'reviews'
                AND constraint_type = 'FOREIGN KEY'
                AND constraint_name IN (
                    SELECT constraint_name
                    FROM information_schema.key_column_usage
                    WHERE table_name = 'reviews'
                        AND column_name = 'booking_id'
                )
                AND constraint_name NOT LIKE 'reviews_booking_id%'
            LIMIT 1
        );
    END IF;

    -- Add explicit named foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'reviews'
            AND constraint_name = 'reviews_booking_id_fkey'
            AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE reviews
        ADD CONSTRAINT reviews_booking_id_fkey
        FOREIGN KEY (booking_id) 
        REFERENCES bookings(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Added reviews_booking_id_fkey foreign key constraint';
    ELSE
        RAISE NOTICE 'reviews_booking_id_fkey foreign key constraint already exists';
    END IF;
END $$;

-- ============================================
-- FIX CONVERSATIONS TABLE booking_id FOREIGN KEY
-- ============================================

-- Check if the foreign key constraint already exists with a name
DO $$
BEGIN
    -- Drop existing unnamed constraint if it exists (inline REFERENCES)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'conversations'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'booking_id'
            AND tc.constraint_name NOT LIKE 'conversations_booking_id%'
    ) THEN
        -- Find and drop the unnamed constraint
        EXECUTE (
            SELECT 'ALTER TABLE conversations DROP CONSTRAINT ' || constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'conversations'
                AND constraint_type = 'FOREIGN KEY'
                AND constraint_name IN (
                    SELECT constraint_name
                    FROM information_schema.key_column_usage
                    WHERE table_name = 'conversations'
                        AND column_name = 'booking_id'
                )
                AND constraint_name NOT LIKE 'conversations_booking_id%'
            LIMIT 1
        );
    END IF;

    -- Add explicit named foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'conversations'
            AND constraint_name = 'conversations_booking_id_fkey'
            AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- First ensure booking_id column exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'booking_id'
        ) THEN
            ALTER TABLE conversations
            ADD CONSTRAINT conversations_booking_id_fkey
            FOREIGN KEY (booking_id) 
            REFERENCES bookings(id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'Added conversations_booking_id_fkey foreign key constraint';
        ELSE
            RAISE NOTICE 'conversations.booking_id column does not exist, skipping foreign key';
        END IF;
    ELSE
        RAISE NOTICE 'conversations_booking_id_fkey foreign key constraint already exists';
    END IF;
END $$;

-- ============================================
-- VERIFY CONSTRAINTS
-- ============================================

-- Verify the constraints were created
DO $$
DECLARE
    reviews_fk_exists BOOLEAN;
    conversations_fk_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'reviews'
            AND constraint_name = 'reviews_booking_id_fkey'
            AND constraint_type = 'FOREIGN KEY'
    ) INTO reviews_fk_exists;

    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'conversations'
            AND constraint_name = 'conversations_booking_id_fkey'
            AND constraint_type = 'FOREIGN KEY'
    ) INTO conversations_fk_exists;

    IF reviews_fk_exists THEN
        RAISE NOTICE '✓ reviews.booking_id foreign key constraint verified';
    ELSE
        RAISE WARNING '✗ reviews.booking_id foreign key constraint NOT found';
    END IF;

    IF conversations_fk_exists THEN
        RAISE NOTICE '✓ conversations.booking_id foreign key constraint verified';
    ELSE
        RAISE WARNING '✗ conversations.booking_id foreign key constraint NOT found (column may not exist)';
    END IF;
END $$;

COMMENT ON CONSTRAINT reviews_booking_id_fkey ON reviews IS 'Foreign key relationship to bookings table for PostgREST auto-detection';
COMMENT ON CONSTRAINT conversations_booking_id_fkey ON conversations IS 'Foreign key relationship to bookings table for PostgREST auto-detection';

