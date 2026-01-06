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

-- STEP 2: SUMMARY REPORT
SELECT
    'SUMMARY' as section,
    'CUSTOMER TYPE AUDIT SUMMARY' as report,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN correct_type = 'PURE_WEB' THEN 1 END) as pure_web,
    COUNT(CASE WHEN correct_type = 'PURE_LINE' THEN 1 END) as pure_line,
    COUNT(CASE WHEN correct_type = 'PURE_GUEST' THEN 1 END) as pure_guest,
    COUNT(CASE WHEN correct_type LIKE 'HYBRID%' THEN 1 END) as hybrid_violations,
    COUNT(CASE WHEN status != 'OK' THEN 1 END) as total_issues
FROM customer_analysis

UNION ALL

-- STEP 3: HYBRID VIOLATIONS DETAIL
SELECT
    'VIOLATIONS' as section,
    'HYBRID VIOLATIONS FOUND' as report,
    COUNT(*) as total_customers,
    NULL as pure_web,
    NULL as pure_line,
    NULL as pure_guest,
    COUNT(*) as hybrid_violations,
    COUNT(*) as total_issues
FROM customer_analysis
WHERE correct_type LIKE 'HYBRID%'

UNION ALL

-- STEP 4: ROLE MISMATCHES DETAIL
SELECT
    'VIOLATIONS' as section,
    'ROLE MISMATCHES FOUND' as report,
    COUNT(*) as total_customers,
    NULL as pure_web,
    NULL as pure_line,
    NULL as pure_guest,
    NULL as hybrid_violations,
    COUNT(*) as total_issues
FROM customer_analysis
WHERE status LIKE 'ROLE_MISMATCH%'

UNION ALL

-- STEP 5: SPECIFIC HYBRID CUSTOMERS
SELECT
    'DETAILS' as section,
    'PROBLEM CUSTOMER' as report,
    id::text as total_customers,
    current_role as pure_web,
    correct_type as pure_line,
    has_web_auth::text as pure_guest,
    has_line_account::text as hybrid_violations,
    status as total_issues
FROM customer_analysis
WHERE correct_type LIKE 'HYBRID%'
ORDER BY section, report;
