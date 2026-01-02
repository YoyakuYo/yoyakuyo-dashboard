-- Migration: Add user_id column to bookings table
-- This column links bookings to the customer's user account (for web customers)

-- Add user_id column if it doesn't exist
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
    
    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings(user_id) WHERE user_id IS NOT NULL;
    
    RAISE NOTICE 'Added user_id column to bookings table';
  ELSE
    RAISE NOTICE 'user_id column already exists in bookings table';
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN bookings.user_id IS 'User ID from auth.users for web customer bookings. NULL for guest bookings.';

