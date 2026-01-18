-- Migration: Fix users table RLS policies and add unique email constraint
-- This migration adds the missing INSERT policy and unique email constraint
-- to fix the login/signup issue where users can't properly authenticate

-- ============================================================================
-- 1. ADD UNIQUE CONSTRAINT ON EMAIL
-- ============================================================================
-- Prevents duplicate emails and ensures data integrity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_unique'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT users_email_unique UNIQUE (email);
        RAISE NOTICE 'Added unique constraint on users.email';
    ELSE
        RAISE NOTICE 'Unique constraint on users.email already exists';
    END IF;
END $$;

-- ============================================================================
-- 2. ADD INSERT POLICY FOR AUTHENTICATED USERS
-- ============================================================================
-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;

-- Create INSERT policy for authenticated users
-- This allows users to insert their own record
-- (API uses service role which bypasses RLS, but this is a safety net)
CREATE POLICY "Users can insert own record"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 3. VERIFY EXISTING POLICIES ARE CORRECT
-- ============================================================================
-- Ensure SELECT and UPDATE policies exist (they should from create_users_table.sql)
-- But we'll recreate them with IF NOT EXISTS pattern using DO block

DO $$
BEGIN
    -- Check and create SELECT policy if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'users'
          AND policyname = 'Users can read own record'
    ) THEN
        CREATE POLICY "Users can read own record"
        ON public.users
        FOR SELECT
        USING (auth.uid() = id);
        RAISE NOTICE 'Created SELECT policy for users table';
    END IF;

    -- Check and create UPDATE policy if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'users'
          AND policyname = 'Users can update own record'
    ) THEN
        CREATE POLICY "Users can update own record"
        ON public.users
        FOR UPDATE
        USING (auth.uid() = id);
        RAISE NOTICE 'Created UPDATE policy for users table';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (for manual checking)
-- ============================================================================
-- Uncomment these to verify the setup after running the migration:

-- Check all policies on users table
-- SELECT 
--     tablename,
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual,
--     with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename = 'users'
-- ORDER BY policyname;

-- Check unique constraint
-- SELECT 
--     conname AS constraint_name,
--     contype AS constraint_type
-- FROM pg_constraint
-- WHERE conrelid = 'public.users'::regclass
--   AND conname = 'users_email_unique';

