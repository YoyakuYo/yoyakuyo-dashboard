-- Migration: Backfill user_id and customer_profile_id for existing bookings
-- This fixes bookings that were created before the new fields were added

-- ============================================
-- STEP 1: Update bookings with customer_id set to also have user_id
-- ============================================
UPDATE bookings
SET user_id = customer_id
WHERE customer_id IS NOT NULL
  AND user_id IS NULL
  AND customer_id IN (
    SELECT id FROM auth.users
  );

-- ============================================
-- STEP 2: Update bookings with user_id to also have customer_profile_id
-- ============================================
UPDATE bookings
SET customer_profile_id = cp.id
FROM customer_profiles cp
WHERE bookings.user_id IS NOT NULL
  AND bookings.customer_profile_id IS NULL
  AND cp.customer_auth_id = bookings.user_id;

-- ============================================
-- STEP 3: Verify the updates
-- ============================================
-- Check how many bookings were updated
SELECT 
  'Bookings with user_id backfilled' as metric,
  COUNT(*) as count
FROM bookings
WHERE user_id IS NOT NULL
  AND customer_id IS NOT NULL
  AND customer_id = user_id
UNION ALL
SELECT 
  'Bookings with customer_profile_id backfilled',
  COUNT(*)
FROM bookings
WHERE customer_profile_id IS NOT NULL
  AND user_id IS NOT NULL;

