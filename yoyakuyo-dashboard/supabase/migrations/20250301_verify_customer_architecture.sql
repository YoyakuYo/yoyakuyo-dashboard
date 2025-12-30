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
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'line_users'
        ) THEN 'EXISTS - see columns below'
        ELSE 'DOES NOT EXIST'
    END as table_status;

-- If line_users exists, show its structure
SELECT 
    'line_users' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'line_users'
AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'line_users'
)
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

-- 6. Check line_users table status (if table exists)
SELECT 
    'line_users' as table_name,
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
        ) THEN 'Table exists - count available via separate query'
        ELSE 'N/A - table does not exist'
    END as record_count;

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

-- 12. Check line_accounts statistics (line_users table does not exist, so no overlap check needed)
SELECT 
    'line_accounts statistics' as check_type,
    COUNT(DISTINCT la.line_user_id)::text as unique_line_user_ids,
    COUNT(DISTINCT la.customer_id)::text as unique_customer_ids,
    COUNT(*)::text as total_mappings,
    'line_users table does not exist - no redundancy check needed' as note
FROM line_accounts la;

