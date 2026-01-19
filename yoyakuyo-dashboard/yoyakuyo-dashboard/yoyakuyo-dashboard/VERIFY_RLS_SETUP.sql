-- ============================================================================
-- VERIFICATION SCRIPT FOR SHOPS RLS POLICIES
-- ============================================================================
-- Run this in Supabase SQL Editor to verify the RLS setup is correct
-- ============================================================================

-- 1. Check if RLS is enabled on shops table
SELECT 
    tablename, 
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'shops';

-- 2. List ALL policies on shops table (should show the correct insert policy)
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'INSERT' THEN '✅ Insert Policy'
        WHEN cmd = 'SELECT' THEN '✅ Select Policy'
        WHEN cmd = 'UPDATE' THEN '✅ Update Policy'
        WHEN cmd = 'DELETE' THEN '✅ Delete Policy'
        ELSE cmd
    END as policy_type,
    with_check as with_check_condition,
    CASE 
        WHEN cmd = 'INSERT' AND with_check = '(auth.uid() = owner_user_id)' THEN '✅ CORRECT'
        WHEN cmd = 'INSERT' THEN '❌ WRONG - Check condition incorrect'
        ELSE 'N/A'
    END as insert_policy_status
FROM pg_policies 
WHERE tablename = 'shops'
ORDER BY cmd, policyname;

-- 3. Verify owner_user_id foreign key constraint
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN ccu.table_name = 'users' AND ccu.column_name = 'id' THEN '✅ CORRECT - References public.users(id)'
        ELSE '❌ Check reference'
    END as fk_status
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

-- 4. Verify public.users table references auth.users
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN ccu.table_name = 'users' AND ccu.table_schema = 'auth' THEN '✅ CORRECT - public.users references auth.users(id)'
        ELSE '❌ Check reference'
    END as fk_status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'users'
  AND tc.table_schema = 'public'
  AND kcu.column_name = 'id';

-- 5. Summary check
SELECT 
    'RLS Setup Verification' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'shops' 
            AND cmd = 'INSERT' 
            AND with_check = '(auth.uid() = owner_user_id)'
        ) THEN '✅ Insert policy is correct'
        ELSE '❌ Insert policy missing or incorrect'
    END as insert_policy_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'shops' 
            AND rowsecurity = true
        ) THEN '✅ RLS is enabled'
        ELSE '❌ RLS is not enabled'
    END as rls_enabled_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'shops'
            AND kcu.column_name = 'owner_user_id'
            AND ccu.table_name = 'users'
        ) THEN '✅ Foreign key constraint exists'
        ELSE '❌ Foreign key constraint missing'
    END as fk_constraint_check;

