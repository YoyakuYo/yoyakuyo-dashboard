-- ============================================
-- CUSTOMER TYPE VIOLATION FIXER
-- STRICT SEPARATION: Web | LINE | Guest (no hybrids)
-- ============================================

-- STEP 1: BACKUP ALL CUSTOMERS (safety first)
CREATE TABLE IF NOT EXISTS customers_backup_pre_cleanup AS
SELECT * FROM customers;

CREATE TABLE IF NOT EXISTS auth_users_backup_pre_cleanup AS
SELECT * FROM auth.users;

CREATE TABLE IF NOT EXISTS line_accounts_backup_pre_cleanup AS
SELECT * FROM line_accounts;

-- STEP 2: IDENTIFY VIOLATIONS
CREATE TEMP TABLE customer_violations AS
WITH analysis AS (
    SELECT
        c.id,
        c.role as current_role,
        CASE WHEN au.id IS NOT NULL THEN 1 ELSE 0 END as has_web_auth,
        CASE WHEN la.customer_id IS NOT NULL THEN 1 ELSE 0 END as has_line_account,

        CASE
            WHEN au.id IS NOT NULL AND la.customer_id IS NULL THEN 'WEB_ONLY'
            WHEN au.id IS NULL AND la.customer_id IS NOT NULL THEN 'LINE_ONLY'
            WHEN au.id IS NULL AND la.customer_id IS NULL THEN 'GUEST_ONLY'
            ELSE 'HYBRID_VIOLATION'
        END as actual_type,

        CASE
            WHEN au.id IS NOT NULL AND la.customer_id IS NULL THEN 'web'
            WHEN au.id IS NULL AND la.customer_id IS NOT NULL THEN 'line'
            WHEN au.id IS NULL AND la.customer_id IS NULL THEN 'guest'
            ELSE 'NEEDS_CLEANUP'
        END as correct_role

    FROM customers c
    LEFT JOIN auth.users au ON au.id = c.id
    LEFT JOIN line_accounts la ON la.customer_id = c.id
)
SELECT * FROM analysis WHERE actual_type = 'HYBRID_VIOLATION' OR current_role != correct_role;

-- STEP 3: REPORT VIOLATIONS
SELECT
    'VIOLATION REPORT' as report,
    COUNT(*) as total_violations,
    COUNT(CASE WHEN actual_type = 'HYBRID_VIOLATION' THEN 1 END) as hybrid_violations,
    COUNT(CASE WHEN current_role != correct_role THEN 1 END) as role_mismatches
FROM customer_violations;

-- Show specific violations
SELECT
    'PROBLEM CUSTOMERS' as report,
    id,
    current_role,
    actual_type,
    correct_role,
    'NEEDS FIXING' as action
FROM customer_violations
ORDER BY id;

-- STEP 4: CLEANUP HYBRID VIOLATIONS
-- COMMENT OUT THIS SECTION UNTIL YOU VERIFY THE REPORT ABOVE IS CORRECT!

/*
-- For hybrid customers, we need to decide which identity to keep
-- This is DANGEROUS - only run after careful review!

-- OPTION A: Keep LINE, remove WEB (for customers who should be LINE-only)
UPDATE customers
SET role = 'line'
WHERE id IN (
    SELECT id FROM customer_violations
    WHERE actual_type = 'HYBRID_VIOLATION'
    AND has_line_account = 1
    -- Add specific customer IDs here if you only want to fix certain ones
    -- AND id IN ('78fea290-ef9a-43c8-96d6-90460c04efe5')
);

-- Remove web auth for LINE customers
DELETE FROM auth.users
WHERE id IN (
    SELECT id FROM customer_violations
    WHERE actual_type = 'HYBRID_VIOLATION'
    AND has_line_account = 1
);

-- OPTION B: Keep WEB, remove LINE (for customers who should be web-only)
-- Only run this if you decide some hybrids should be web-only instead

DELETE FROM line_accounts
WHERE customer_id IN (
    SELECT id FROM customer_violations
    WHERE actual_type = 'HYBRID_VIOLATION'
    AND has_web_auth = 1
    -- Add specific customer IDs here
    -- AND customer_id IN ('some-web-customer-id')
);
*/

-- STEP 5: FIX ROLE MISMATCHES (safe)
UPDATE customers
SET role = cv.correct_role
FROM customer_violations cv
WHERE customers.id = cv.id
AND cv.correct_role != 'NEEDS_CLEANUP';

-- STEP 6: VERIFICATION
SELECT
    'POST-CLEANUP VERIFICATION' as report,
    COUNT(*) as total_customers_checked,
    COUNT(CASE WHEN
        (au.id IS NOT NULL AND la.customer_id IS NULL AND c.role = 'web') OR
        (au.id IS NULL AND la.customer_id IS NOT NULL AND c.role = 'line') OR
        (au.id IS NULL AND la.customer_id IS NULL AND c.role = 'guest')
    THEN 1 END) as correctly_typed,
    COUNT(CASE WHEN
        (au.id IS NOT NULL AND la.customer_id IS NOT NULL) OR
        (au.id IS NOT NULL AND c.role = 'guest') OR
        (la.customer_id IS NOT NULL AND c.role = 'guest')
    THEN 1 END) as still_hybrid
FROM customers c
LEFT JOIN auth.users au ON au.id = c.id
LEFT JOIN line_accounts la ON la.customer_id = c.id;

-- STEP 7: CLEANUP TEMP TABLES
DROP TABLE IF EXISTS customer_violations;

-- EMERGENCY RESTORE (uncomment if needed):
-- TRUNCATE TABLE customers; INSERT INTO customers SELECT * FROM customers_backup_pre_cleanup;
-- TRUNCATE TABLE auth.users; INSERT INTO auth.users SELECT * FROM auth_users_backup_pre_cleanup;
-- TRUNCATE TABLE line_accounts; INSERT INTO line_accounts SELECT * FROM line_accounts_backup_pre_cleanup;
