-- ============================================================================
-- SUPABASE SCHEMA VERIFICATION QUERIES
-- ============================================================================
-- Run these queries in Supabase SQL Editor to verify your schema matches
-- the expected structure for login/signup functionality
-- ============================================================================

-- ============================================================================
-- 1. VERIFY users TABLE STRUCTURE
-- ============================================================================

-- Check users table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Check users table constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;

-- Check users table policies
SELECT 
    policyname,
    cmd AS operation,
    roles,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users';

-- ============================================================================
-- 2. VERIFY shops TABLE STRUCTURE
-- ============================================================================

-- Check shops table columns (especially owner_user_id)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shops'
  AND column_name IN ('id', 'name', 'owner_user_id', 'claim_status', 'claimed_at', 'email', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- Check shops foreign key to users
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.shops'::regclass
  AND contype = 'f'
  AND conname LIKE '%owner_user_id%';

-- Check shops table policies
SELECT 
    policyname,
    cmd AS operation,
    roles,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'shops';

-- ============================================================================
-- 3. VERIFY FOREIGN KEY RELATIONSHIPS
-- ============================================================================

-- Check all foreign keys involving users and shops
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (ccu.table_name = 'users' OR tc.table_name = 'users' OR tc.table_name = 'shops')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 4. VERIFY DATA INTEGRITY
-- ============================================================================

-- Check for orphaned users (auth.users without public.users)
SELECT 
    au.id AS auth_user_id,
    au.email,
    au.email_confirmed_at,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- Check for orphaned shops (shops with invalid owner_user_id)
SELECT 
    s.id AS shop_id,
    s.name,
    s.owner_user_id,
    s.claim_status,
    CASE 
        WHEN pu.id IS NULL THEN 'MISSING USER'
        WHEN au.id IS NULL THEN 'ORPHANED USER'
        ELSE 'OK'
    END AS status
FROM shops s
LEFT JOIN public.users pu ON s.owner_user_id = pu.id
LEFT JOIN auth.users au ON pu.id = au.id
WHERE s.owner_user_id IS NOT NULL
ORDER BY s.created_at DESC
LIMIT 10;

-- Check for users with unconfirmed emails (may cause login issues)
SELECT 
    au.id AS auth_user_id,
    au.email,
    au.email_confirmed_at,
    au.created_at AS auth_created_at,
    pu.id AS public_user_id,
    pu.name,
    pu.created_at AS public_created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email_confirmed_at IS NULL
  AND pu.id IS NOT NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- ============================================================================
-- 5. VERIFY REQUIRED COLUMNS EXIST
-- ============================================================================

-- Check if preferred_language column exists in users table
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'preferred_language';

-- Check if unique constraint on email exists
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_email_unique';

-- ============================================================================
-- 6. VERIFY RLS STATUS
-- ============================================================================

-- Check if RLS is enabled on critical tables
SELECT 
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'shops', 'shop_threads', 'shop_messages')
ORDER BY tablename;

-- ============================================================================
-- 7. SUMMARY QUERY - Quick overview
-- ============================================================================

-- Get summary of all tables, columns, and constraints
SELECT 
    t.table_name,
    COUNT(DISTINCT c.column_name) AS column_count,
    COUNT(DISTINCT CASE WHEN c.column_name = 'owner_user_id' THEN 1 END) AS has_owner_user_id,
    COUNT(DISTINCT CASE WHEN c.column_name = 'preferred_language' THEN 1 END) AS has_preferred_language,
    COUNT(DISTINCT fk.conname) AS foreign_key_count,
    COUNT(DISTINCT p.policyname) AS policy_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
LEFT JOIN pg_constraint fk ON fk.conrelid = (t.table_schema || '.' || t.table_name)::regclass AND fk.contype = 'f'
LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = t.table_schema
WHERE t.table_schema = 'public'
  AND t.table_name IN ('users', 'shops', 'shop_threads', 'shop_messages', 'messages')
GROUP BY t.table_name
ORDER BY t.table_name;

