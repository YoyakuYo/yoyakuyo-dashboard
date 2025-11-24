-- Migration: Create public.users table
-- This table stores owner user information linked to Supabase Auth users

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint on email to prevent duplicates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_unique'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT users_email_unique UNIQUE (email);
    END IF;
END $$;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to make migration idempotent)
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;

-- Policy: Allow users to read their own record
CREATE POLICY "Users can read own record"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Allow users to insert their own record
-- This allows authenticated users to insert their own record
-- (API uses service role which bypasses RLS, but this is a safety net)
CREATE POLICY "Users can insert own record"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Allow users to update their own record
CREATE POLICY "Users can update own record"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

