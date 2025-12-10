-- ============================================================================
-- DIAGNOSE CUSTOMER STRUCTURE - Check if IDs are correctly structured
-- ============================================================================
-- This script checks if customer_profiles.id and customer_auth_id are properly set
-- ============================================================================

-- Check 1: Are profile_id and customer_auth_id the same? (This might be OK if migrated from Supabase Auth)
SELECT 
    cp.id AS profile_id,
    cp.customer_auth_id,
    c.id AS customer_id,
    CASE 
        WHEN cp.id = cp.customer_auth_id AND cp.customer_auth_id = c.id THEN 
            '⚠️ All IDs are the same (migrated from Supabase Auth?)'
        WHEN cp.id = cp.customer_auth_id THEN 
            '⚠️ profile_id = customer_auth_id (should be different)'
        WHEN cp.customer_auth_id = c.id THEN 
            '✅ Correct: customer_auth_id links to customers.id'
        WHEN cp.customer_auth_id IS NULL THEN 
            '❌ Missing: customer_auth_id is NULL'
        ELSE 
            '❌ Error: IDs do not match'
    END AS structure_status,
    cp.email AS profile_email,
    c.email AS customer_email
FROM customer_profiles cp
LEFT JOIN customers c ON cp.customer_auth_id = c.id
ORDER BY cp.created_at DESC
LIMIT 10;

-- Check 2: Count how many profiles have different IDs vs same IDs
SELECT 
    COUNT(*) FILTER (WHERE cp.id = cp.customer_auth_id) AS profiles_with_same_ids,
    COUNT(*) FILTER (WHERE cp.id != cp.customer_auth_id) AS profiles_with_different_ids,
    COUNT(*) FILTER (WHERE cp.customer_auth_id IS NULL) AS profiles_without_auth_id,
    COUNT(*) AS total_profiles
FROM customer_profiles cp;

-- Check 3: Check if bookings are using customer_profile_id correctly
SELECT 
    COUNT(*) AS total_bookings,
    COUNT(customer_profile_id) AS bookings_with_profile_id,
    COUNT(*) FILTER (WHERE customer_profile_id IN (SELECT id FROM customer_profiles)) AS bookings_with_valid_profile_id,
    COUNT(*) FILTER (WHERE customer_profile_id NOT IN (SELECT id FROM customer_profiles) AND customer_profile_id IS NOT NULL) AS bookings_with_invalid_profile_id
FROM bookings;

-- Check 4: Sample bookings to see how they're linked
SELECT 
    b.id AS booking_id,
    b.customer_profile_id,
    cp.id AS profile_id,
    cp.customer_auth_id,
    c.id AS customer_id,
    CASE 
        WHEN b.customer_profile_id = cp.id THEN '✅ Booking linked to profile'
        WHEN b.customer_profile_id IS NULL THEN '⚠️ Booking has no profile_id'
        ELSE '❌ Booking profile_id does not match'
    END AS booking_linkage_status
FROM bookings b
LEFT JOIN customer_profiles cp ON b.customer_profile_id = cp.id
LEFT JOIN customers c ON cp.customer_auth_id = c.id
ORDER BY b.created_at DESC
LIMIT 10;

