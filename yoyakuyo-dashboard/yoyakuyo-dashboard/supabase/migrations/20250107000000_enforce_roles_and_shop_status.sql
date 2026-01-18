-- ============================================================================
-- ENFORCE ROLES AND SHOP STATUS - COMPREHENSIVE MIGRATION
-- ============================================================================
-- This migration enforces role-based business rules and shop status logic
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD ROLE AND RELATED COLUMNS TO USERS TABLE
-- ============================================================================

-- Create role enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('customer', 'owner', 'staff', 'super_admin');
  END IF;
END $$;

-- Create account_status enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE account_status AS ENUM ('active', 'suspended');
  END IF;
END $$;

-- Add role column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users ADD COLUMN role user_role DEFAULT 'customer';
    RAISE NOTICE 'Added role column to users table';
  END IF;
END $$;

-- Add shop_id column to users table (nullable, FK to shops.id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'shop_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN shop_id UUID REFERENCES shops(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added shop_id column to users table';
  END IF;
END $$;

-- Add account_status column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'account_status'
  ) THEN
    ALTER TABLE public.users ADD COLUMN account_status account_status DEFAULT 'active';
    RAISE NOTICE 'Added account_status column to users table';
  END IF;
END $$;

-- Rename 'name' to 'full_name' for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.users RENAME COLUMN name TO full_name;
    RAISE NOTICE 'Renamed name column to full_name';
  END IF;
END $$;

-- Add full_name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN full_name VARCHAR(255);
    -- Copy from name if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'name'
    ) THEN
      UPDATE public.users SET full_name = name WHERE full_name IS NULL;
    END IF;
    RAISE NOTICE 'Added full_name column to users table';
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_shop_id ON public.users(shop_id);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_status);

-- ============================================================================
-- STEP 2: ADD SHOP_STATUS TO SHOPS TABLE
-- ============================================================================

-- Create shop_status enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shop_status') THEN
    CREATE TYPE shop_status AS ENUM ('unclaimed', 'pending', 'claimed', 'rejected');
  END IF;
END $$;

-- Add shop_status column to shops table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shops' 
    AND column_name = 'shop_status'
  ) THEN
    ALTER TABLE public.shops ADD COLUMN shop_status shop_status DEFAULT 'unclaimed';
    RAISE NOTICE 'Added shop_status column to shops table';
  END IF;
END $$;

-- Ensure owner_id column exists (might be owner_user_id, we'll handle both)
DO $$
BEGIN
  -- Check if owner_user_id exists but owner_id doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shops' 
    AND column_name = 'owner_user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shops' 
    AND column_name = 'owner_id'
  ) THEN
    -- Add owner_id as an alias/duplicate for now, or we can use owner_user_id
    -- For now, we'll work with owner_user_id if it exists
    RAISE NOTICE 'Using owner_user_id as owner_id';
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_shops_shop_status ON public.shops(shop_status);
CREATE INDEX IF NOT EXISTS idx_shops_verification_status ON public.shops(verification_status);

-- ============================================================================
-- STEP 3: CLEAN UP DATA BEFORE ADDING CONSTRAINTS
-- ============================================================================

-- Fix shops where shop_status = 'unclaimed' but has owner or wrong verification_status
UPDATE public.shops
SET 
  owner_user_id = NULL,
  owner_id = NULL,
  verification_status = 'not_submitted'
WHERE shop_status = 'unclaimed'
  AND (COALESCE(owner_user_id, owner_id) IS NOT NULL OR verification_status NOT IN ('not_submitted', 'none'));

-- Fix shops where verification_status = 'approved' but shop_status != 'claimed' or no owner
UPDATE public.shops
SET shop_status = 'claimed'
WHERE verification_status = 'approved'
  AND shop_status != 'claimed'
  AND COALESCE(owner_user_id, owner_id) IS NOT NULL;

-- Reset shops where verification_status = 'approved' but no owner
UPDATE public.shops
SET 
  verification_status = 'not_submitted',
  shop_status = 'unclaimed',
  owner_user_id = NULL,
  owner_id = NULL
WHERE verification_status = 'approved'
  AND COALESCE(owner_user_id, owner_id) IS NULL;

-- Fix shops where shop_status = 'claimed' but verification_status != 'approved'
UPDATE public.shops
SET verification_status = 'pending'
WHERE shop_status = 'claimed'
  AND verification_status NOT IN ('approved', 'pending')
  AND COALESCE(owner_user_id, owner_id) IS NOT NULL;

-- Reset shops where shop_status = 'claimed' but no owner
UPDATE public.shops
SET 
  shop_status = 'unclaimed',
  verification_status = 'not_submitted',
  owner_user_id = NULL,
  owner_id = NULL
WHERE shop_status = 'claimed'
  AND COALESCE(owner_user_id, owner_id) IS NULL;

-- ============================================================================
-- STEP 4: ADD DATABASE CONSTRAINTS AND CHECKS (AFTER DATA CLEANUP)
-- ============================================================================

-- Constraint: role = 'customer' → shop_id MUST be NULL
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_customer_no_shop;
ALTER TABLE public.users ADD CONSTRAINT check_customer_no_shop 
  CHECK (role != 'customer' OR shop_id IS NULL);

-- Constraint: role = 'owner' → shop_id MUST NOT be NULL
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_owner_has_shop;
ALTER TABLE public.users ADD CONSTRAINT check_owner_has_shop 
  CHECK (role != 'owner' OR shop_id IS NOT NULL);

-- Constraint: role IN ('staff','super_admin') → shop_id MUST be NULL
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_staff_no_shop;
ALTER TABLE public.users ADD CONSTRAINT check_staff_no_shop 
  CHECK (role NOT IN ('staff', 'super_admin') OR shop_id IS NULL);

-- First, update the verification_status constraint to handle 'none' if it exists, or use 'not_submitted'
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS shops_verification_status_check;
  
  -- Add new constraint that includes both 'none' (for backward compatibility) and 'not_submitted'
  ALTER TABLE public.shops ADD CONSTRAINT shops_verification_status_check 
    CHECK (verification_status IN ('none', 'not_submitted', 'pending', 'approved', 'rejected'));
END $$;

-- Update any 'none' values to 'not_submitted' for consistency
UPDATE public.shops
SET verification_status = 'not_submitted'
WHERE verification_status = 'none';

-- Constraint: shop_status = 'unclaimed' → owner_user_id MUST be NULL AND verification_status = 'not_submitted'
ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS check_unclaimed_shop;
ALTER TABLE public.shops ADD CONSTRAINT check_unclaimed_shop 
  CHECK (
    shop_status != 'unclaimed' OR 
    (COALESCE(owner_user_id, owner_id) IS NULL AND verification_status IN ('none', 'not_submitted'))
  );

-- Constraint: verification_status = 'approved' → shop_status MUST be 'claimed' AND owner_user_id MUST NOT be NULL
ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS check_approved_shop;
ALTER TABLE public.shops ADD CONSTRAINT check_approved_shop 
  CHECK (
    verification_status != 'approved' OR 
    (shop_status = 'claimed' AND COALESCE(owner_user_id, owner_id) IS NOT NULL)
  );

-- Constraint: shop_status = 'claimed' → owner_user_id MUST NOT be NULL AND verification_status MUST be 'approved'
ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS check_claimed_shop;
ALTER TABLE public.shops ADD CONSTRAINT check_claimed_shop 
  CHECK (
    shop_status != 'claimed' OR 
    (COALESCE(owner_user_id, owner_id) IS NOT NULL AND verification_status = 'approved')
  );

-- ============================================================================
-- STEP 5: SET DEFAULT VALUES FOR EXISTING DATA
-- ============================================================================

-- Set default role for existing users
UPDATE public.users 
SET role = 'customer' 
WHERE role IS NULL;

-- Set default account_status for existing users
UPDATE public.users 
SET account_status = 'active' 
WHERE account_status IS NULL;

-- Set default shop_status for existing shops
-- First, ensure verification_status is set correctly
UPDATE public.shops 
SET verification_status = 'not_submitted'
WHERE verification_status IS NULL OR verification_status = 'none';

UPDATE public.shops 
SET shop_status = 'unclaimed' 
WHERE shop_status IS NULL AND COALESCE(owner_user_id, owner_id) IS NULL;

UPDATE public.shops 
SET shop_status = 'claimed' 
WHERE shop_status IS NULL 
  AND COALESCE(owner_user_id, owner_id) IS NOT NULL 
  AND verification_status = 'approved';

UPDATE public.shops 
SET shop_status = 'pending' 
WHERE shop_status IS NULL 
  AND COALESCE(owner_user_id, owner_id) IS NOT NULL 
  AND verification_status = 'pending';

UPDATE public.shops 
SET shop_status = 'rejected' 
WHERE shop_status IS NULL 
  AND COALESCE(owner_user_id, owner_id) IS NOT NULL 
  AND verification_status = 'rejected';

-- ============================================================================
-- STEP 6: SYNC USER ROLES BASED ON SHOP OWNERSHIP
-- ============================================================================

-- Set role = 'owner' for users who own shops
UPDATE public.users u
SET role = 'owner', shop_id = s.id
FROM public.shops s
WHERE (s.owner_user_id = u.id OR s.owner_id = u.id)
  AND s.shop_status = 'claimed'
  AND s.verification_status = 'approved'
  AND u.role != 'owner';

-- Set shop_id for owners
UPDATE public.users u
SET shop_id = s.id
FROM public.shops s
WHERE (s.owner_user_id = u.id OR s.owner_id = u.id)
  AND s.shop_status = 'claimed'
  AND s.verification_status = 'approved'
  AND u.shop_id IS NULL;

-- ============================================================================
-- STEP 7: ADD COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.users.role IS 'User role: customer, owner, staff, or super_admin';
COMMENT ON COLUMN public.users.shop_id IS 'Foreign key to shops.id - only set for owners';
COMMENT ON COLUMN public.users.account_status IS 'Account status: active or suspended';
COMMENT ON COLUMN public.shops.shop_status IS 'Shop status: unclaimed, pending, claimed, or rejected';
COMMENT ON COLUMN public.shops.verification_status IS 'Verification status: none, pending, approved, or rejected';

