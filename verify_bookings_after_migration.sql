-- ============================================
-- VERIFY BOOKINGS TABLE AFTER MIGRATION
-- ============================================

-- 1. Overview of all bookings and their customers
SELECT
    'BOOKINGS OVERVIEW' as analysis,
    COUNT(*) as total_bookings,
    COUNT(DISTINCT b.customer_id) as unique_customers,
    COUNT(DISTINCT b.shop_id) as unique_shops
FROM bookings b;

-- 2. Bookings by customer role
SELECT
    'BOOKINGS BY CUSTOMER ROLE' as analysis,
    c.role as customer_role,
    c.email as customer_email,
    COUNT(*) as booking_count,
    MIN(b.created_at) as first_booking,
    MAX(b.created_at) as latest_booking
FROM bookings b
JOIN customers c ON b.customer_id = c.id
GROUP BY c.role, c.email
ORDER BY c.role, booking_count DESC;

-- 3. Check for orphaned bookings (bookings with invalid customer_id)
SELECT
    'ORPHANED BOOKINGS CHECK' as analysis,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN c.id IS NULL THEN 1 END) as orphaned_bookings,
    CASE WHEN COUNT(CASE WHEN c.id IS NULL THEN 1 END) = 0 THEN '✅ All bookings have valid customers'
         ELSE '❌ Some bookings point to deleted customers' END as status
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id;

-- 4. Detailed view of recent bookings
SELECT
    'RECENT BOOKINGS DETAIL' as analysis,
    b.id as booking_id,
    b.created_at,
    b.status,
    b.source,
    c.role as customer_role,
    c.email as customer_email,
    c.name as customer_name,
    s.name as shop_name
FROM bookings b
JOIN customers c ON b.customer_id = c.id
JOIN shops s ON b.shop_id = s.id
ORDER BY b.created_at DESC
LIMIT 20;

-- 5. Booking sources distribution
SELECT
    'BOOKING SOURCES' as analysis,
    b.source,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM bookings b
GROUP BY b.source
ORDER BY count DESC;

-- 6. Guest customer details
SELECT
    'GUEST CUSTOMER DETAILS' as analysis,
    c.id,
    c.email,
    c.name,
    c.created_at,
    (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) as total_bookings,
    (SELECT COUNT(*) FROM conversations conv WHERE conv.customer_type = 'guest') as total_conversations,
    (SELECT COUNT(*) FROM reviews r WHERE r.user_id = c.id) as total_reviews
FROM customers c
WHERE c.role = 'guest';

-- 7. Check if any web customers still exist
SELECT
    'WEB CUSTOMERS CHECK' as analysis,
    COUNT(*) as web_customers_remaining,
    CASE WHEN COUNT(*) = 0 THEN '✅ No web customers remain'
         ELSE '❌ Web customers still exist - migration incomplete' END as status
FROM customers
WHERE role = 'web';