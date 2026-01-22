-- Migration: Create canonical user identity system
-- This migration creates user_identities table to map LINE users to canonical users.id
-- Ensures bookings created in LIFF appear in user dashboard

-- ============================================
-- 1. Ensure users table exists and has proper structure
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint on email if it doesn't exist
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

-- Create index on email
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email) WHERE email IS NOT NULL;

-- ============================================
-- 2. Create user_identities table for provider mappings
-- ============================================
CREATE TABLE IF NOT EXISTS user_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('line')),
    provider_user_id TEXT NOT NULL, -- LINE 'sub' from ID token
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_identities_user_id_idx ON user_identities(user_id);
CREATE INDEX IF NOT EXISTS user_identities_provider_idx ON user_identities(provider, provider_user_id);

-- Enable RLS
ALTER TABLE user_identities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_identities
DROP POLICY IF EXISTS "Users can read own identities" ON user_identities;
DROP POLICY IF EXISTS "Service role can manage identities" ON user_identities;

CREATE POLICY "Users can read own identities"
ON user_identities
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = user_identities.user_id
        AND (users.id = auth.uid() OR EXISTS (
            SELECT 1 FROM customer_profiles
            WHERE customer_profiles.id = auth.uid()
            AND customer_profiles.id = users.id
        ))
    )
);

CREATE POLICY "Service role can manage identities"
ON user_identities
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 3. Add user_id column to bookings table if it doesn't exist
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings(user_id) WHERE user_id IS NOT NULL;
    END IF;
END $$;

-- ============================================
-- 4. Create function to get or create user from LINE identity
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_user_from_line_sub(line_sub TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    canonical_user_id UUID;
    existing_identity_id UUID;
BEGIN
    -- Check if identity already exists
    SELECT user_id INTO canonical_user_id
    FROM user_identities
    WHERE provider = 'line' AND provider_user_id = line_sub
    LIMIT 1;
    
    -- If found, return existing user_id
    IF canonical_user_id IS NOT NULL THEN
        RETURN canonical_user_id;
    END IF;
    
    -- Create new user
    INSERT INTO public.users (id, created_at)
    VALUES (gen_random_uuid(), NOW())
    RETURNING id INTO canonical_user_id;
    
    -- Create identity mapping
    INSERT INTO user_identities (user_id, provider, provider_user_id)
    VALUES (canonical_user_id, 'line', line_sub)
    ON CONFLICT (provider, provider_user_id) DO NOTHING
    RETURNING user_id INTO existing_identity_id;
    
    -- If conflict occurred, get the existing user_id
    IF existing_identity_id IS NULL THEN
        SELECT user_id INTO canonical_user_id
        FROM user_identities
        WHERE provider = 'line' AND provider_user_id = line_sub;
    END IF;
    
    RETURN canonical_user_id;
END;
$$;

COMMENT ON TABLE user_identities IS 'Maps provider identities (LINE, etc.) to canonical users.id';
COMMENT ON FUNCTION get_or_create_user_from_line_sub IS 'Gets or creates canonical user_id from LINE sub (ID token)';

