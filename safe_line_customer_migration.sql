-- ============================================
-- SAFE LINE CUSTOMER MIGRATION
-- Includes verification, backup, and rollback capabilities
-- ============================================

-- STEP 1: CREATE BACKUP (for rollback if needed)
CREATE TABLE IF NOT EXISTS customers_backup_pre_line_migration AS
SELECT * FROM customers WHERE id IN (
    SELECT customer_id FROM line_accounts
);

-- STEP 2: VERIFY CURRENT STATE
DO $$
DECLARE
    constraint_exists BOOLEAN;
    line_accounts_count INTEGER;
    affected_customers_count INTEGER;
BEGIN
    -- Check if constraint exists
    SELECT EXISTS(
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customer_single_identity'
        AND conrelid = 'public.customers'::regclass
    ) INTO constraint_exists;

    -- Count LINE accounts
    SELECT COUNT(*) INTO line_accounts_count FROM line_accounts;

    -- Count affected customers
    SELECT COUNT(DISTINCT c.id) INTO affected_customers_count
    FROM customers c
    INNER JOIN line_accounts la ON c.id = la.customer_id;

    RAISE NOTICE 'Migration Safety Check:';
    RAISE NOTICE '  Constraint exists: %', constraint_exists;
    RAISE NOTICE '  LINE accounts: %', line_accounts_count;
    RAISE NOTICE '  Affected customers: %', affected_customers_count;

    IF line_accounts_count = 0 THEN
        RAISE EXCEPTION 'No LINE accounts found - migration not needed';
    END IF;
END $$;

-- STEP 3: DROP PROBLEMATIC CONSTRAINT (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customer_single_identity'
        AND conrelid = 'public.customers'::regclass
    ) THEN
        ALTER TABLE public.customers DROP CONSTRAINT customer_single_identity;
        RAISE NOTICE '✓ Dropped customer_single_identity constraint';
    ELSE
        RAISE NOTICE '✓ No customer_single_identity constraint found (already removed or never existed)';
    END IF;
END $$;

-- STEP 4: SAFE DATA MIGRATION
-- Only update line_user_id, don't change roles unless safe to do so

-- Update 1: Set line_user_id for customers that have LINE accounts but missing line_user_id
UPDATE customers
SET line_user_id = la.line_user_id
FROM line_accounts la
WHERE customers.id = la.customer_id
AND customers.line_user_id IS NULL;

-- Get count of updates
DO $$
DECLARE
    line_user_id_updates INTEGER;
BEGIN
    GET DIAGNOSTICS line_user_id_updates = ROW_COUNT;
    RAISE NOTICE '✓ Set line_user_id for % customers', line_user_id_updates;
END $$;

-- Update 2: Change role to 'line' ONLY for pure LINE customers (no web auth)
UPDATE customers
SET role = 'line'
FROM line_accounts la
WHERE customers.id = la.customer_id
AND customers.role != 'line'
AND NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = customers.id
);

-- Get count of role updates
DO $$
DECLARE
    role_updates INTEGER;
BEGIN
    GET DIAGNOSTICS role_updates = ROW_COUNT;
    RAISE NOTICE '✓ Changed role to line for % pure LINE customers', role_updates;
END $$;

-- STEP 5: VERIFICATION
DO $$
DECLARE
    total_line_customers INTEGER;
    customers_with_line_id INTEGER;
    customers_with_line_role INTEGER;
BEGIN
    SELECT COUNT(DISTINCT c.id) INTO total_line_customers
    FROM customers c
    INNER JOIN line_accounts la ON c.id = la.customer_id;

    SELECT COUNT(*) INTO customers_with_line_id
    FROM customers c
    WHERE c.line_user_id IS NOT NULL;

    SELECT COUNT(*) INTO customers_with_line_role
    FROM customers c
    WHERE c.role = 'line';

    RAISE NOTICE 'Migration Results:';
    RAISE NOTICE '  Total customers with LINE accounts: %', total_line_customers;
    RAISE NOTICE '  Customers with line_user_id: %', customers_with_line_id;
    RAISE NOTICE '  Customers with role=line: %', customers_with_line_role;

    -- Success check
    IF total_line_customers = customers_with_line_id THEN
        RAISE NOTICE '✅ SUCCESS: All LINE customers now have line_user_id';
    ELSE
        RAISE WARNING '⚠️  WARNING: Some LINE customers still missing line_user_id';
    END IF;
END $$;

-- STEP 6: CLEANUP (optional - remove after verifying success)
-- DROP TABLE IF EXISTS customers_backup_pre_line_migration;

-- FINAL STATUS
SELECT
    'MIGRATION COMPLETE' as status,
    NOW() as completed_at,
    COUNT(*) as total_line_accounts
FROM line_accounts;
