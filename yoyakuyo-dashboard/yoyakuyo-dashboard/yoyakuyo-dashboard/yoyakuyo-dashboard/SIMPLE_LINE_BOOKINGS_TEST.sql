-- ============================================
-- SIMPLE TEST: Why 17 bookings aren't showing in LINE app
-- ============================================
-- Replace 'Uf5741397f874c9a5822578e506f0cb47' with your actual line_user_id

-- STEP 1: Check if bookings exist with correct booking_type='line'
SELECT 
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN booking_type = 'line' THEN 1 END) as line_bookings,
    COUNT(CASE WHEN booking_type = 'line' AND line_user_id = 'Uf5741397f874c9a5822578e506f0cb47' THEN 1 END) as matching_line_user_id,
    COUNT(CASE WHEN booking_type = 'line' AND user_id = '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547' THEN 1 END) as matching_user_id
FROM bookings
WHERE line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
    OR user_id = '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547';

-- STEP 2: Show all bookings for this LINE user (what API should return)
SELECT 
    b.id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.customer_name,
    b.status,
    b.created_at,
    CASE 
        WHEN b.booking_type = 'line' 
            AND b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
            AND b.user_id = '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547'
        THEN '✅ SHOULD APPEAR'
        WHEN b.booking_type != 'line' THEN '❌ Wrong booking_type: ' || b.booking_type
        WHEN b.line_user_id != 'Uf5741397f874c9a5822578e506f0cb47' THEN '❌ line_user_id mismatch'
        WHEN b.user_id != '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547' THEN '❌ user_id mismatch'
        ELSE '❌ OTHER ISSUE'
    END as status
FROM bookings b
WHERE b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
    OR b.user_id = '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547'
ORDER BY b.created_at DESC;

-- STEP 3: Test PRIMARY query (exactly what API does first)
SELECT 
    b.id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.customer_name,
    b.status,
    b.created_at
FROM bookings b
WHERE b.booking_type = 'line'
    AND b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
ORDER BY b.created_at DESC;

-- STEP 4: Test FALLBACK query (what API does if primary returns 0)
SELECT 
    b.id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.customer_name,
    b.status,
    b.created_at
FROM bookings b
WHERE b.booking_type = 'line'
    AND b.user_id = '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547'
ORDER BY b.created_at DESC;

-- STEP 5: Check for case sensitivity or whitespace issues
SELECT 
    b.id,
    b.line_user_id,
    LENGTH(b.line_user_id) as length,
    b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47' as exact_match,
    LOWER(b.line_user_id) = LOWER('Uf5741397f874c9a5822578e506f0cb47') as case_insensitive_match,
    TRIM(b.line_user_id) = TRIM('Uf5741397f874c9a5822578e506f0cb47') as trimmed_match
FROM bookings b
WHERE b.booking_type = 'line'
    AND (b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
         OR LOWER(b.line_user_id) = LOWER('Uf5741397f874c9a5822578e506f0cb47'))
ORDER BY b.created_at DESC
LIMIT 5;

