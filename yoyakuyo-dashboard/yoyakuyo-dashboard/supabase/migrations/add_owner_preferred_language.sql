-- Migration: Add preferred_language to users table and created_by_ai to bookings table

-- Add preferred_language column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS users_preferred_language_idx ON public.users(preferred_language);

-- Update existing users to have default language
UPDATE public.users
SET preferred_language = 'en'
WHERE preferred_language IS NULL;

-- Add created_by_ai column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS created_by_ai BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS bookings_created_by_ai_idx ON bookings(created_by_ai) WHERE created_by_ai = TRUE;

