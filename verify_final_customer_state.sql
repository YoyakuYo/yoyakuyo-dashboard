-- ============================================
-- VERIFY FINAL CUSTOMER STATE: GUEST + LINE ONLY
-- ============================================

-- 1. Check customer roles distribution
SELECT
    'CUSTOMER ROLES DISTRIBUTION' as check_type,
    role,
    COUNT(*) as count,
    CASE
        WHEN role = 'guest' THEN '✅ ALLOWED: Guest customers'
        WHEN role = 'line' THEN '✅ ALLOWED: LINE customers'
        WHEN role = 'web' THEN '❌ ERROR: Web customers should not exist'
        WHEN role = 'owner' THEN '✅ ALLOWED: Owner accounts'
        ELSE '❓ UNKNOWN: Unexpected role'
    END as status
FROM customers
GROUP BY role
ORDER BY role;

-- 2. Verify all bookings belong to valid customers (guest or line)
SELECT
    'BOOKINGS VALIDATION' as check_type,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN c.role IN ('guest', 'line') THEN 1 END) as valid_bookings,
    COUNT(CASE WHEN c.role NOT IN ('guest', 'line') THEN 1 END) as invalid_bookings,
    CASE WHEN COUNT(CASE WHEN c.role NOT IN ('guest', 'line') THEN 1 END) = 0
         THEN '✅ SUCCESS: All bookings belong to guest/line customers'
         ELSE '❌ ERROR: Some bookings belong to invalid customer types'
    END as status
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id;

-- 3. Check LINE customers are intact
SELECT
    'LINE CUSTOMERS VERIFICATION' as check_type,
    COUNT(*) as line_customers_count,
    COUNT(CASE WHEN line_user_id IS NOT NULL THEN 1 END) as with_line_user_id,
    COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as with_auth_user_id,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email
FROM customers
WHERE role = 'line';

-- 4. Check GUEST customers
SELECT
    'GUEST CUSTOMERS VERIFICATION' as check_type,
    COUNT(*) as guest_customers_count,
    STRING_AGG(email, ', ') as guest_emails,
    COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as with_auth_user_id,
    COUNT(CASE WHEN line_user_id IS NOT NULL THEN 1 END) as with_line_user_id
FROM customers
WHERE role = 'guest';

-- 5. Detailed booking sources by customer type
SELECT
    'BOOKING SOURCES BY CUSTOMER TYPE' as check_type,
    c.role as customer_role,
    b.source as booking_source,
    COUNT(*) as booking_count
FROM bookings b
JOIN customers c ON b.customer_id = c.id
GROUP BY c.role, b.source
ORDER BY c.role, b.source;

-- 6. Final comprehensive check
SELECT
    'FINAL SYSTEM STATE' as check_type,
    CASE WHEN NOT EXISTS(SELECT 1 FROM customers WHERE role = 'web')
         THEN '✅ Web customers eliminated'
         ELSE '❌ Web customers still exist'
    END as web_customers_status,
    CASE WHEN (SELECT COUNT(*) FROM bookings b LEFT JOIN customers c ON b.customer_id = c.id WHERE c.role NOT IN ('guest', 'line')) = 0
         THEN '✅ All bookings valid'
         ELSE '❌ Invalid customer bookings exist'
    END as bookings_status,
    CASE WHEN EXISTS(SELECT 1 FROM customers WHERE role = 'line')
         THEN '✅ LINE customers preserved'
         ELSE '❓ No LINE customers found'
    END as line_customers_status,
    CASE WHEN EXISTS(SELECT 1 FROM customers WHERE role = 'guest')
         THEN '✅ Guest customer exists'
         ELSE '❌ No guest customer'
    END as guest_customer_status;