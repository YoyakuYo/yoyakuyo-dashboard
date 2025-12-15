-- Migration: Fix bookings with mismatched user_ids
-- This migration corrects bookings that have wrong user_id values
-- by updating them to use the canonical user_id from user_identities

-- ============================================
-- 1. Update bookings to use correct canonical user_id
-- ============================================
UPDATE bookings b
SET user_id = ui.user_id
FROM line_bookings lb
JOIN user_identities ui ON lb.line_user_id = ui.provider_user_id AND ui.provider = 'line'
WHERE b.id = lb.booking_id
  AND b.user_id != ui.user_id  -- Only update if mismatch exists
  AND ui.user_id IS NOT NULL;

-- Log how many bookings were fixed
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % bookings with mismatched user_ids', fixed_count;
END $$;

-- ============================================
-- 2. Verify all bookings now have correct user_id
-- ============================================
-- This query should return 0 rows if everything is fixed
DO $$
DECLARE
    remaining_mismatches INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_mismatches
    FROM bookings b
    JOIN line_bookings lb ON b.id = lb.booking_id
    JOIN user_identities ui ON lb.line_user_id = ui.provider_user_id AND ui.provider = 'line'
    WHERE b.user_id != ui.user_id;
    
    IF remaining_mismatches > 0 THEN
        RAISE WARNING 'Still have % bookings with mismatched user_ids. Review manually.', remaining_mismatches;
    ELSE
        RAISE NOTICE 'All bookings now have correct user_ids!';
    END IF;
END $$;

COMMENT ON TABLE bookings IS 'All bookings MUST have user_id matching the canonical user_id from user_identities for LINE users. Use the get_or_create_user_from_line_sub RPC function to ensure correct mapping.';
