-- ============================================
-- TEST THE EXACT QUERY LOGIC THE API USES
-- ============================================
-- This simulates what the GET /api/line/bookings endpoint does
-- Replace 'Uf5741397f874c9a5822578e506f0cb47' with your actual line_user_id

-- ============================================
-- STEP 1: Get canonical user_id (what API does first)
-- ============================================
SELECT 
    ui.user_id as canonical_user_id,
    ui.provider_user_id as line_user_id,
    '✅ Found user_identity mapping' as status
FROM user_identities ui
WHERE ui.provider = 'line'
    AND ui.provider_user_id = 'Uf5741397f874c9a5822578e506f0cb47';  -- REPLACE

-- ============================================
-- STEP 2: Primary query (by booking_type='line' AND line_user_id)
-- ============================================
-- This is the PRIMARY query the API uses
SELECT 
    b.id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.customer_name,
    b.status,
    b.created_at,
    'PRIMARY QUERY RESULT' as query_type
FROM bookings b
WHERE b.booking_type = 'line'
    AND b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'  -- REPLACE
ORDER BY b.created_at DESC;

-- ============================================
-- STEP 3: Fallback query (by user_id if primary returns 0)
-- ============================================
-- This is the FALLBACK query if primary returns 0 results
WITH user_identity_lookup AS (
    SELECT user_id
    FROM user_identities
    WHERE provider = 'line'
        AND provider_user_id = 'Uf5741397f874c9a5822578e506f0cb47'  -- REPLACE
)
SELECT 
    b.id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.customer_name,
    b.status,
    b.created_at,
    'FALLBACK QUERY RESULT' as query_type
FROM bookings b
CROSS JOIN user_identity_lookup ui
WHERE b.booking_type = 'line'
    AND b.user_id = ui.user_id
ORDER BY b.created_at DESC;

-- ============================================
-- STEP 4: Check if ANY bookings exist for this line_user_id (no filters)
-- ============================================
SELECT 
    b.id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.guest_id,
    b.customer_name,
    b.status,
    b.created_at,
    'ANY BOOKING WITH THIS LINE_USER_ID' as query_type
FROM bookings b
WHERE b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'  -- REPLACE
ORDER BY b.created_at DESC;

-- ============================================
-- STEP 5: Check if bookings exist for the canonical user_id
-- ============================================
WITH user_identity_lookup AS (
    SELECT user_id
    FROM user_identities
    WHERE provider = 'line'
        AND provider_user_id = 'Uf5741397f874c9a5822578e506f0cb47'  -- REPLACE
)
SELECT 
    b.id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.customer_name,
    b.status,
    b.created_at,
    'BOOKINGS BY CANONICAL USER_ID' as query_type
FROM bookings b
CROSS JOIN user_identity_lookup ui
WHERE b.user_id = ui.user_id
    AND b.booking_type IN ('line', 'user')  -- Both LINE and web bookings
ORDER BY b.created_at DESC;

-- ============================================
-- STEP 6: Debug - Show all recent bookings with their line_user_id
-- ============================================
SELECT 
    b.id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.customer_name,
    b.created_at,
    CASE 
        WHEN b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47' THEN '✅ MATCHES'
        WHEN b.line_user_id IS NULL THEN '❌ NULL'
        ELSE '❌ DIFFERENT'
    END as match_status
FROM bookings b
WHERE b.created_at >= NOW() - INTERVAL '7 days'
ORDER BY b.created_at DESC
LIMIT 20;

