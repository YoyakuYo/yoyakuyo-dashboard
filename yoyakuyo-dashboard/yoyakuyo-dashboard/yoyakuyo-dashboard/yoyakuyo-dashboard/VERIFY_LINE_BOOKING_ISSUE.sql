-- CRITICAL DIAGNOSTIC: Verify why LINE bookings don't appear in dashboard
-- Run this in Supabase SQL Editor to identify the exact issue

-- ============================================
-- 1. Check most recent booking and its user_id
-- ============================================
SELECT 
    b.id as booking_id,
    b.user_id,
    b.customer_name,
    b.created_at,
    CASE 
        WHEN b.user_id IS NULL THEN '❌ NULL user_id'
        ELSE '✅ Has user_id'
    END as user_id_status
FROM bookings b
ORDER BY b.created_at DESC
LIMIT 1;

-- ============================================
-- 2. Check if line_bookings record exists
-- ============================================
SELECT 
    lb.booking_id,
    lb.line_user_id,
    b.user_id as booking_user_id,
    b.customer_name
FROM line_bookings lb
JOIN bookings b ON lb.booking_id = b.id
ORDER BY lb.booking_id DESC
LIMIT 5;

-- ============================================
-- 3. Check user_identities mapping for LINE user
-- ============================================
-- Replace 'YOUR_LINE_USER_ID' with actual LINE user ID from step 2
SELECT 
    ui.provider_user_id as line_user_id,
    ui.user_id as canonical_user_id,
    u.id as user_table_id,
    u.email as user_email,
    CASE 
        WHEN ui.user_id = u.id THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as mapping_status
FROM user_identities ui
LEFT JOIN public.users u ON ui.user_id = u.id
WHERE ui.provider = 'line'
ORDER BY ui.created_at DESC
LIMIT 10;

-- ============================================
-- 4. Check if booking.user_id matches canonical user_id from line_user_id
-- ============================================
SELECT 
    b.id as booking_id,
    b.user_id as booking_user_id,
    lb.line_user_id,
    ui.user_id as expected_canonical_user_id,
    CASE 
        WHEN b.user_id IS NULL THEN '❌ NULL user_id'
        WHEN ui.user_id IS NULL THEN '❌ No LINE identity mapping'
        WHEN b.user_id = ui.user_id THEN '✅ MATCH'
        ELSE '❌ MISMATCH - booking.user_id != expected user_id'
    END as issue
FROM bookings b
LEFT JOIN line_bookings lb ON b.id = lb.booking_id
LEFT JOIN user_identities ui ON lb.line_user_id = ui.provider_user_id AND ui.provider = 'line'
ORDER BY b.created_at DESC
LIMIT 5;

-- ============================================
-- 5. Simulate the LINE bookings query
-- ============================================
-- Replace 'YOUR_LINE_USER_ID' with actual LINE user ID
SELECT 
    lb.booking_id,
    lb.line_user_id,
    b.id,
    b.user_id,
    b.customer_name,
    b.status
FROM line_bookings lb
JOIN bookings b ON lb.booking_id = b.id
WHERE lb.line_user_id = 'YOUR_LINE_USER_ID'  -- Replace with actual LINE user ID
ORDER BY b.created_at DESC;

-- ============================================
-- 6. Check if booking was created but line_bookings record is missing
-- ============================================
SELECT 
    b.id as booking_id,
    b.user_id,
    b.customer_name,
    b.created_at,
    CASE 
        WHEN lb.booking_id IS NULL THEN '❌ Missing line_bookings record'
        ELSE '✅ Has line_bookings record'
    END as line_booking_status
FROM bookings b
LEFT JOIN line_bookings lb ON b.id = lb.booking_id
WHERE b.created_at > NOW() - INTERVAL '1 hour'  -- Recent bookings
ORDER BY b.created_at DESC;

