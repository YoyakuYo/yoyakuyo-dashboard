-- ============================================
-- DIRECT MIGRATION EXECUTION
-- ============================================
-- Run this SQL directly in your database to execute the migration
-- Copy and paste the entire migration content below into your SQL editor

DO $$
DECLARE
    guest_customer_id uuid;
    web_customer_record record;
    total_web_customers integer := 0;
    total_bookings_reassigned integer := 0;
    total_messages_reassigned integer := 0;
    total_threads_reassigned integer := 0;
    total_reviews_reassigned integer := 0;
    orphaned_reviews_fixed integer := 0;
BEGIN
    RAISE NOTICE 'Starting web customer to guest conversion...';

    -- STEP 1: Get existing guest customer account (use yoyakuyodemo@gmail.com as primary)
    SELECT id INTO guest_customer_id
    FROM customers
    WHERE role = 'guest' AND email = 'yoyakuyodemo@gmail.com'
    LIMIT 1;

    IF guest_customer_id IS NULL THEN
        -- Fallback: use any existing guest customer
        SELECT id INTO guest_customer_id
        FROM customers
        WHERE role = 'guest'
        LIMIT 1;

        IF guest_customer_id IS NULL THEN
            -- Create a new guest customer account if none exist
            INSERT INTO customers (role, email, name)
            VALUES ('guest', 'guest@yoyaku-yo.com', 'Guest User')
            RETURNING id INTO guest_customer_id;

            RAISE NOTICE 'Created new guest customer account with ID: %', guest_customer_id;
        ELSE
            RAISE NOTICE 'Using existing guest customer account with ID: %', guest_customer_id;
        END IF;
    ELSE
        RAISE NOTICE 'Using primary guest customer account (yoyakuyodemo@gmail.com) with ID: %', guest_customer_id;
    END IF;

    -- STEP 2: Get all web customers and process them
    FOR web_customer_record IN
        SELECT id, email, name, created_at, auth_user_id
        FROM customers
        WHERE role = 'web'
        ORDER BY created_at DESC
    LOOP
        total_web_customers := total_web_customers + 1;
        RAISE NOTICE 'Processing web customer %: % (%)', total_web_customers, web_customer_record.id, COALESCE(web_customer_record.name, 'No name');

        -- Reassign bookings
        UPDATE bookings
        SET customer_id = guest_customer_id
        WHERE customer_id = web_customer_record.id;

        GET DIAGNOSTICS total_bookings_reassigned = ROW_COUNT;
        RAISE NOTICE '  Reassigned % bookings', total_bookings_reassigned;

        -- Update conversations from web to guest type
        UPDATE conversations
        SET customer_type = 'guest',
            customer_ref = 'converted_web_customer_' || web_customer_record.id::text
        WHERE customer_type = 'web' AND customer_ref = web_customer_record.auth_user_id::text;

        GET DIAGNOSTICS total_messages_reassigned = ROW_COUNT;
        RAISE NOTICE '  Updated % conversation customer references', total_messages_reassigned;

        -- Reassign threads
        UPDATE shop_threads
        SET customer_id = guest_customer_id
        WHERE customer_id = web_customer_record.id;

        GET DIAGNOSTICS total_threads_reassigned = ROW_COUNT;
        RAISE NOTICE '  Reassigned % threads', total_threads_reassigned;

        -- Reassign reviews
        UPDATE reviews
        SET user_id = guest_customer_id
        WHERE user_id = web_customer_record.id;

        GET DIAGNOSTICS total_reviews_reassigned = ROW_COUNT;
        RAISE NOTICE '  Reassigned % reviews', total_reviews_reassigned;

        -- Also handle any orphaned reviews (reviews pointing to deleted customers)
        -- These might be from previously deleted web customers
        UPDATE reviews
        SET user_id = guest_customer_id
        WHERE user_id NOT IN (SELECT id FROM customers);

        GET DIAGNOSTICS orphaned_reviews_fixed = ROW_COUNT;
        IF orphaned_reviews_fixed > 0 THEN
            RAISE NOTICE '  Fixed % orphaned reviews', orphaned_reviews_fixed;
        END IF;

        -- Delete related data in correct order
        -- Delete from customer_profiles if exists
        DELETE FROM customer_profiles WHERE customer_auth_id = web_customer_record.id;

        -- Delete from line_accounts if exists (shouldn't exist for web customers, but just in case)
        DELETE FROM line_accounts WHERE customer_id = web_customer_record.id;

        -- Delete from users table if exists
        DELETE FROM users WHERE id = web_customer_record.id;

        -- Delete the customer record
        DELETE FROM customers WHERE id = web_customer_record.id;

        -- Try to delete from auth.users (this might fail if referenced elsewhere)
        BEGIN
            DELETE FROM auth.users WHERE id = web_customer_record.id;
            RAISE NOTICE '  Deleted auth user record';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '  Could not delete auth user (might have dependencies): %', SQLERRM;
        END;

    END LOOP;

    -- STEP 3: Final verification
    RAISE NOTICE 'Conversion completed!';
    RAISE NOTICE 'Total web customers processed: %', total_web_customers;
    RAISE NOTICE 'Total bookings reassigned: %', total_bookings_reassigned;
    RAISE NOTICE 'Total messages reassigned: %', total_messages_reassigned;
    RAISE NOTICE 'Total threads reassigned: %', total_threads_reassigned;
    RAISE NOTICE 'Total reviews reassigned: %', total_reviews_reassigned;
    RAISE NOTICE 'Orphaned reviews fixed: %', orphaned_reviews_fixed;

    -- Verify no web customers remain
    IF EXISTS (SELECT 1 FROM customers WHERE role = 'web') THEN
        RAISE EXCEPTION 'ERROR: Some web customers still exist after conversion!';
    ELSE
        RAISE NOTICE '✅ SUCCESS: All web customers have been converted to guest';
    END IF;

    -- Verify guest customer exists
    IF NOT EXISTS (SELECT 1 FROM customers WHERE role = 'guest') THEN
        RAISE EXCEPTION 'ERROR: No guest customer exists after conversion!';
    ELSE
        RAISE NOTICE '✅ SUCCESS: Guest customer account exists';
    END IF;

END $$;

-- ============================================
-- VERIFICATION QUERIES (run these after the migration)
-- ============================================

-- Check remaining customers by role
SELECT
    role,
    COUNT(*) as count
FROM customers
GROUP BY role
ORDER BY role;

-- Verify all bookings have valid customers
SELECT
    'BOOKINGS VERIFICATION' as check_type,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN c.role IS NULL THEN 1 END) as orphaned_bookings
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id;

-- Verify all conversations have valid customer references
SELECT
    'CONVERSATIONS VERIFICATION' as check_type,
    COUNT(*) as total_conversations,
    COUNT(CASE WHEN conv.customer_type = 'web' AND c.role IS NULL THEN 1 END) as orphaned_web_conversations,
    COUNT(CASE WHEN conv.customer_type = 'guest' THEN 1 END) as guest_conversations
FROM conversations conv
LEFT JOIN customers c ON (
    CASE
        WHEN conv.customer_type = 'web' THEN conv.customer_ref = c.auth_user_id::text
        WHEN conv.customer_type = 'line' THEN conv.customer_ref = c.line_user_id
        ELSE false
    END
);

-- Verify all threads have valid customers
SELECT
    'THREADS VERIFICATION' as check_type,
    COUNT(*) as total_threads,
    COUNT(CASE WHEN c.role IS NULL THEN 1 END) as orphaned_threads
FROM shop_threads t
LEFT JOIN customers c ON t.customer_id = c.id;

-- Verify all reviews have valid customers
SELECT
    'REVIEWS VERIFICATION' as check_type,
    COUNT(*) as total_reviews,
    COUNT(CASE WHEN c.role IS NULL THEN 1 END) as orphaned_reviews
FROM reviews r
LEFT JOIN customers c ON r.user_id = c.id;