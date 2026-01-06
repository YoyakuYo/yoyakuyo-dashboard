-- ============================================
-- CUSTOMER TYPE AUDIT: STRICT SEPARATION ENFORCEMENT
-- ============================================

-- STEP 1: COMPREHENSIVE CUSTOMER ANALYSIS
WITH customer_analysis AS (
    SELECT
        c.id,
        c.role as current_role,
        c.line_user_id,
        CASE WHEN au.id IS NOT NULL THEN 1 ELSE 0 END as has_web_auth,
        CASE WHEN la.customer_id IS NOT NULL THEN 1 ELSE 0 END as has_line_account,
        CASE WHEN c.role = 'guest' THEN 1 ELSE 0 END as is_guest_role,

        -- Determine CORRECT customer type based on data
        CASE
            WHEN au.id IS NOT NULL AND la.customer_id IS NULL AND c.role = 'web' THEN 'PURE_WEB'
            WHEN au.id IS NULL AND la.customer_id IS NOT NULL AND c.line_user_id IS NOT NULL THEN 'PURE_LINE'
            WHEN au.id IS NULL AND la.customer_id IS NULL AND c.role = 'guest' THEN 'PURE_GUEST'
            WHEN au.id IS NOT NULL AND la.customer_id IS NOT NULL THEN 'HYBRID_WEB_LINE'
            WHEN au.id IS NOT NULL AND c.role = 'guest' THEN 'HYBRID_WEB_GUEST'
            WHEN la.customer_id IS NOT NULL AND c.role = 'guest' THEN 'HYBRID_LINE_GUEST'
            ELSE 'UNKNOWN'
        END as correct_type,

        -- Identify mismatches
        CASE
            WHEN au.id IS NOT NULL AND la.customer_id IS NULL AND c.role != 'web' THEN 'ROLE_MISMATCH_WEB'
            WHEN au.id IS NULL AND la.customer_id IS NOT NULL AND c.role != 'line' THEN 'ROLE_MISMATCH_LINE'
            WHEN au.id IS NULL AND la.customer_id IS NULL AND c.role != 'guest' THEN 'ROLE_MISMATCH_GUEST'
            WHEN au.id IS NOT NULL AND la.customer_id IS NOT NULL THEN 'HYBRID_VIOLATION'
            WHEN au.id IS NOT NULL AND c.role = 'guest' THEN 'HYBRID_VIOLATION'
            WHEN la.customer_id IS NOT NULL AND c.role = 'guest' THEN 'HYBRID_VIOLATION'
            ELSE 'OK'
        END as status

    FROM customers c
    LEFT JOIN auth.users au ON au.id = c.id
    LEFT JOIN line_accounts la ON la.customer_id = c.id
)

-- ===============================
-- 1. CUSTOMER TYPE AUDIT SUMMARY
-- ===============================
SELECT
    '=== AUDIT SUMMARY ===' as report_section,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN correct_type = 'PURE_WEB' THEN 1 END) as pure_web_customers,
    COUNT(CASE WHEN correct_type = 'PURE_LINE' THEN 1 END) as pure_line_customers,
    COUNT(CASE WHEN correct_type = 'PURE_GUEST' THEN 1 END) as pure_guest_customers,
    COUNT(CASE WHEN correct_type LIKE 'HYBRID%' THEN 1 END) as hybrid_violations,
    COUNT(CASE WHEN status != 'OK' THEN 1 END) as total_issues
FROM customer_analysis;

-- ===============================
-- 2. VIOLATIONS OVERVIEW
-- ===============================
SELECT
    '=== VIOLATIONS OVERVIEW ===' as violations_section,
    COUNT(CASE WHEN correct_type LIKE 'HYBRID%' THEN 1 END) as hybrid_customers,
    COUNT(CASE WHEN status LIKE 'ROLE_MISMATCH%' THEN 1 END) as role_mismatches,
    STRING_AGG(
        CASE WHEN correct_type LIKE 'HYBRID%' THEN id::text ELSE NULL END,
        ', '
    ) as hybrid_customer_ids
FROM customer_analysis
WHERE correct_type LIKE 'HYBRID%' OR status LIKE 'ROLE_MISMATCH%';

-- ===============================
-- 3. PROBLEM CUSTOMERS DETAILS
-- ===============================
SELECT
    '=== PROBLEM CUSTOMERS ===' as details_section,
    id,
    current_role,
    correct_type,
    CASE WHEN has_web_auth = 1 THEN 'YES' ELSE 'NO' END as has_web_auth,
    CASE WHEN has_line_account = 1 THEN 'YES' ELSE 'NO' END as has_line_account,
    status,
    CASE
        WHEN correct_type LIKE 'HYBRID%' THEN 'REQUIRES CLEANUP - HAS MULTIPLE IDENTITIES'
        WHEN status LIKE 'ROLE_MISMATCH%' THEN 'ROLE FIX NEEDED'
        ELSE 'UNKNOWN ISSUE'
    END as recommended_action
FROM customer_analysis
WHERE correct_type LIKE 'HYBRID%' OR status LIKE 'ROLE_MISMATCH%'
ORDER BY id;
