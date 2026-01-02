-- ============================================
-- Migration: Add customer_profile_id column to bookings table
-- ============================================
-- This column links bookings to customer_profiles (for web customers)
-- This is crucial for tracking bookings by authenticated web users
-- ============================================

-- STEP 1: Add customer_profile_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'customer_profile_id'
    ) THEN
        ALTER TABLE bookings
        ADD COLUMN customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added customer_profile_id column to bookings table';
    ELSE
        RAISE NOTICE 'customer_profile_id column already exists in bookings table';
    END IF;
END $$;

-- STEP 2: Create index for customer_profile_id (if it doesn't exist)
CREATE INDEX IF NOT EXISTS bookings_customer_profile_id_idx 
ON bookings(customer_profile_id) 
WHERE customer_profile_id IS NOT NULL;

-- STEP 3: Add comment
COMMENT ON COLUMN bookings.customer_profile_id IS 'Customer profile ID from customer_profiles table for web customer bookings. NULL for guest bookings or LINE bookings.';

-- STEP 4: Ensure user_id column exists (from previous migration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE bookings
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS bookings_user_id_idx 
        ON bookings(user_id) 
        WHERE user_id IS NOT NULL;
        
        RAISE NOTICE 'Added user_id column to bookings table';
    ELSE
        RAISE NOTICE 'user_id column already exists in bookings table';
    END IF;
END $$;

