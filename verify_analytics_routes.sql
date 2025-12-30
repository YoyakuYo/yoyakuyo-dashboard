-- SQL query to verify analytics-related database objects exist
-- This is NOT the issue (404 is a routing problem, not database)
-- But included per user request to verify SQL if needed

-- Check if analytics functions exist
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines
WHERE routine_name IN (
    'get_shop_revenue_analytics',
    'get_booking_analytics_by_date',
    'get_shop_performance_metrics'
)
ORDER BY routine_name;

-- Check if analytics views exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name LIKE '%analytics%'
ORDER BY table_name;

-- Check if required tables exist for analytics
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('bookings', 'payments', 'reviews', 'shops', 'customers') 
        THEN '✅ Required table exists'
        ELSE '❌ Missing table'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('bookings', 'payments', 'reviews', 'shops', 'customers')
ORDER BY table_name;

-- Summary
SELECT 
    'Analytics Functions' as category,
    COUNT(*) as count
FROM information_schema.routines
WHERE routine_name IN (
    'get_shop_revenue_analytics',
    'get_booking_analytics_by_date',
    'get_shop_performance_metrics'
)
UNION ALL
SELECT 
    'Analytics Views' as category,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name LIKE '%analytics%'
UNION ALL
SELECT 
    'Required Tables' as category,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('bookings', 'payments', 'reviews', 'shops', 'customers');

