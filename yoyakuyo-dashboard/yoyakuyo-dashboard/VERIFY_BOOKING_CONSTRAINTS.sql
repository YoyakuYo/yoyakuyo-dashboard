-- ============================================
-- VERIFY BOOKING CONSTRAINTS & FIND ISSUES
-- ============================================

-- ============================================
-- STEP 1: Find bookings that VIOLATE constraints
-- ============================================
SELECT 
    b.id as booking_id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.guest_id,
    b.created_at,
    CASE 
        -- LINE booking violations
        WHEN b.booking_type = 'line' AND b.line_user_id IS NULL THEN '❌ VIOLATES: line_user_id IS NULL'
        WHEN b.booking_type = 'line' AND b.user_id IS NULL THEN '❌ VIOLATES: user_id IS NULL'
        WHEN b.booking_type = 'line' AND b.guest_id IS NOT NULL THEN '❌ VIOLATES: guest_id should be NULL'
        
        -- USER booking violations
        WHEN b.booking_type = 'user' AND b.user_id IS NULL THEN '❌ VIOLATES: user_id IS NULL'
        WHEN b.booking_type = 'user' AND b.line_user_id IS NOT NULL THEN '❌ VIOLATES: line_user_id should be NULL'
        WHEN b.booking_type = 'user' AND b.guest_id IS NOT NULL THEN '❌ VIOLATES: guest_id should be NULL'
        
        -- GUEST booking violations
        WHEN b.booking_type = 'guest' AND b.guest_id IS NULL THEN '❌ VIOLATES: guest_id IS NULL'
        WHEN b.booking_type = 'guest' AND b.user_id IS NOT NULL THEN '❌ VIOLATES: user_id should be NULL'
        WHEN b.booking_type = 'guest' AND b.line_user_id IS NOT NULL THEN '❌ VIOLATES: line_user_id should be NULL'
        
        -- Missing booking_type
        WHEN b.booking_type IS NULL THEN '❌ VIOLATES: booking_type IS NULL'
        
        ELSE '✅ VALID'
    END as constraint_status
FROM bookings b
WHERE b.created_at >= NOW() - INTERVAL '7 days'
    AND (
        -- Find all violations
        (b.booking_type = 'line' AND (b.line_user_id IS NULL OR b.user_id IS NULL OR b.guest_id IS NOT NULL))
        OR (b.booking_type = 'user' AND (b.user_id IS NULL OR b.line_user_id IS NOT NULL OR b.guest_id IS NOT NULL))
        OR (b.booking_type = 'guest' AND (b.guest_id IS NULL OR b.user_id IS NOT NULL OR b.line_user_id IS NOT NULL))
        OR b.booking_type IS NULL
    )
ORDER BY b.created_at DESC;

-- ============================================
-- STEP 2: Check all recent LINE bookings (should all be valid)
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
        WHEN b.booking_type = 'line' 
            AND b.line_user_id IS NOT NULL 
            AND b.user_id IS NOT NULL 
            AND b.guest_id IS NULL 
        THEN '✅ VALID LINE BOOKING'
        ELSE '❌ INVALID'
    END as validation_status,
    -- Check if user_id exists in users table
    CASE 
        WHEN u.id IS NOT NULL THEN '✅ user_id exists'
        ELSE '❌ user_id NOT FOUND in users table'
    END as user_exists,
    -- Check if line_user_id has mapping
    CASE 
        WHEN ui.user_id IS NOT NULL THEN '✅ Has user_identity mapping'
        ELSE '❌ NO user_identity mapping'
    END as has_identity_mapping
FROM bookings b
LEFT JOIN users u ON u.id = b.user_id
LEFT JOIN user_identities ui ON ui.provider = 'line' AND ui.provider_user_id = b.line_user_id
WHERE b.booking_type = 'line'
    AND b.created_at >= NOW() - INTERVAL '7 days'
ORDER BY b.created_at DESC;

-- ============================================
-- STEP 3: Test query that LINE app should use
-- ============================================
-- Replace 'YOUR_LINE_USER_ID' with actual line_user_id (e.g., 'Uf5741397f874c9a5822578e506f0cb47')
SELECT 
    b.id as booking_id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.customer_name,
    b.status,
    b.created_at,
    s.name as shop_name,
    '✅ FOUND BY line_user_id' as query_method
FROM bookings b
LEFT JOIN shops s ON s.id = b.shop_id
WHERE b.booking_type = 'line'
    AND b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'  -- REPLACE WITH YOUR LINE_USER_ID
ORDER BY b.created_at DESC;

-- ============================================
-- STEP 4: Test fallback query (by user_id)
-- ============================================
-- This is what the API does if line_user_id query returns 0 results
SELECT 
    b.id as booking_id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.customer_name,
    b.status,
    b.created_at,
    s.name as shop_name,
    '✅ FOUND BY user_id (fallback)' as query_method
FROM bookings b
LEFT JOIN shops s ON s.id = b.shop_id
LEFT JOIN user_identities ui ON ui.provider = 'line' AND ui.provider_user_id = 'Uf5741397f874c9a5822578e506f0cb47'  -- REPLACE
WHERE b.booking_type = 'line'
    AND b.user_id = ui.user_id
ORDER BY b.created_at DESC;

-- ============================================
-- STEP 5: Check if line_user_id matches exactly (case-sensitive)
-- ============================================
-- Sometimes the issue is case sensitivity or whitespace
SELECT 
    b.id as booking_id,
    b.line_user_id,
    LENGTH(b.line_user_id) as line_user_id_length,
    'Uf5741397f874c9a5822578e506f0cb47' as expected_line_user_id,
    LENGTH('Uf5741397f874c9a5822578e506f0cb47') as expected_length,
    CASE 
        WHEN b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47' THEN '✅ EXACT MATCH'
        WHEN LOWER(b.line_user_id) = LOWER('Uf5741397f874c9a5822578e506f0cb47') THEN '⚠️ CASE MISMATCH'
        ELSE '❌ NO MATCH'
    END as match_status
FROM bookings b
WHERE b.booking_type = 'line'
    AND b.created_at >= NOW() - INTERVAL '7 days'
ORDER BY b.created_at DESC;

-- ============================================
-- STEP 6: Summary of all LINE bookings
-- ============================================
SELECT 
    COUNT(*) as total_line_bookings,
    COUNT(CASE WHEN line_user_id IS NOT NULL THEN 1 END) as has_line_user_id,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as has_user_id,
    COUNT(CASE WHEN line_user_id IS NOT NULL AND user_id IS NOT NULL THEN 1 END) as valid_line_bookings,
    COUNT(DISTINCT line_user_id) as unique_line_users,
    COUNT(DISTINCT user_id) as unique_canonical_users
FROM bookings
WHERE booking_type = 'line'
    AND created_at >= NOW() - INTERVAL '7 days';

