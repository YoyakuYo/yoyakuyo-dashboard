-- Diagnostic queries to identify why bookings don't appear in dashboard
-- Run these in Supabase SQL Editor

-- ============================================
-- 1. Check the most recent booking
-- ============================================
SELECT 
    id,
    user_id,
    customer_profile_id,
    customer_name,
    customer_email,
    shop_id,
    status,
    created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 2. Check if user_id exists in users table
-- ============================================
SELECT 
    b.id as booking_id,
    b.user_id,
    b.customer_name,
    u.id as user_exists,
    u.email as user_email
FROM bookings b
LEFT JOIN public.users u ON b.user_id = u.id
ORDER BY b.created_at DESC
LIMIT 5;

-- ============================================
-- 3. Check LINE user identity mapping
-- ============================================
SELECT 
    ui.provider_user_id as line_user_id,
    ui.user_id as canonical_user_id,
    u.email as user_email,
    u.id as user_table_id
FROM user_identities ui
LEFT JOIN public.users u ON ui.user_id = u.id
WHERE ui.provider = 'line'
ORDER BY ui.created_at DESC
LIMIT 10;

-- ============================================
-- 4. Check line_bookings to see LINE user mapping
-- ============================================
SELECT 
    lb.booking_id,
    lb.line_user_id,
    b.user_id as booking_user_id,
    ui.user_id as mapped_canonical_user_id,
    CASE 
        WHEN b.user_id = ui.user_id THEN 'MATCH ✅'
        ELSE 'MISMATCH ❌'
    END as status
FROM line_bookings lb
LEFT JOIN bookings b ON lb.booking_id = b.id
LEFT JOIN user_identities ui ON lb.line_user_id = ui.provider_user_id AND ui.provider = 'line'
ORDER BY lb.booking_id DESC
LIMIT 10;

-- ============================================
-- 5. Find bookings with NULL or mismatched user_id
-- ============================================
SELECT 
    b.id as booking_id,
    b.user_id,
    b.customer_name,
    lb.line_user_id,
    ui.user_id as expected_user_id_from_line,
    CASE 
        WHEN b.user_id IS NULL THEN 'NULL user_id ❌'
        WHEN b.user_id != ui.user_id THEN 'MISMATCH ❌'
        WHEN ui.user_id IS NULL THEN 'No LINE mapping ❌'
        ELSE 'OK ✅'
    END as issue
FROM bookings b
LEFT JOIN line_bookings lb ON b.id = lb.booking_id
LEFT JOIN user_identities ui ON lb.line_user_id = ui.provider_user_id AND ui.provider = 'line'
WHERE b.user_id IS NULL 
   OR (lb.line_user_id IS NOT NULL AND (ui.user_id IS NULL OR b.user_id != ui.user_id))
ORDER BY b.created_at DESC
LIMIT 10;

-- ============================================
-- 6. Check customer_profiles for LINE users
-- ============================================
SELECT 
    cp.id as customer_profile_id,
    cp.line_user_id,
    cp.customer_auth_id,
    ui.user_id as canonical_user_id_from_identity,
    CASE 
        WHEN cp.customer_auth_id = ui.user_id THEN 'MATCH ✅'
        WHEN cp.customer_auth_id IS NULL THEN 'NULL customer_auth_id ❌'
        WHEN ui.user_id IS NULL THEN 'No identity mapping ❌'
        ELSE 'MISMATCH ❌'
    END as status
FROM customer_profiles cp
LEFT JOIN user_identities ui ON cp.line_user_id = ui.provider_user_id AND ui.provider = 'line'
WHERE cp.line_user_id IS NOT NULL
ORDER BY cp.created_at DESC
LIMIT 10;

