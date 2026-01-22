-- ============================================
-- QUICK CHECK: Why LINE bookings aren't showing
-- ============================================

-- 1. Count booking-related tables
SELECT 
    'Total booking-related tables' as check_type,
    COUNT(*) as result
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (table_name LIKE '%booking%' OR table_name LIKE '%line%' OR table_name LIKE '%user%' OR table_name LIKE '%guest%');

-- 2. List all booking-related tables
SELECT 
    'Booking-related tables' as check_type,
    string_agg(table_name, ', ') as result
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (table_name LIKE '%booking%' OR table_name LIKE '%line%' OR table_name LIKE '%user%' OR table_name LIKE '%guest%');

-- 3. Recent LINE bookings status
SELECT 
    booking_type,
    COUNT(*) as total,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as has_user_id,
    COUNT(CASE WHEN line_user_id IS NOT NULL THEN 1 END) as has_line_user_id,
    COUNT(CASE WHEN booking_type = 'line' AND user_id IS NOT NULL AND line_user_id IS NOT NULL THEN 1 END) as valid_line_bookings
FROM bookings
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY booking_type;

-- 4. Check specific LINE user (replace with your line_user_id)
-- Example: 'Uf5741397f874c9a5822578e506f0cb47'
SELECT 
    b.id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.customer_name,
    b.created_at,
    CASE 
        WHEN b.booking_type = 'line' AND b.line_user_id IS NOT NULL AND b.user_id IS NOT NULL THEN '✅ VALID'
        ELSE '❌ INVALID'
    END as status
FROM bookings b
WHERE b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'  -- REPLACE WITH YOUR LINE_USER_ID
ORDER BY b.created_at DESC
LIMIT 10;

-- 5. Check user_identities mapping
SELECT 
    ui.provider_user_id as line_user_id,
    ui.user_id as canonical_user_id,
    COUNT(b.id) as booking_count
FROM user_identities ui
LEFT JOIN bookings b ON b.user_id = ui.user_id AND b.booking_type = 'line'
WHERE ui.provider = 'line'
GROUP BY ui.provider_user_id, ui.user_id
ORDER BY booking_count DESC;

