-- ====================================================================
-- VERIFY CUSTOMERS TABLE STRUCTURE AND USAGE
-- ====================================================================
-- This script helps verify:
-- 1. Customers table structure
-- 2. What tables reference customers (foreign keys)
-- 3. What functions/triggers use customers
-- 4. What views use customers
-- 5. RLS policies on customers
-- ====================================================================

-- ====================================================================
-- 1. CUSTOMERS TABLE STRUCTURE
-- ====================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- ====================================================================
-- 2. CUSTOMERS TABLE CONSTRAINTS (Primary Keys, Foreign Keys, Unique, etc.)
-- ====================================================================
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'customers'
ORDER BY tc.constraint_type, tc.constraint_name;

-- ====================================================================
-- 3. TABLES THAT REFERENCE CUSTOMERS (Foreign Keys)
-- ====================================================================
SELECT
    tc.table_name AS referencing_table,
    kcu.column_name AS referencing_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'public'
  AND ccu.table_name = 'customers'
ORDER BY tc.table_name, kcu.column_name;

-- ====================================================================
-- 4. FUNCTIONS THAT USE CUSTOMERS TABLE
-- ====================================================================
SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%customers%'
ORDER BY p.proname;

-- ====================================================================
-- 5. TRIGGERS ON CUSTOMERS TABLE
-- ====================================================================
SELECT
    t.tgname AS trigger_name,
    p.proname AS function_name,
    CASE t.tgtype::integer & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END AS timing,
    CASE t.tgtype::integer & 28
        WHEN 16 THEN 'UPDATE'
        WHEN 8 THEN 'DELETE'
        WHEN 4 THEN 'INSERT'
        WHEN 20 THEN 'INSERT, UPDATE'
        WHEN 28 THEN 'INSERT, UPDATE, DELETE'
        ELSE 'UNKNOWN'
    END AS events,
    c.relname AS table_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'customers'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ====================================================================
-- 6. TRIGGERS THAT REFERENCE CUSTOMERS (on other tables)
-- ====================================================================
SELECT
    c.relname AS table_name,
    t.tgname AS trigger_name,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND pg_get_functiondef(p.oid) ILIKE '%customers%'
  AND c.relname != 'customers'
ORDER BY c.relname, t.tgname;

-- ====================================================================
-- 7. VIEWS THAT USE CUSTOMERS TABLE
-- ====================================================================
SELECT
    table_name AS view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition ILIKE '%customers%'
ORDER BY table_name;

-- ====================================================================
-- 8. RLS POLICIES ON CUSTOMERS TABLE
-- ====================================================================
SELECT
    n.nspname AS schemaname,
    c.relname AS tablename,
    pol.polname AS policyname,
    CASE WHEN pol.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END AS permissive,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS cmd,
    pg_get_expr(pol.polqual, pol.polrelid) AS qual,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check,
    string_agg(r.rolname, ', ' ORDER BY r.rolname) AS roles
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_roles r ON r.oid = ANY(pol.polroles)
WHERE n.nspname = 'public'
  AND c.relname = 'customers'
GROUP BY n.nspname, c.relname, pol.polname, pol.polpermissive, pol.polcmd, pol.polqual, pol.polrelid, pol.polwithcheck
ORDER BY pol.polname;

-- ====================================================================
-- 9. INDEXES ON CUSTOMERS TABLE
-- ====================================================================
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'customers'
ORDER BY indexname;

-- ====================================================================
-- 10. SAMPLE DATA FROM CUSTOMERS TABLE (by role)
-- ====================================================================
SELECT
    role,
    COUNT(*) AS count,
    COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) AS with_auth_user_id,
    COUNT(CASE WHEN line_user_id IS NOT NULL THEN 1 END) AS with_line_user_id,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) AS with_email,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) AS with_name
FROM customers
GROUP BY role
ORDER BY role;

-- ====================================================================
-- 11. CHECK FOR CUSTOMER_PROFILES TABLE (if it exists)
-- ====================================================================
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customer_profiles'
ORDER BY ordinal_position;

-- ====================================================================
-- 12. CHECK BOOKINGS TABLE FOR CUSTOMER REFERENCES
-- ====================================================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND (column_name LIKE '%customer%' OR column_name LIKE '%profile%')
ORDER BY ordinal_position;

-- ====================================================================
-- 13. VERIFY TRIGGER FUNCTIONS THAT MIGHT USE CUSTOMER_PROFILE_ID
-- ====================================================================
SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%customer_profile_id%'
ORDER BY p.proname;

-- ====================================================================
-- 14. CHECK FOR ANY REFERENCES TO CUSTOMER_PROFILE_ID IN TRIGGERS
-- ====================================================================
SELECT
    c.relname AS table_name,
    t.tgname AS trigger_name,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND pg_get_functiondef(p.oid) ILIKE '%customer_profile_id%'
ORDER BY c.relname, t.tgname;
