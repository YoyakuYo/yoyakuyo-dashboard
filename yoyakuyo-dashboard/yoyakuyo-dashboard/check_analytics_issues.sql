-- Check analytics issues
-- 1. Check if payments table exists and has foreign key
-- 2. Check if analytics functions exist
-- 3. Test a simple query to see if relationships work

-- Check payments table structure
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name = 'payments' OR ccu.table_name = 'payments')
ORDER BY tc.table_name, tc.constraint_name;

-- Check if analytics functions exist
SELECT
    routine_name,
    routine_type
FROM
    information_schema.routines
WHERE
    routine_name LIKE 'get_shop_%'
    AND routine_schema = 'public';

-- Test simple relationship query
SELECT
    b.id as booking_id,
    b.shop_id,
    b.status as booking_status,
    p.id as payment_id,
    p.status as payment_status,
    p.amount
FROM
    bookings b
LEFT JOIN
    payments p ON b.id = p.booking_id
WHERE
    b.shop_id IS NOT NULL
LIMIT 5;

-- Check recent bookings count
SELECT
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as bookings_with_customer,
    COUNT(CASE WHEN shop_id IS NOT NULL THEN 1 END) as bookings_with_shop
FROM bookings;

-- Check payments count
SELECT
    COUNT(*) as total_payments,
    COUNT(CASE WHEN booking_id IS NOT NULL THEN 1 END) as payments_with_booking
FROM payments;
