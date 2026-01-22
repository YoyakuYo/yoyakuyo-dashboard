-- ============================================
-- FINAL WEB CUSTOMER CLEANUP SUMMARY
-- ============================================
-- This script provides a complete overview and cleanup plan

-- 1. CURRENT STATE ANALYSIS
SELECT 'CURRENT STATE' as analysis_type, * FROM (
    SELECT
        'Web Customers' as category,
        COUNT(*) as count
    FROM customers WHERE role = 'web'
    UNION ALL
    SELECT
        'Guest Customers' as category,
        COUNT(*) as count
    FROM customers WHERE role = 'guest'
    UNION ALL
    SELECT
        'Total Customers' as category,
        COUNT(*) as count
    FROM customers
) as state_analysis;

-- 2. DATA IMPACT ANALYSIS
SELECT 'DATA IMPACT' as analysis_type, * FROM (
    SELECT
        'Web Customer Bookings' as data_type,
        COUNT(*) as total_records,
        COUNT(DISTINCT b.customer_id) as affected_customers
    FROM customers c
    JOIN bookings b ON b.customer_id = c.id
    WHERE c.role = 'web'
    UNION ALL
    SELECT
        'Web Customer Messages' as data_type,
        COUNT(*) as total_records,
        COUNT(DISTINCT c.id) as affected_customers
    FROM customers c
    LEFT JOIN conversations conv ON conv.customer_type = 'web' AND conv.customer_ref = c.auth_user_id::text
    LEFT JOIN messages m ON m.conversation_id = conv.id
    WHERE c.role = 'web'
    UNION ALL
    SELECT
        'Web Customer Threads' as data_type,
        COUNT(*) as total_records,
        COUNT(DISTINCT t.customer_id) as affected_customers
    FROM customers c
    JOIN shop_threads t ON t.customer_id = c.id
    WHERE c.role = 'web'
    UNION ALL
    SELECT
        'Web Customer Reviews' as data_type,
        COUNT(*) as total_records,
        COUNT(DISTINCT r.user_id) as affected_customers
    FROM customers c
    JOIN reviews r ON r.user_id = c.id
    WHERE c.role = 'web'
) as impact_analysis;

-- 3. TARGET GUEST CUSTOMER
SELECT
    'TARGET GUEST CUSTOMER' as info_type,
    c.id,
    c.email,
    c.name,
    c.created_at,
    (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) as current_bookings,
    (SELECT COUNT(*) FROM conversations conv LEFT JOIN messages m ON m.conversation_id = conv.id WHERE conv.customer_type = 'guest' AND conv.customer_ref::uuid = c.id) as current_messages
FROM customers c
WHERE c.role = 'guest' AND c.email = 'yoyakuyodemo@gmail.com'
ORDER BY c.created_at DESC
LIMIT 1;

-- ============================================
-- CLEANUP PLAN SUMMARY
-- ============================================
/*
CONVERSION PLAN:
1. Use existing guest customer: yoyakuyodemo@gmail.com (ID from query above)
2. Reassign all web customer bookings to this guest account
3. Convert web customer conversations to guest type
4. Reassign web customer threads and reviews to guest account
5. Delete all web customer accounts and auth records
6. Web customers become guests - no more authentication required

IMPACT:
- All web customer data preserved under guest account
- No more web customer login/signup functionality
- Simplified customer model: Guest + Owner only
- Existing guest accounts remain (can be cleaned up separately if needed)

EXECUTION:
Run: npm run migrate:auto
Or: node convert_web_customers_to_guest.js
*/