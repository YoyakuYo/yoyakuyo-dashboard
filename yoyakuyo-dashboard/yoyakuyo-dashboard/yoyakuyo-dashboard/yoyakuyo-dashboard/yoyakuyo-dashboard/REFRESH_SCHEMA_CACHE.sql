-- Refresh PostgREST schema cache and verify all tables exist
-- Run this after running migrations to ensure PostgREST can see the new tables

-- 1. Notify PostgREST to reload schema (multiple methods)
SELECT pg_notify('pgrst', 'reload schema');

-- 2. Alternative: Restart PostgREST by touching the schema cache
-- This requires superuser access, so we'll use pg_notify instead

-- 3. Verify all required tables exist
SELECT 
  'Table Verification' AS check_type,
  table_name,
  CASE 
    WHEN table_name IN ('owner_profiles', 'shop_claims', 'shop_claim_documents', 'complaints', 'staff_owner_threads', 'staff_owner_messages')
    THEN 'REQUIRED'
    ELSE 'OPTIONAL'
  END AS table_type,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = table_name
  ) AS exists
FROM (VALUES 
  ('owner_profiles'),
  ('shop_claims'),
  ('shop_claim_documents'),
  ('complaints'),
  ('staff_owner_threads'),
  ('staff_owner_messages')
) AS required_tables(table_name);

-- 4. Verify owner_profiles has all required columns
SELECT 
  'owner_profiles Columns' AS check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'owner_profiles'
ORDER BY ordinal_position;

-- 5. Check if RLS is enabled on owner_profiles
SELECT 
  'RLS Status' AS check_type,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'owner_profiles';

-- 6. Check RLS policies on owner_profiles
SELECT
  'RLS Policies' AS check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'owner_profiles'
ORDER BY policyname;

-- Note: After running this, you may need to wait a few seconds for PostgREST to reload
-- If the error persists, you may need to restart the Supabase API service

