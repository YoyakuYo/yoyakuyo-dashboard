-- ============================================
-- MIGRATION VERIFICATION SCRIPT
-- Run this FIRST in Supabase SQL editor to verify the migration will work
-- ============================================

-- 1. CHECK CURRENT STATE: Customers with LINE accounts
SELECT 'CURRENT STATE' as section;
SELECT
    c.id,
    c.role,
    c.line_user_id,
    la.line_user_id as line_account_user_id,
    CASE WHEN au.id IS NOT NULL THEN 'HAS_WEB_AUTH' ELSE 'NO_WEB_AUTH' END as web_auth_status,
    CASE WHEN c.line_user_id IS NOT NULL THEN 'HAS_LINE_ID' ELSE 'NO_LINE_ID' END as line_id_status
FROM customers c
INNER JOIN line_accounts la ON c.id = la.customer_id
LEFT JOIN auth.users au ON au.id = c.id
ORDER BY c.created_at DESC
LIMIT 20;

-- 2. CHECK THE PROBLEMATIC CONSTRAINT (if it exists)
SELECT 'CONSTRAINT CHECK' as section;
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'customer_single_identity'
AND conrelid = 'public.customers'::regclass;

-- 3. PREVIEW WHAT WILL BE CHANGED
SELECT 'MIGRATION PREVIEW' as section;

-- Show customers that will have line_user_id set
SELECT 'CUSTOMERS GETTING line_user_id SET' as action, COUNT(*) as count
FROM customers c
INNER JOIN line_accounts la ON c.id = la.customer_id
WHERE c.line_user_id IS NULL;

-- Show customers that will have role changed to 'line'
SELECT 'CUSTOMERS GETTING role CHANGED TO line' as action, COUNT(*) as count
FROM customers c
INNER JOIN line_accounts la ON c.id = la.customer_id
WHERE c.role != 'line'
AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id);

-- Show customers that will be unchanged
SELECT 'CUSTOMERS UNCHANGED (already have line role)' as action, COUNT(*) as count
FROM customers c
INNER JOIN line_accounts la ON c.id = la.customer_id
WHERE c.role = 'line';

-- 4. VERIFY NO CONFLICTS
SELECT 'CONFLICT CHECK' as section;

-- Check for customers with multiple identities that might cause issues
SELECT
    c.id,
    c.role,
    COUNT(DISTINCT CASE WHEN au.id IS NOT NULL THEN 'web' END) as web_identities,
    COUNT(DISTINCT CASE WHEN la.line_user_id IS NOT NULL THEN 'line' END) as line_identities,
    COUNT(DISTINCT CASE WHEN c.role = 'guest' THEN 'guest' END) as guest_identities
FROM customers c
LEFT JOIN line_accounts la ON c.id = la.customer_id
LEFT JOIN auth.users au ON au.id = c.id
GROUP BY c.id, c.role
HAVING
    (COUNT(DISTINCT CASE WHEN au.id IS NOT NULL THEN 'web' END) > 0 AND
     COUNT(DISTINCT CASE WHEN la.line_user_id IS NOT NULL THEN 'line' END) > 0)
    OR
    (COUNT(DISTINCT CASE WHEN c.role = 'guest' THEN 'guest' END) > 0 AND
     (COUNT(DISTINCT CASE WHEN au.id IS NOT NULL THEN 'web' END) > 0 OR
      COUNT(DISTINCT CASE WHEN la.line_user_id IS NOT NULL THEN 'line' END) > 0))
ORDER BY c.id;

-- 5. FINAL SUMMARY
SELECT 'MIGRATION SUMMARY' as section;
SELECT
    'Total LINE accounts' as metric,
    COUNT(*) as value
FROM line_accounts

UNION ALL

SELECT
    'Customers with LINE accounts',
    COUNT(DISTINCT c.id)
FROM customers c
INNER JOIN line_accounts la ON c.id = la.customer_id

UNION ALL

SELECT
    'Customers needing line_user_id',
    COUNT(*)
FROM customers c
INNER JOIN line_accounts la ON c.id = la.customer_id
WHERE c.line_user_id IS NULL

UNION ALL

SELECT
    'Pure LINE customers (will get role=line)',
    COUNT(*)
FROM customers c
INNER JOIN line_accounts la ON c.id = la.customer_id
WHERE c.role != 'line'
AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = c.id);
