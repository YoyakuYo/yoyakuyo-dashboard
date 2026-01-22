-- ============================================
-- CHECK THE 17 BOOKINGS - Find the Problem
-- ============================================

-- This will show exactly what's wrong with each of the 17 bookings
SELECT 
    b.id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.guest_id,
    b.customer_name,
    b.status,
    b.created_at,
    -- Check each constraint
    CASE 
        WHEN b.booking_type IS NULL THEN '❌ PROBLEM: booking_type is NULL'
        WHEN b.booking_type = 'line' AND b.line_user_id IS NULL THEN '❌ PROBLEM: line_user_id is NULL (required for line bookings)'
        WHEN b.booking_type = 'line' AND b.user_id IS NULL THEN '❌ PROBLEM: user_id is NULL (required for line bookings)'
        WHEN b.booking_type = 'line' AND b.line_user_id != 'Uf5741397f874c9a5822578e506f0cb47' THEN '❌ PROBLEM: line_user_id mismatch: ' || b.line_user_id
        WHEN b.booking_type = 'line' AND b.user_id != '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547' THEN '❌ PROBLEM: user_id mismatch: ' || b.user_id::text
        WHEN b.booking_type = 'line' AND b.guest_id IS NOT NULL THEN '❌ PROBLEM: guest_id should be NULL for line bookings'
        WHEN b.booking_type = 'line' THEN '✅ VALID LINE BOOKING - Should appear in app'
        WHEN b.booking_type = 'user' THEN '⚠️ This is a USER booking, not LINE booking'
        WHEN b.booking_type = 'guest' THEN '⚠️ This is a GUEST booking, not LINE booking'
        ELSE '❌ Unknown booking_type: ' || b.booking_type::text
    END as diagnosis
FROM bookings b
WHERE b.user_id = '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547'
    OR b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
ORDER BY b.created_at DESC;

-- Summary: Count by booking_type
SELECT 
    booking_type,
    COUNT(*) as count,
    COUNT(CASE WHEN booking_type = 'line' AND line_user_id = 'Uf5741397f874c9a5822578e506f0cb47' THEN 1 END) as valid_line_bookings
FROM bookings
WHERE user_id = '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547'
    OR line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
GROUP BY booking_type;

