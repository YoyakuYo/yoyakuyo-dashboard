-- ============================================================================
-- VERIFY CUSTOMER TABLES - Complete Customer Database Schema Check
-- ============================================================================
-- This script verifies all customer-related tables and their structure
-- ============================================================================

-- 1. List all customer-related tables
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%customer%' 
    OR table_name = 'customers'
    OR table_name LIKE '%profile%'
    OR table_name = 'bookings'
    OR table_name = 'notifications'
    OR table_name = 'customer_favorites'
    OR table_name = 'customer_chat_sessions'
    OR table_name = 'customer_chat_messages'
    OR table_name = 'customer_ai_messages'
  )
ORDER BY table_name;

-- 2. Get detailed structure of customers table (auth table)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- 3. Get detailed structure of customer_profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customer_profiles'
ORDER BY ordinal_position;

-- 4. Get detailed structure of customer_favorites table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customer_favorites'
ORDER BY ordinal_position;

-- 5. Get detailed structure of customer_chat_sessions table (if exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customer_chat_sessions'
ORDER BY ordinal_position;

-- 6. Get detailed structure of customer_chat_messages table (if exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customer_chat_messages'
ORDER BY ordinal_position;

-- 7. Get detailed structure of customer_ai_messages table (if exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customer_ai_messages'
ORDER BY ordinal_position;

-- 8. Check bookings table for customer-related columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND (
    column_name LIKE '%customer%'
    OR column_name LIKE '%profile%'
  )
ORDER BY ordinal_position;

-- 9. Check notifications table structure (for customer notifications)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notifications'
ORDER BY ordinal_position;

-- 10. Get foreign key relationships for customer tables
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (
    tc.table_name LIKE '%customer%'
    OR tc.table_name = 'bookings'
    OR tc.table_name = 'notifications'
  )
ORDER BY tc.table_name, kcu.column_name;

-- 11. Get indexes on customer tables
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename LIKE '%customer%'
    OR tablename = 'bookings'
    OR tablename = 'notifications'
  )
ORDER BY tablename, indexname;

-- 12. Count records in customer tables
SELECT 
    'customers' AS table_name,
    COUNT(*) AS record_count
FROM customers
UNION ALL
SELECT 
    'customer_profiles' AS table_name,
    COUNT(*) AS record_count
FROM customer_profiles
UNION ALL
SELECT 
    'customer_favorites' AS table_name,
    COUNT(*) AS record_count
FROM customer_favorites
UNION ALL
SELECT 
    'bookings (with customer_profile_id)' AS table_name,
    COUNT(*) AS record_count
FROM bookings
WHERE customer_profile_id IS NOT NULL
UNION ALL
SELECT 
    'bookings (with customer_id)' AS table_name,
    COUNT(*) AS record_count
FROM bookings
WHERE customer_id IS NOT NULL
UNION ALL
SELECT 
    'notifications (customer type)' AS table_name,
    COUNT(*) AS record_count
FROM notifications
WHERE recipient_type = 'customer';

-- 13. Sample data from customers table (first 5 records)
SELECT 
    id,
    email,
    name,
    created_at
FROM customers
ORDER BY created_at DESC
LIMIT 5;

-- 14. Sample data from customer_profiles (first 5 records)
SELECT 
    id,
    name,
    email,
    customer_auth_id,
    phone,
    created_at
FROM customer_profiles
ORDER BY created_at DESC
LIMIT 5;

-- 15. Check for customer_profile_id column in bookings
SELECT 
    COUNT(*) AS total_bookings,
    COUNT(customer_profile_id) AS bookings_with_profile_id,
    COUNT(customer_id) AS bookings_with_customer_id,
    COUNT(*) FILTER (WHERE customer_profile_id IS NULL AND customer_id IS NULL) AS bookings_without_customer_link
FROM bookings;

-- 16. Verify customer_booking_history view exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'customer_booking_history';

-- 17. Get customer_booking_history view definition (if exists)
SELECT 
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'customer_booking_history';

-- 18. Verify customer_auth_id linkage between customers and customer_profiles
SELECT 
    cp.id AS profile_id,
    cp.name AS profile_name,
    cp.email AS profile_email,
    cp.customer_auth_id,
    c.id AS customer_id,
    c.email AS customer_email,
    CASE 
        WHEN cp.customer_auth_id = c.id THEN '✅ Linked'
        ELSE '❌ Not Linked'
    END AS linkage_status
FROM customer_profiles cp
LEFT JOIN customers c ON cp.customer_auth_id = c.id
ORDER BY cp.created_at DESC
LIMIT 10;

