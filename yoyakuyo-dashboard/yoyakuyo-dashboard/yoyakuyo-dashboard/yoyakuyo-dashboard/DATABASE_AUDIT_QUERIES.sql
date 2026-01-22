-- ============================================================
-- FULL DATABASE + BACKEND AUDIT - SQL QUERIES
-- ============================================================
-- Run these queries in Supabase SQL Editor to diagnose issues
-- ============================================================

-- ============================================================
-- PHASE 2 — AUTH ↔ USERS TABLE LINK VERIFICATION
-- ============================================================

-- Check users table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Check owner_auth_id foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'users'
    AND kcu.column_name = 'owner_auth_id';

-- Verify auth.users ↔ public.users linkage
SELECT 
    u.id,
    u.email AS public_email,
    u.owner_auth_id,
    a.id AS auth_id,
    a.email AS auth_email,
    CASE 
        WHEN a.id IS NULL THEN '❌ FK BROKEN - auth user missing'
        WHEN u.owner_auth_id IS NULL THEN '⚠️ NULL owner_auth_id'
        WHEN u.email != a.email THEN '⚠️ EMAIL MISMATCH'
        ELSE '✅ LINKED'
    END AS status
FROM public.users u
LEFT JOIN auth.users a ON u.owner_auth_id = a.id
ORDER BY u.created_at DESC
LIMIT 50;

-- Count broken links
SELECT 
    COUNT(*) FILTER (WHERE owner_auth_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM auth.users WHERE id = public.users.owner_auth_id
    )) AS broken_fk_count,
    COUNT(*) FILTER (WHERE owner_auth_id IS NULL) AS null_owner_auth_id_count,
    COUNT(*) AS total_users
FROM public.users;

-- ============================================================
-- PHASE 4 — SHOP CLAIM CONSTRAINT DEBUG
-- ============================================================

-- List ALL constraints on shops table
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'shops'
  AND n.nspname = 'public'
ORDER BY conname;

-- Check shops table structure (focus on claim-related columns)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'shops'
  AND column_name IN (
    'id', 'owner_id', 'owner_user_id', 'claimed_at', 
    'claim_status', 'verification_status', 'is_verified'
  )
ORDER BY ordinal_position;

-- Check owner_verification table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'owner_verification'
ORDER BY ordinal_position;

-- Check for CHECK constraints that might be blocking inserts
SELECT 
    conname,
    pg_get_constraintdef(oid) AS definition,
    conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'c'
  AND conrelid = 'public.shops'::regclass;

-- ============================================================
-- PHASE 3 — CHECK FOR BROKEN FOREIGN KEY CONSTRAINTS
-- ============================================================

-- Check if owner_auth_id FK exists and is valid
SELECT 
    conname AS constraint_name,
    CASE 
        WHEN conname IS NULL THEN '❌ NO FK CONSTRAINT EXISTS'
        ELSE '✅ FK CONSTRAINT EXISTS: ' || conname
    END AS status
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'users'
  AND c.contype = 'f'
  AND EXISTS (
      SELECT 1 
      FROM pg_attribute a 
      WHERE a.attrelid = t.oid 
        AND a.attname = 'owner_auth_id'
        AND a.attnum = ANY(c.conkey)
  );

-- ============================================================
-- ADDITIONAL DIAGNOSTICS
-- ============================================================

-- Check recent users created
SELECT 
    id,
    email,
    full_name,
    role,
    owner_auth_id,
    account_status,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Check recent owner_verification records
SELECT 
    id,
    user_id,
    shop_id,
    verification_status,
    created_at
FROM public.owner_verification
ORDER BY created_at DESC
LIMIT 10;

-- Check shops with claim issues
SELECT 
    id,
    name,
    owner_id,
    owner_user_id,
    claimed_at,
    verification_status,
    is_verified,
    created_at
FROM public.shops
WHERE owner_user_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

