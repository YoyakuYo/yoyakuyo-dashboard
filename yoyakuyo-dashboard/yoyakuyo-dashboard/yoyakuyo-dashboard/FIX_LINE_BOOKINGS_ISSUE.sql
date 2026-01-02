-- ============================================
-- DIAGNOSE: Why 17 bookings aren't showing in LINE app
-- ============================================
-- Based on your data:
-- line_user_id: Uf5741397f874c9a5822578e506f0cb47
-- canonical_user_id: 0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547
-- booking_count: 17

-- STEP 1: Check what booking_type these 17 bookings have
SELECT 
    booking_type,
    COUNT(*) as count,
    COUNT(CASE WHEN booking_type = 'line' THEN 1 END) as is_line_type,
    COUNT(CASE WHEN line_user_id = 'Uf5741397f874c9a5822578e506f0cb47' THEN 1 END) as has_correct_line_user_id
FROM bookings
WHERE user_id = '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547'
    OR line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
GROUP BY booking_type;

-- STEP 2: Show the actual bookings and their status
SELECT 
    b.id,
    b.booking_type,
    b.user_id,
    b.line_user_id,
    b.customer_name,
    b.status,
    b.created_at,
    -- Check if this booking would be found by API query
    CASE 
        WHEN b.booking_type = 'line' 
            AND b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
        THEN '✅ Found by PRIMARY query (booking_type + line_user_id)'
        WHEN b.booking_type = 'line' 
            AND b.user_id = '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547'
        THEN '✅ Found by FALLBACK query (booking_type + user_id)'
        WHEN b.booking_type != 'line' THEN '❌ Wrong booking_type: ' || COALESCE(b.booking_type::text, 'NULL')
        WHEN b.line_user_id IS NULL THEN '❌ line_user_id is NULL'
        WHEN b.line_user_id != 'Uf5741397f874c9a5822578e506f0cb47' THEN '❌ line_user_id mismatch: ' || b.line_user_id
        ELSE '❌ OTHER ISSUE'
    END as query_status
FROM bookings b
WHERE b.user_id = '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547'
    OR b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
ORDER BY b.created_at DESC;

-- STEP 3: Test the EXACT query the API uses (PRIMARY)
SELECT 
    COUNT(*) as found_by_primary_query
FROM bookings
WHERE booking_type = 'line'
    AND line_user_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- STEP 4: Test the EXACT fallback query the API uses
SELECT 
    COUNT(*) as found_by_fallback_query
FROM bookings
WHERE booking_type = 'line'
    AND user_id = '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547';

-- STEP 5: If bookings have wrong booking_type, show how to fix them
SELECT 
    b.id,
    b.booking_type as current_type,
    'line' as should_be,
    b.user_id,
    b.line_user_id,
    'UPDATE bookings SET booking_type = ''line'' WHERE id = ''' || b.id || ''';' as fix_sql
FROM bookings b
WHERE (b.user_id = '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547'
    OR b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47')
    AND b.booking_type != 'line'
    AND b.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- STEP 6: If bookings are missing line_user_id, show how to fix them
SELECT 
    b.id,
    b.booking_type,
    b.user_id,
    b.line_user_id as current_line_user_id,
    'Uf5741397f874c9a5822578e506f0cb47' as should_be,
    'UPDATE bookings SET line_user_id = ''Uf5741397f874c9a5822578e506f0cb47'' WHERE id = ''' || b.id || ''';' as fix_sql
FROM bookings b
WHERE b.user_id = '0d1c3b9f-9bbd-41a2-a1f7-0d5175d6d547'
    AND b.booking_type = 'line'
    AND (b.line_user_id IS NULL OR b.line_user_id != 'Uf5741397f874c9a5822578e506f0cb47');

