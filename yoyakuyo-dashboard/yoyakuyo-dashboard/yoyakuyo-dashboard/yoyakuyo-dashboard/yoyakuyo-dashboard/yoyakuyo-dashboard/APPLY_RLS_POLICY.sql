-- ============================================================================
-- FIX SHOPS TABLE RLS INSERT POLICY
-- ============================================================================
-- Run this SQL in Supabase SQL Editor to fix shop creation issue after signup
-- This ensures authenticated users can only insert shops for themselves
--
-- Instructions:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire SQL block
-- 3. Click "Run" to execute
-- ============================================================================

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

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to verify the setup)
-- ============================================================================

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'shops';

-- List all policies on shops table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'shops';

-- Check owner_user_id foreign key constraint
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'shops'
  AND kcu.column_name = 'owner_user_id';

