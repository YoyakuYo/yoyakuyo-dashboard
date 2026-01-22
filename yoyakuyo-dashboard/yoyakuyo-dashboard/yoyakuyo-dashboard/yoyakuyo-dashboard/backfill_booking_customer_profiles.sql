-- ============================================================================
-- BACKFILL BOOKING CUSTOMER_PROFILE_ID
-- ============================================================================
-- This script attempts to link existing bookings to customer_profiles
-- by matching email addresses or customer_id
-- ============================================================================

-- Step 1: Show current status of bookings without customer_profile_id
SELECT 
    COUNT(*) AS total_bookings,
    COUNT(customer_profile_id) AS bookings_with_profile_id,
    COUNT(*) FILTER (WHERE customer_profile_id IS NULL) AS bookings_without_profile_id,
    COUNT(*) FILTER (WHERE customer_email IS NOT NULL) AS bookings_with_email,
    COUNT(*) FILTER (WHERE customer_id IS NOT NULL) AS bookings_with_customer_id
FROM bookings;

-- Step 2: Attempt to link bookings by email (if customer_email matches customer_profiles.email)
UPDATE bookings b
SET customer_profile_id = cp.id
FROM customer_profiles cp
WHERE b.customer_profile_id IS NULL
  AND b.customer_email IS NOT NULL
  AND b.customer_email = cp.email
  AND cp.id IS NOT NULL;

-- Step 3: Attempt to link bookings by customer_id (if customer_id matches customers.id, then find profile)
UPDATE bookings b
SET customer_profile_id = cp.id
FROM customers c
JOIN customer_profiles cp ON cp.customer_auth_id = c.id
WHERE b.customer_profile_id IS NULL
  AND b.customer_id IS NOT NULL
  AND b.customer_id = c.id
  AND cp.id IS NOT NULL;

-- Step 4: Show results after backfill
SELECT 
    COUNT(*) AS total_bookings,
    COUNT(customer_profile_id) AS bookings_with_profile_id,
    COUNT(*) FILTER (WHERE customer_profile_id IS NULL) AS bookings_without_profile_id,
    ROUND(100.0 * COUNT(customer_profile_id) / COUNT(*), 2) AS percentage_linked
FROM bookings;

-- Step 5: Show sample of bookings that still couldn't be linked (likely guest bookings)
SELECT 
    b.id AS booking_id,
    b.customer_name,
    b.customer_email,
    b.customer_phone,
    b.customer_id,
    b.customer_profile_id,
    b.date AS booking_date,
    b.status,
    b.created_at,
    CASE 
        WHEN b.customer_email IS NULL AND b.customer_id IS NULL THEN 'Guest booking (no customer info)'
        WHEN b.customer_email IS NOT NULL THEN 'Could not match email to customer_profile'
        WHEN b.customer_id IS NOT NULL THEN 'Could not match customer_id to customer_profile'
        ELSE 'Unknown'
    END AS unlinked_reason
FROM bookings b
WHERE b.customer_profile_id IS NULL
ORDER BY b.created_at DESC
LIMIT 20;

-- Step 6: Create customer_profiles for bookings with email but no profile (optional - use with caution)
-- This will create profiles for customers who booked but never created an account
-- UNCOMMENT ONLY IF YOU WANT TO CREATE PROFILES FOR GUEST BOOKINGS
/*
INSERT INTO customer_profiles (id, name, email, phone, created_at, updated_at)
SELECT 
    gen_random_uuid() AS id,
    b.customer_name AS name,
    b.customer_email AS email,
    b.customer_phone AS phone,
    MIN(b.created_at) AS created_at,
    NOW() AS updated_at
FROM bookings b
WHERE b.customer_profile_id IS NULL
  AND b.customer_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM customer_profiles cp 
    WHERE cp.email = b.customer_email
  )
GROUP BY b.customer_name, b.customer_email, b.customer_phone
ON CONFLICT (email) DO NOTHING;

-- Then link the bookings to the newly created profiles
UPDATE bookings b
SET customer_profile_id = cp.id
FROM customer_profiles cp
WHERE b.customer_profile_id IS NULL
  AND b.customer_email IS NOT NULL
  AND b.customer_email = cp.email;
*/

