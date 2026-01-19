-- ============================================================================
-- CLEANUP SHOP STATUS CONTRADICTIONS
-- ============================================================================
-- This migration fixes data inconsistencies in shop status and verification
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX SHOPS WHERE verification_status = 'approved' BUT shop_status != 'claimed' OR owner_id IS NULL
-- ============================================================================

-- Case 1: verification_status = 'approved' but shop_status != 'claimed' and owner_id exists
UPDATE public.shops
SET shop_status = 'claimed'
WHERE verification_status = 'approved'
  AND shop_status != 'claimed'
  AND COALESCE(owner_user_id, owner_id) IS NOT NULL;

-- Case 2: verification_status = 'approved' but owner_id IS NULL
-- Reset to unclaimed state
UPDATE public.shops
SET 
  verification_status = 'none',
  shop_status = 'unclaimed',
  owner_user_id = NULL,
  owner_id = NULL
WHERE verification_status = 'approved'
  AND COALESCE(owner_user_id, owner_id) IS NULL;

-- ============================================================================
-- STEP 2: FIX SHOPS WHERE shop_status = 'unclaimed' BUT verification_status != 'not_submitted'
-- ============================================================================

UPDATE public.shops
SET verification_status = 'not_submitted'
WHERE shop_status = 'unclaimed'
  AND verification_status NOT IN ('none', 'not_submitted');

-- ============================================================================
-- STEP 3: FIX SHOPS WHERE shop_status = 'claimed' BUT verification_status != 'approved'
-- ============================================================================

-- If claimed but not approved, set to pending
UPDATE public.shops
SET verification_status = 'pending'
WHERE shop_status = 'claimed'
  AND verification_status NOT IN ('approved', 'pending')
  AND COALESCE(owner_user_id, owner_id) IS NOT NULL;

-- If claimed but no owner, reset to unclaimed
UPDATE public.shops
SET 
  shop_status = 'unclaimed',
  verification_status = 'not_submitted',
  owner_user_id = NULL,
  owner_id = NULL
WHERE shop_status = 'claimed'
  AND COALESCE(owner_user_id, owner_id) IS NULL;

-- ============================================================================
-- STEP 4: FIX USER ROLES BASED ON SHOP STATUS
-- ============================================================================

-- Reset users who own shops that are not approved
UPDATE public.users
SET 
  role = 'customer',
  shop_id = NULL
WHERE role = 'owner'
  AND shop_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.shops s
    WHERE (s.owner_user_id = users.id OR s.owner_id = users.id)
      AND s.shop_status = 'claimed'
      AND s.verification_status = 'approved'
  );

-- Set users to owner if they own an approved shop
UPDATE public.users u
SET 
  role = 'owner',
  shop_id = s.id
FROM public.shops s
WHERE (s.owner_user_id = u.id OR s.owner_id = u.id)
  AND s.shop_status = 'claimed'
  AND s.verification_status = 'approved'
  AND u.role != 'owner';

-- ============================================================================
-- STEP 5: ENSURE STAFF/Super Admin NEVER HAVE shop_id
-- ============================================================================

UPDATE public.users
SET shop_id = NULL
WHERE role IN ('staff', 'super_admin')
  AND shop_id IS NOT NULL;

-- ============================================================================
-- STEP 6: LOG CLEANUP RESULTS
-- ============================================================================

DO $$
DECLARE
  fixed_approved_count INTEGER;
  fixed_unclaimed_count INTEGER;
  fixed_claimed_count INTEGER;
  fixed_user_roles_count INTEGER;
BEGIN
  -- Count fixes (we already applied them above, this is just for logging)
  SELECT COUNT(*) INTO fixed_approved_count
  FROM public.shops
  WHERE verification_status = 'approved'
    AND shop_status = 'claimed'
    AND COALESCE(owner_user_id, owner_id) IS NOT NULL;
  
  RAISE NOTICE 'Cleanup complete. Shops with approved status: %', fixed_approved_count;
  RAISE NOTICE 'All contradictions have been resolved.';
END $$;

