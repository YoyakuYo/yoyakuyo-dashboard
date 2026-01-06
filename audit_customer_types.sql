-- ============================================
-- COMPLETE CUSTOMER TYPE AUDIT: STRICT SEPARATION VERIFICATION
-- ============================================

-- ===============================
-- QUERY 1: EXECUTIVE SUMMARY (Run this first)
-- ===============================
WITH customer_analysis AS (
    SELECT
        c.id,
        c.role as current_role,
        CASE WHEN au.id IS NOT NULL THEN 1 ELSE 0 END as has_web_auth,
        CASE WHEN la.customer_id IS NOT NULL THEN 1 ELSE 0 END as has_line_account,

        CASE
            WHEN au.id IS NOT NULL AND la.customer_id IS NULL AND c.role = 'web' THEN 'PURE_WEB'
            WHEN au.id IS NULL AND la.customer_id IS NOT NULL AND c.line_user_id IS NOT NULL THEN 'PURE_LINE'
            WHEN au.id IS NULL AND la.customer_id IS NULL AND c.role = 'guest' THEN 'PURE_GUEST'
            WHEN au.id IS NOT NULL AND la.customer_id IS NOT NULL THEN 'HYBRID_WEB_LINE'
            WHEN au.id IS NOT NULL AND c.role = 'guest' THEN 'HYBRID_WEB_GUEST'
            WHEN la.customer_id IS NOT NULL AND c.role = 'guest' THEN 'HYBRID_LINE_GUEST'
            ELSE 'UNKNOWN'
        END as correct_type

    FROM customers c
    LEFT JOIN auth.users au ON au.id = c.id
    LEFT JOIN line_accounts la ON la.customer_id = c.id
)
SELECT
    '🎯 EXECUTIVE SUMMARY' as report_type,
    'Total Customers' as metric,
    COUNT(*)::text as count,
    CASE WHEN COUNT(CASE WHEN correct_type LIKE 'HYBRID%' THEN 1 END) = 0 THEN '✅ PERFECT SEPARATION' ELSE '❌ HYBRIDS EXIST' END as status
FROM customer_analysis

UNION ALL

SELECT '🎯 EXECUTIVE SUMMARY' as report_type, 'Pure Web Customers' as metric, COUNT(CASE WHEN correct_type = 'PURE_WEB' THEN 1 END)::text as count, 'Web customers with ONLY web auth' as status FROM customer_analysis

UNION ALL

SELECT '🎯 EXECUTIVE SUMMARY' as report_type, 'Pure LINE Customers' as metric, COUNT(CASE WHEN correct_type = 'PURE_LINE' THEN 1 END)::text as count, 'LINE customers with ONLY LINE accounts' as status FROM customer_analysis

UNION ALL

SELECT '🎯 EXECUTIVE SUMMARY' as report_type, 'Pure Guest Customers' as metric, COUNT(CASE WHEN correct_type = 'PURE_GUEST' THEN 1 END)::text as count, 'Guest customers with NO auth/accounts' as status FROM customer_analysis

UNION ALL

SELECT '🎯 EXECUTIVE SUMMARY' as report_type, 'Hybrid Violations' as metric, COUNT(CASE WHEN correct_type LIKE 'HYBRID%' THEN 1 END)::text as count, CASE WHEN COUNT(CASE WHEN correct_type LIKE 'HYBRID%' THEN 1 END) = 0 THEN '✅ ZERO VIOLATIONS' ELSE '❌ CLEANUP NEEDED' END as status FROM customer_analysis;

-- ===============================
-- QUERY 2: CUSTOMER DETAILS (Run this second)
-- ===============================
WITH customer_analysis AS (
    SELECT
        c.id,
        c.role as current_role,
        CASE WHEN au.id IS NOT NULL THEN 1 ELSE 0 END as has_web_auth,
        CASE WHEN la.customer_id IS NOT NULL THEN 1 ELSE 0 END as has_line_account,

        CASE
            WHEN au.id IS NOT NULL AND la.customer_id IS NULL AND c.role = 'web' THEN 'PURE_WEB'
            WHEN au.id IS NULL AND la.customer_id IS NOT NULL AND c.line_user_id IS NOT NULL THEN 'PURE_LINE'
            WHEN au.id IS NULL AND la.customer_id IS NULL AND c.role = 'guest' THEN 'PURE_GUEST'
            WHEN au.id IS NOT NULL AND la.customer_id IS NOT NULL THEN 'HYBRID_WEB_LINE'
            WHEN au.id IS NOT NULL AND c.role = 'guest' THEN 'HYBRID_WEB_GUEST'
            WHEN la.customer_id IS NOT NULL AND c.role = 'guest' THEN 'HYBRID_LINE_GUEST'
            ELSE 'UNKNOWN'
        END as correct_type

    FROM customers c
    LEFT JOIN auth.users au ON au.id = c.id
    LEFT JOIN line_accounts la ON la.customer_id = c.id
)
SELECT
    '📋 CUSTOMER STATUS' as report_type,
    id::text as customer_id,
    current_role,
    correct_type,
    CASE WHEN has_web_auth = 1 THEN 'HAS_WEB' ELSE 'NO_WEB' END as web_auth,
    CASE WHEN has_line_account = 1 THEN 'HAS_LINE' ELSE 'NO_LINE' END as line_account,
    CASE
        WHEN correct_type = 'PURE_WEB' THEN '✅ PURE WEB'
        WHEN correct_type = 'PURE_LINE' THEN '✅ PURE LINE'
        WHEN correct_type = 'PURE_GUEST' THEN '✅ PURE GUEST'
        WHEN correct_type LIKE 'HYBRID%' THEN '❌ HYBRID VIOLATION'
        ELSE '❓ UNKNOWN'
    END as status
FROM customer_analysis
ORDER BY id;
