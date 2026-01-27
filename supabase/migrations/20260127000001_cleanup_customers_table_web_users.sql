-- ====================================================================
-- CLEANUP: Remove web/authenticated users from customers table
-- ====================================================================
-- According to the unified customer architecture:
-- - customers table should ONLY contain: guest and line customers
-- - Web/authenticated customers should NOT be in customers table
-- - They should only exist in auth.users and be referenced by auth_user_id
-- ====================================================================

DO $$
DECLARE
    v_web_customer_count INTEGER;
    v_line_with_auth_count INTEGER;
BEGIN
    RAISE NOTICE '=== CLEANING UP CUSTOMERS TABLE ===';

    -- Count web customers (should be removed)
    SELECT COUNT(*) INTO v_web_customer_count
    FROM customers
    WHERE role = 'web' OR (auth_user_id IS NOT NULL AND line_user_id IS NULL);

    RAISE NOTICE 'Found % web/authenticated customers in customers table (will be removed)', v_web_customer_count;

    -- Count LINE customers with auth_user_id (should have auth_user_id removed)
    SELECT COUNT(*) INTO v_line_with_auth_count
    FROM customers
    WHERE role = 'line' AND auth_user_id IS NOT NULL;

    RAISE NOTICE 'Found % LINE customers with auth_user_id (auth_user_id will be cleared)', v_line_with_auth_count;

    -- Show what will be removed
    RAISE NOTICE 'Customers to be REMOVED (web/auth users):';
    FOR customer_record IN
        SELECT id, role, auth_user_id, line_user_id, email, name
        FROM customers
        WHERE role = 'web' OR (auth_user_id IS NOT NULL AND line_user_id IS NULL)
    LOOP
        RAISE NOTICE '  ID: %, Role: %, Auth: %, Line: %, Email: %, Name: %',
            customer_record.id, customer_record.role, customer_record.auth_user_id,
            customer_record.line_user_id, customer_record.email, customer_record.name;
    END LOOP;

    -- Show LINE customers that will have auth_user_id cleared
    RAISE NOTICE 'LINE customers with auth_user_id to be CLEARED:';
    FOR customer_record IN
        SELECT id, role, auth_user_id, line_user_id, email, name
        FROM customers
        WHERE role = 'line' AND auth_user_id IS NOT NULL
    LOOP
        RAISE NOTICE '  ID: %, Auth: %, Line: %, Email: %, Name: %',
            customer_record.id, customer_record.auth_user_id,
            customer_record.line_user_id, customer_record.email, customer_record.name;
    END LOOP;

    -- Remove web/authenticated customers from customers table
    -- (They should only exist in auth.users)
    DELETE FROM customers
    WHERE role = 'web' OR (auth_user_id IS NOT NULL AND line_user_id IS NULL);

    GET DIAGNOSTICS v_web_customer_count = ROW_COUNT;
    RAISE NOTICE 'Removed % web/authenticated customers from customers table', v_web_customer_count;

    -- Clear auth_user_id from LINE customers
    -- (LINE customers should not have auth_user_id in customers table)
    UPDATE customers
    SET auth_user_id = NULL
    WHERE role = 'line' AND auth_user_id IS NOT NULL;

    GET DIAGNOSTICS v_line_with_auth_count = ROW_COUNT;
    RAISE NOTICE 'Cleared auth_user_id from % LINE customers', v_line_with_auth_count;

    -- Verify the cleanup
    RAISE NOTICE '=== VERIFICATION AFTER CLEANUP ===';

    SELECT COUNT(*) INTO v_web_customer_count
    FROM customers
    WHERE auth_user_id IS NOT NULL;

    IF v_web_customer_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: No authenticated users remain in customers table';
    ELSE
        RAISE NOTICE '❌ WARNING: % authenticated users still in customers table', v_web_customer_count;
    END IF;

    -- Show final customer count by role
    RAISE NOTICE 'Final customer count by role:';
    FOR role_record IN
        SELECT role, COUNT(*) as count
        FROM customers
        GROUP BY role
        ORDER BY role
    LOOP
        RAISE NOTICE '  %: % customers', role_record.role, role_record.count;
    END LOOP;

END $$;

-- Add comment to document the cleanup
COMMENT ON TABLE customers IS 'Unified customers table containing only guest and LINE customers. Web/authenticated users exist only in auth.users and are referenced by auth_user_id in other tables.';