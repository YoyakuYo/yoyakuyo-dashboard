-- SQL Query to Verify User Names in Database
-- This query checks if names exist in the users and customers tables

-- ============================================
-- 1. Check users table structure and sample data
-- ============================================
SELECT 
    'users table structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('full_name', 'email', 'id')
ORDER BY column_name;

-- ============================================
-- 2. Check owners (users who have shops) and their names
-- ============================================
SELECT 
    'OWNERS' as user_type,
    u.id,
    u.email,
    u.full_name as display_name,
    s.id as shop_id,
    s.name as shop_name,
    s.owner_user_id
FROM public.users u
LEFT JOIN public.shops s ON s.owner_user_id = u.id
WHERE s.id IS NOT NULL  -- Only users who own shops
ORDER BY u.created_at DESC
LIMIT 20;

-- ============================================
-- 3. Check all users table entries with names
-- ============================================
SELECT 
    'ALL USERS TABLE' as check_type,
    id,
    email,
    full_name as display_name,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 4. Check customers table structure and sample data
-- ============================================
SELECT 
    'customers table structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customers'
  AND column_name IN ('name', 'email', 'id', 'auth_user_id', 'role')
ORDER BY column_name;

-- ============================================
-- 5. Check customers with their names
-- ============================================
SELECT 
    'CUSTOMERS' as user_type,
    c.id,
    c.role,
    c.auth_user_id,
    c.name as customer_name,
    c.email as customer_email,
    u.full_name as user_full_name,
    COALESCE(u.full_name, c.name) as display_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM shops s WHERE s.owner_user_id = c.auth_user_id) 
        THEN 'OWNER'
        ELSE 'CUSTOMER'
    END as actual_type
FROM public.customers c
LEFT JOIN public.users u ON u.id = c.auth_user_id
ORDER BY c.created_at DESC
LIMIT 20;

-- ============================================
-- 6. Summary: Count users with/without names
-- ============================================
SELECT 
    'SUMMARY' as check_type,
    'users table' as table_name,
    COUNT(*) as total_records,
    COUNT(full_name) as records_with_name,
    COUNT(*) - COUNT(full_name) as records_without_name
FROM public.users
UNION ALL
SELECT 
    'SUMMARY' as check_type,
    'customers table' as table_name,
    COUNT(*) as total_records,
    COUNT(name) as records_with_name,
    COUNT(*) - COUNT(name) as records_without_name
FROM public.customers
UNION ALL
SELECT 
    'SUMMARY' as check_type,
    'owners (users with shops)' as table_name,
    COUNT(DISTINCT u.id) as total_records,
    COUNT(DISTINCT CASE WHEN u.full_name IS NOT NULL THEN u.id END) as records_with_name,
    COUNT(DISTINCT CASE WHEN u.full_name IS NULL THEN u.id END) as records_without_name
FROM public.users u
INNER JOIN public.shops s ON s.owner_user_id = u.id;

-- ============================================
-- 7. Check specific owner by shop
-- ============================================
SELECT 
    'OWNER BY SHOP' as check_type,
    s.id as shop_id,
    s.name as shop_name,
    s.owner_user_id,
    u.id as user_id,
    u.email,
    u.full_name as display_name
FROM public.shops s
LEFT JOIN public.users u ON u.id = s.owner_user_id
WHERE s.owner_user_id IS NOT NULL
ORDER BY s.created_at DESC
LIMIT 10;

