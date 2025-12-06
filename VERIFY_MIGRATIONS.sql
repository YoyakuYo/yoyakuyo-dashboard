-- ============================================================================
-- VERIFICATION QUERIES FOR MIGRATIONS
-- ============================================================================
-- Run these AFTER running the two migrations to verify they worked

-- 1. Check verification status constraint (FIXED - no ambiguous columns)
SELECT 
  tc.constraint_name, 
  cc.check_clause 
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
  AND tc.constraint_schema = cc.constraint_schema
WHERE tc.table_name = 'owner_verification' 
  AND tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public';

-- 2. Check notifications table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'owner_notifications';

-- 3. Check notifications table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'owner_notifications'
ORDER BY ordinal_position;

-- 4. Check RLS policies on owner_notifications
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'owner_notifications';

