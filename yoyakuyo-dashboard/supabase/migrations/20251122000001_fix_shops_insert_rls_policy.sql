-- Migration: Fix shops table RLS insert policy
-- This migration updates the insert policy to ensure authenticated users can only insert shops for themselves
-- Run this migration to fix shop creation issue after signup

-- 1. Ensure Row Level Security (RLS) is enabled on shops
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- 2. Remove any conflicting insert policies on shops
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON shops;
DROP POLICY IF EXISTS "Allow shop inserts" ON shops;
DROP POLICY IF EXISTS "Allow authenticated users to insert shops" ON shops;
DROP POLICY IF EXISTS "Allow authenticated users to insert shop for themselves" ON shops;

-- 3. Create correct insert policy
-- Note: The column is owner_user_id (not owner_id), and it references public.users(id) which references auth.users(id)
CREATE POLICY "Allow authenticated users to insert shop for themselves"
ON shops
FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = owner_user_id );

-- 4. Verify owner_user_id column on shops references:
--    - public.users(id) (which references auth.users(id))
--    This is already set up in add_shop_ownership_fields.sql migration
--    The foreign key constraint ensures: owner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL

