-- ============================================
-- DELETE MISCLASSIFIED WEB CUSTOMER ACCOUNT COMPLETELY
-- ============================================
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5
-- This customer was incorrectly classified as 'web' but is actually a LINE customer
-- Based on user request, delete this account completely instead of reclassifying
-- ============================================

-- STEP 1: Check current state before deletion
DO $$
DECLARE
    customer_exists BOOLEAN;
    booking_count INTEGER;
    review_count INTEGER;
    thread_count INTEGER;
    message_count INTEGER;
BEGIN
    -- Check if customer exists
    SELECT EXISTS(SELECT 1 FROM customers WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5') INTO customer_exists;

    IF NOT customer_exists THEN
        RAISE NOTICE 'Customer 78fea290-ef9a-43c8-96d6-90460c04efe5 does not exist. Deletion already completed.';
        RETURN;
    END IF;

    -- Count related records
    SELECT COUNT(*) INTO booking_count FROM bookings WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';
    SELECT COUNT(*) INTO review_count FROM reviews WHERE user_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';
    SELECT COUNT(*) INTO thread_count FROM threads WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';
    SELECT COUNT(*) INTO message_count FROM messages WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

    RAISE NOTICE 'Customer 78fea290-ef9a-43c8-96d6-90460c04efe5 has:';
    RAISE NOTICE '  - % bookings', booking_count;
    RAISE NOTICE '  - % reviews', review_count;
    RAISE NOTICE '  - % threads', thread_count;
    RAISE NOTICE '  - % messages', message_count;
END $$;

-- STEP 2: Delete all related data in correct order (respecting foreign keys)

-- Delete messages (no foreign key constraints to worry about)
DELETE FROM messages
WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Delete threads
DELETE FROM threads
WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Delete reviews
DELETE FROM reviews
WHERE user_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Delete bookings (this will cascade to related tables)
DELETE FROM bookings
WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Delete from line_accounts (if exists)
DELETE FROM line_accounts
WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Delete from customer_profiles (if exists)
DELETE FROM customer_profiles
WHERE customer_auth_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Delete from users table (if exists)
DELETE FROM users
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Delete the customer record itself
DELETE FROM customers
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Delete from auth.users (if exists and not referenced elsewhere)
-- CAUTION: Only delete if no other references exist
DELETE FROM auth.users
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  AND NOT EXISTS (SELECT 1 FROM customers WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5')
  AND NOT EXISTS (SELECT 1 FROM bookings WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5')
  AND NOT EXISTS (SELECT 1 FROM reviews WHERE user_id = '78fea290-ef9a-43c8-96d6-90460c04efe5');

-- STEP 3: Verification - ensure complete deletion
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM (
        SELECT 1 FROM customers WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
        UNION ALL
        SELECT 1 FROM bookings WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
        UNION ALL
        SELECT 1 FROM reviews WHERE user_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
        UNION ALL
        SELECT 1 FROM threads WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
        UNION ALL
        SELECT 1 FROM messages WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
        UNION ALL
        SELECT 1 FROM line_accounts WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
        UNION ALL
        SELECT 1 FROM customer_profiles WHERE customer_auth_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
        UNION ALL
        SELECT 1 FROM users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
    ) AS remaining;

    IF remaining_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: Customer 78fea290-ef9a-43c8-96d6-90460c04efe5 and all related data completely deleted.';
    ELSE
        RAISE EXCEPTION '❌ FAILURE: % related records still exist for customer 78fea290-ef9a-43c8-96d6-90460c04efe5', remaining_count;
    END IF;
END $$;

-- ============================================
-- COMPLETION NOTICE
-- ============================================
-- The misclassified web customer account has been completely removed:
-- - Customer record deleted
-- - All bookings deleted
-- - All reviews deleted
-- - All threads and messages deleted
-- - Auth user entry cleaned up (if safe to do so)
-- - Related profile data removed
--
-- This resolves the data inconsistency where a LINE customer
-- was incorrectly appearing as a WEB customer.
-- ============================================