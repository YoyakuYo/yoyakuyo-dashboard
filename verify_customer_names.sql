-- SQL Query to Verify Customer Names in Database
-- This query checks if customers have names in the customers and users tables

-- ============================================
-- 1. Check customers table structure
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
-- 2. Check all customers with their names
-- ============================================
SELECT 
    'ALL CUSTOMERS' as check_type,
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
    END as actual_type,
    CASE 
        WHEN COALESCE(u.full_name, c.name) IS NULL THEN '❌ NO NAME'
        ELSE '✅ HAS NAME'
    END as status
FROM public.customers c
LEFT JOIN public.users u ON u.id = c.auth_user_id
ORDER BY c.created_at DESC
LIMIT 50;

-- ============================================
-- 3. Check web customers (have auth_user_id) - names should be in users table
-- ============================================
SELECT 
    'WEB CUSTOMERS' as check_type,
    c.id,
    c.role,
    c.auth_user_id,
    c.name as customer_name,
    u.email as user_email,
    u.full_name as user_full_name,
    COALESCE(u.full_name, c.name) as display_name,
    CASE 
        WHEN u.full_name IS NOT NULL THEN '✅ NAME IN USERS TABLE'
        WHEN c.name IS NOT NULL THEN '⚠️ NAME IN CUSTOMERS TABLE (fallback)'
        ELSE '❌ NO NAME'
    END as status
FROM public.customers c
LEFT JOIN public.users u ON u.id = c.auth_user_id
WHERE c.auth_user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM shops s WHERE s.owner_user_id = c.auth_user_id)  -- Exclude owners
ORDER BY c.created_at DESC
LIMIT 50;

-- ============================================
-- 4. Check guest customers (no auth_user_id) - names should be in customers table
-- ============================================
SELECT 
    'GUEST CUSTOMERS' as check_type,
    c.id,
    c.role,
    c.email,
    c.name as customer_name,
    CASE 
        WHEN c.name IS NOT NULL THEN '✅ HAS NAME'
        ELSE '❌ NO NAME'
    END as status
FROM public.customers c
WHERE c.auth_user_id IS NULL
ORDER BY c.created_at DESC
LIMIT 50;

-- ============================================
-- 5. Check LINE customers (have line_user_id) - names might be in customers table
-- ============================================
SELECT 
    'LINE CUSTOMERS' as check_type,
    c.id,
    c.role,
    c.line_user_id,
    c.name as customer_name,
    CASE 
        WHEN c.name IS NOT NULL THEN '✅ HAS NAME'
        ELSE '❌ NO NAME'
    END as status
FROM public.customers c
WHERE c.line_user_id IS NOT NULL
ORDER BY c.created_at DESC
LIMIT 50;

-- ============================================
-- 6. Summary: Count customers with/without names by role
-- ============================================
SELECT 
    'SUMMARY BY ROLE' as check_type,
    c.role,
    COUNT(*) as total_customers,
    COUNT(COALESCE(u.full_name, c.name)) as customers_with_name,
    COUNT(*) - COUNT(COALESCE(u.full_name, c.name)) as customers_without_name,
    ROUND(100.0 * COUNT(COALESCE(u.full_name, c.name)) / COUNT(*), 2) as percentage_with_name
FROM public.customers c
LEFT JOIN public.users u ON u.id = c.auth_user_id
GROUP BY c.role
ORDER BY c.role;

-- ============================================
-- 7. Summary: Count by customer type (web/guest/line)
-- ============================================
SELECT 
    'SUMMARY BY TYPE' as check_type,
    CASE 
        WHEN c.auth_user_id IS NOT NULL THEN 'WEB'
        WHEN c.line_user_id IS NOT NULL THEN 'LINE'
        ELSE 'GUEST'
    END as customer_type,
    COUNT(*) as total_customers,
    COUNT(COALESCE(u.full_name, c.name)) as customers_with_name,
    COUNT(*) - COUNT(COALESCE(u.full_name, c.name)) as customers_without_name
FROM public.customers c
LEFT JOIN public.users u ON u.id = c.auth_user_id
GROUP BY 
    CASE 
        WHEN c.auth_user_id IS NOT NULL THEN 'WEB'
        WHEN c.line_user_id IS NOT NULL THEN 'LINE'
        ELSE 'GUEST'
    END
ORDER BY customer_type;

-- ============================================
-- 8. Check customers that should have names in users table but don't
-- ============================================
SELECT 
    'MISSING NAMES IN USERS TABLE' as check_type,
    c.id,
    c.role,
    c.auth_user_id,
    c.name as customer_name,
    u.id as user_exists,
    u.full_name as user_full_name,
    CASE 
        WHEN u.id IS NULL THEN '❌ NO USER RECORD'
        WHEN u.full_name IS NULL THEN '❌ USER EXISTS BUT NO NAME'
        ELSE '✅ HAS NAME'
    END as status
FROM public.customers c
LEFT JOIN public.users u ON u.id = c.auth_user_id
WHERE c.auth_user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM shops s WHERE s.owner_user_id = c.auth_user_id)  -- Exclude owners
  AND (u.id IS NULL OR u.full_name IS NULL)
ORDER BY c.created_at DESC
LIMIT 20;

