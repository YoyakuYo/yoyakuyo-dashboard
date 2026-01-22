-- Debug analytics issues
-- Check if environment variables are set and database state

-- 1. Check if analytics functions exist
SELECT
    routine_name,
    routine_type
FROM
    information_schema.routines
WHERE
    routine_schema = 'public'
    AND routine_name LIKE 'get_%';

-- 2. Check indexes on key tables
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND (
        tablename IN ('shops', 'bookings', 'services', 'customers')
        OR indexname LIKE '%booking%'
        OR indexname LIKE '%shop%'
        OR indexname LIKE '%service%'
    )
ORDER BY tablename, indexname;

-- 3. Check shops table data
SELECT
    COUNT(*) as total_shops,
    COUNT(CASE WHEN owner_user_id IS NOT NULL THEN 1 END) as shops_with_owners,
    COUNT(CASE WHEN owner_user_id IS NULL THEN 1 END) as shops_without_owners
FROM shops;

-- 4. Check recent bookings
SELECT
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as bookings_with_customers,
    COUNT(CASE WHEN shop_id IS NOT NULL THEN 1 END) as bookings_with_shops,
    COUNT(CASE WHEN service_id IS NOT NULL THEN 1 END) as bookings_with_services
FROM bookings;

-- 5. Check services table
SELECT
    COUNT(*) as total_services,
    COUNT(CASE WHEN shop_id IS NOT NULL THEN 1 END) as services_with_shops,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_services
FROM services;

-- 6. Sample data to check relationships
SELECT
    s.id as shop_id,
    s.name as shop_name,
    s.owner_user_id,
    COUNT(b.id) as booking_count,
    COUNT(DISTINCT b.customer_id) as unique_customers,
    COUNT(DISTINCT b.service_id) as unique_services
FROM shops s
LEFT JOIN bookings b ON s.id = b.shop_id
GROUP BY s.id, s.name, s.owner_user_id
ORDER BY booking_count DESC
LIMIT 5;
