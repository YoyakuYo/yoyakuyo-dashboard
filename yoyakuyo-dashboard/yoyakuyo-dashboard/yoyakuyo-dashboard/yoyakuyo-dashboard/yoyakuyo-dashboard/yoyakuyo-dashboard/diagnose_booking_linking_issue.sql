-- ============================================================================
-- DIAGNOSE BOOKING LINKING ISSUE
-- ============================================================================
-- This script helps diagnose why bookings from customer accounts aren't linked
-- ============================================================================

-- Step 1: Check what user.id actually is (from your customer account)
-- Replace 'yayakuyodemo@gmail.com' with your actual email
SELECT 
    'Customer Account Info' AS check_type,
    c.id AS customers_id,
    c.email AS customers_email,
    c.name AS customers_name,
    cp.id AS customer_profiles_id,
    cp.email AS customer_profiles_email,
    cp.customer_auth_id AS customer_profiles_auth_id,
    CASE 
        WHEN cp.customer_auth_id = c.id THEN '✅ Linked correctly'
        WHEN cp.customer_auth_id IS NULL THEN '❌ customer_auth_id is NULL'
        ELSE '❌ Mismatch: customer_auth_id does not match customers.id'
    END AS linkage_status
FROM customers c
LEFT JOIN customer_profiles cp ON cp.customer_auth_id = c.id
WHERE c.email = 'yayakuyodemo@gmail.com';

-- Step 2: Check the two bookings that weren't linked
SELECT 
    b.id AS booking_id,
    b.customer_email,
    b.customer_name,
    b.customer_id,
    b.customer_profile_id,
    b.created_at AS booking_created_at,
    -- Check if email matches any customer_profile
    (SELECT id FROM customer_profiles WHERE email = b.customer_email LIMIT 1) AS matching_profile_by_email,
    -- Check if customer_id matches customers table
    (SELECT id FROM customers WHERE id = b.customer_id LIMIT 1) AS matching_customer_by_id,
    -- Check if customer_id matches customer_profiles.customer_auth_id
    (SELECT id FROM customer_profiles WHERE customer_auth_id = b.customer_id LIMIT 1) AS matching_profile_by_auth_id
FROM bookings b
WHERE b.id IN (
    '73d9321f-16d3-406f-80d6-c261c48dc39b',
    'dca60886-5156-4bbd-b29b-25241c6c98f1'
);

-- Step 3: Check what user.id would be sent from frontend
-- This depends on your auth system - check if you're using Supabase Auth or custom auth
-- If using Supabase Auth, user.id would be from auth.users table
-- If using custom auth, user.id would be from customers table

-- Check Supabase Auth users (if using Supabase Auth)
SELECT 
    'Supabase Auth User' AS auth_type,
    u.id AS auth_user_id,
    u.email AS auth_user_email,
    c.id AS customers_id,
    cp.id AS customer_profiles_id,
    cp.customer_auth_id
FROM auth.users u
LEFT JOIN customers c ON c.email = u.email
LEFT JOIN customer_profiles cp ON cp.customer_auth_id = c.id
WHERE u.email = 'yayakuyodemo@gmail.com';

-- Step 4: Show all possible ID mismatches
SELECT 
    'ID Mismatch Analysis' AS analysis_type,
    c.id AS customers_id,
    c.email AS customers_email,
    cp.id AS customer_profiles_id,
    cp.customer_auth_id,
    CASE 
        WHEN cp.customer_auth_id = c.id THEN '✅ Correct'
        WHEN cp.customer_auth_id IS NULL THEN '❌ Missing customer_auth_id'
        WHEN cp.id = c.id THEN '⚠️ profile_id = customer_id (migrated from Supabase Auth?)'
        ELSE '❌ Mismatch'
    END AS status
FROM customers c
LEFT JOIN customer_profiles cp ON cp.email = c.email
WHERE c.email = 'yayakuyodemo@gmail.com';

-- Step 5: Test the lookup query that booking creation uses
-- Simulate what happens when x-user-id header is sent
-- Replace 'YOUR_USER_ID_HERE' with the actual user.id from your frontend
SELECT 
    'Booking Lookup Test' AS test_type,
    'YOUR_USER_ID_HERE' AS user_id_sent,
    cp.id AS found_profile_id,
    cp.email AS found_profile_email,
    cp.customer_auth_id AS found_auth_id,
    CASE 
        WHEN cp.id IS NOT NULL THEN '✅ Profile found via customer_auth_id'
        ELSE '❌ No profile found'
    END AS lookup_result
FROM customer_profiles cp
WHERE cp.customer_auth_id = 'YOUR_USER_ID_HERE'
LIMIT 1;

