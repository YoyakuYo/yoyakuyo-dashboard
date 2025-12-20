-- ============================================
-- VERIFY CUSTOMER ARCHITECTURE IN SUPABASE
-- ============================================
-- This query checks the current state of customer-related tables
-- ============================================

-- 1. Check if customers table exists and its structure
SELECT 
    'customers' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'customers'
ORDER BY ordinal_position;

-- 2. Check if line_accounts table exists and its structure
SELECT 
    'line_accounts' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'line_accounts'
ORDER BY ordinal_position;

-- 3. Check if line_users table exists (the one we just created)
SELECT 
    'line_users' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'line_users'
ORDER BY ordinal_position;

-- 4. Count customers by role
SELECT 
    role,
    COUNT(*) as count
FROM customers
GROUP BY role
ORDER BY role;

-- 5. Count LINE account mappings
SELECT 
    COUNT(*) as total_line_accounts,
    COUNT(DISTINCT customer_id) as unique_customers_with_line,
    COUNT(DISTINCT line_user_id) as unique_line_user_ids
FROM line_accounts;

-- 6. Count line_users records (if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'line_users'
    ) THEN
        RAISE NOTICE 'line_users table EXISTS';
    ELSE
        RAISE NOTICE 'line_users table DOES NOT EXIST';
    END IF;
END $$;

SELECT 
    'line_users' as table_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'line_users'
        ) THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'line_users'
        ) THEN (
            SELECT COUNT(*)::text FROM line_users
        )
        ELSE '0'
    END as total_records;

-- 7. Check for orphaned records (line_accounts without customers)
SELECT 
    'line_accounts without customers' as issue,
    COUNT(*) as count
FROM line_accounts la
LEFT JOIN customers c ON la.customer_id = c.id
WHERE c.id IS NULL;

-- 8. Check for customers without auth.users (should not exist if FK constraint works)
SELECT 
    'customers without auth.users' as issue,
    COUNT(*) as count
FROM customers c
LEFT JOIN auth.users u ON c.id = u.id
WHERE u.id IS NULL;

-- 9. Sample LINE customer data (first 5)
SELECT 
    c.id as customer_id,
    c.role,
    c.created_at as customer_created,
    la.line_user_id,
    la.created_at as line_account_created,
    u.email as auth_email,
    u.raw_user_meta_data->>'line_user_id' as auth_metadata_line_id
FROM customers c
INNER JOIN line_accounts la ON c.id = la.customer_id
LEFT JOIN auth.users u ON c.id = u.id
WHERE c.role = 'customer'
ORDER BY c.created_at DESC
LIMIT 5;

-- 10. Check bookings source distribution
SELECT 
    source,
    COUNT(*) as booking_count,
    COUNT(DISTINCT customer_id) as unique_customers
FROM bookings
GROUP BY source
ORDER BY source;

-- 11. Verify foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('customers', 'line_accounts', 'line_users', 'bookings')
ORDER BY tc.table_name, kcu.column_name;

-- 12. Check if line_users overlaps with line_accounts (potential redundancy)
SELECT 
    'line_users vs line_accounts overlap' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'line_users'
        ) THEN (
            SELECT COUNT(DISTINCT lu.line_user_id)::text 
            FROM line_users lu
        )
        ELSE 'N/A (table does not exist)'
    END as line_users_count,
    COUNT(DISTINCT la.line_user_id)::text as line_accounts_count,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'line_users'
        ) THEN (
            SELECT COUNT(DISTINCT CASE WHEN la.line_user_id IS NOT NULL THEN lu.line_user_id END)::text
            FROM line_users lu
            FULL OUTER JOIN line_accounts la ON lu.line_user_id = la.line_user_id
        )
        ELSE 'N/A (table does not exist)'
    END as overlapping_ids
FROM line_accounts la;

