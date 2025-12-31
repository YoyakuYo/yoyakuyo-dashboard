-- ============================================
-- COMPREHENSIVE LINE BOOKINGS DIAGNOSTIC QUERY
-- ============================================
-- This query helps diagnose why LINE bookings are not appearing

-- ============================================
-- STEP 1: List ALL booking-related tables
-- ============================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (
        table_name LIKE '%booking%' 
        OR table_name LIKE '%line%'
        OR table_name LIKE '%user%'
        OR table_name LIKE '%guest%'
    )
ORDER BY table_name;

-- ============================================
-- STEP 2: Check bookings table structure
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'bookings'
ORDER BY ordinal_position;

-- ============================================
-- STEP 3: Check booking_type distribution
-- ============================================
SELECT 
    booking_type,
    COUNT(*) as count,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as has_user_id,
    COUNT(CASE WHEN line_user_id IS NOT NULL THEN 1 END) as has_line_user_id,
    COUNT(CASE WHEN guest_id IS NOT NULL THEN 1 END) as has_guest_id
FROM bookings
GROUP BY booking_type
ORDER BY booking_type;

-- ============================================
-- STEP 4: Check recent LINE bookings
-- ============================================
SELECT 
    b.id as booking_id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.guest_id,
    b.customer_name,
    b.status,
    b.created_at,
    CASE 
        WHEN b.booking_type = 'line' AND b.line_user_id IS NOT NULL AND b.user_id IS NOT NULL THEN '✅ VALID LINE BOOKING'
        WHEN b.booking_type = 'line' AND b.line_user_id IS NULL THEN '❌ MISSING line_user_id'
        WHEN b.booking_type = 'line' AND b.user_id IS NULL THEN '❌ MISSING user_id'
        WHEN b.booking_type IS NULL THEN '❌ MISSING booking_type'
        ELSE '⚠️ OTHER ISSUE'
    END as validation_status
FROM bookings b
WHERE b.created_at >= NOW() - INTERVAL '7 days'
ORDER BY b.created_at DESC
LIMIT 20;

-- ============================================
-- STEP 5: Check user_identities mapping for LINE users
-- ============================================
SELECT 
    ui.user_id,
    ui.provider,
    ui.provider_user_id as line_user_id,
    COUNT(b.id) as booking_count
FROM user_identities ui
LEFT JOIN bookings b ON b.user_id = ui.user_id AND b.booking_type = 'line'
WHERE ui.provider = 'line'
GROUP BY ui.user_id, ui.provider, ui.provider_user_id
ORDER BY booking_count DESC, ui.provider_user_id;

-- ============================================
-- STEP 6: Find LINE bookings without proper user_id mapping
-- ============================================
SELECT 
    b.id as booking_id,
    b.booking_type,
    b.user_id as booking_user_id,
    b.line_user_id,
    ui.user_id as mapped_user_id,
    CASE 
        WHEN ui.user_id IS NULL THEN '❌ NO USER_IDENTITY MAPPING'
        WHEN b.user_id != ui.user_id THEN '❌ USER_ID MISMATCH'
        ELSE '✅ MAPPED CORRECTLY'
    END as mapping_status
FROM bookings b
LEFT JOIN user_identities ui ON ui.provider = 'line' AND ui.provider_user_id = b.line_user_id
WHERE b.booking_type = 'line'
    AND b.line_user_id IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 20;

-- ============================================
-- STEP 7: Check line_bookings table (legacy table)
-- ============================================
SELECT 
    COUNT(*) as total_line_bookings_records,
    COUNT(DISTINCT booking_id) as unique_bookings,
    COUNT(DISTINCT line_user_id) as unique_line_users
FROM line_bookings;

-- ============================================
-- STEP 8: Compare bookings vs line_bookings
-- ============================================
SELECT 
    'bookings table' as source,
    COUNT(*) as total_count,
    COUNT(CASE WHEN booking_type = 'line' THEN 1 END) as line_bookings,
    COUNT(CASE WHEN line_user_id IS NOT NULL THEN 1 END) as has_line_user_id
FROM bookings
UNION ALL
SELECT 
    'line_bookings table' as source,
    COUNT(*) as total_count,
    NULL as line_bookings,
    COUNT(DISTINCT line_user_id) as has_line_user_id
FROM line_bookings;

-- ============================================
-- STEP 9: Find specific LINE user bookings (replace with actual line_user_id)
-- ============================================
-- Replace 'YOUR_LINE_USER_ID' with the actual LINE user ID from the logs
-- Example: 'Uf5741397f874c9a5822578e506f0cb47'

SELECT 
    b.id as booking_id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.customer_name,
    b.status,
    b.created_at,
    s.name as shop_name,
    CASE 
        WHEN b.booking_type = 'line' AND b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47' THEN '✅ MATCHES LINE USER'
        ELSE '❌ DOES NOT MATCH'
    END as match_status
FROM bookings b
LEFT JOIN shops s ON s.id = b.shop_id
WHERE b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
    OR b.user_id IN (
        SELECT user_id 
        FROM user_identities 
        WHERE provider = 'line' 
            AND provider_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
    )
ORDER BY b.created_at DESC;

-- ============================================
-- STEP 10: Check for orphaned bookings (bookings without proper ownership)
-- ============================================
SELECT 
    b.id as booking_id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.guest_id,
    b.created_at,
    CASE 
        WHEN b.booking_type = 'line' AND (b.user_id IS NULL OR b.line_user_id IS NULL) THEN '❌ INVALID LINE BOOKING'
        WHEN b.booking_type = 'user' AND b.user_id IS NULL THEN '❌ INVALID USER BOOKING'
        WHEN b.booking_type = 'guest' AND b.guest_id IS NULL THEN '❌ INVALID GUEST BOOKING'
        WHEN b.booking_type IS NULL THEN '❌ MISSING BOOKING_TYPE'
        ELSE '✅ VALID'
    END as validation_status
FROM bookings b
WHERE b.created_at >= NOW() - INTERVAL '7 days'
    AND (
        (b.booking_type = 'line' AND (b.user_id IS NULL OR b.line_user_id IS NULL))
        OR (b.booking_type = 'user' AND b.user_id IS NULL)
        OR (b.booking_type = 'guest' AND b.guest_id IS NULL)
        OR b.booking_type IS NULL
    )
ORDER BY b.created_at DESC;

-- ============================================
-- STEP 11: Verify constraints on bookings table
-- ============================================
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.bookings'::regclass
    AND contype IN ('c', 'f', 'u', 'p') -- Check, Foreign Key, Unique, Primary Key
ORDER BY contype, conname;

