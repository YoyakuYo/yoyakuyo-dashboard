-- ============================================================================
-- ENSURE STAFF ROLE SUPPORT FOR STAFF LOGIN
-- ============================================================================
-- This migration ensures the users table can store 'staff' role
-- and that the user_role enum includes 'staff'
-- ============================================================================

-- Step 1: Ensure user_role enum exists and includes 'staff'
DO $$
BEGIN
  -- Check if user_role enum exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    -- Create enum if it doesn't exist
    CREATE TYPE user_role AS ENUM ('customer', 'owner', 'staff', 'super_admin');
    RAISE NOTICE 'Created user_role enum type';
  ELSE
    -- Enum exists, check if 'staff' is in it
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'staff' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
      -- Add 'staff' to existing enum
      ALTER TYPE user_role ADD VALUE 'staff';
      RAISE NOTICE 'Added staff value to user_role enum';
    ELSE
      RAISE NOTICE 'staff value already exists in user_role enum';
    END IF;
  END IF;
END $$;

-- Step 2: Ensure users table has role column
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
  ELSE
    RAISE NOTICE 'role column already exists in users table';
  END IF;
END $$;

-- Step 3: Ensure account_status column exists (for account management)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'account_status'
  ) THEN
    -- Create account_status enum if needed
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
      CREATE TYPE account_status AS ENUM ('active', 'suspended');
    END IF;
    ALTER TABLE public.users ADD COLUMN account_status account_status DEFAULT 'active';
    RAISE NOTICE 'Added account_status column to users table';
  ELSE
    RAISE NOTICE 'account_status column already exists in users table';
  END IF;
END $$;

-- Step 4: Ensure staff_profiles table exists and is linked correctly
-- (This table is for platform staff, not shop employees)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'staff_profiles'
  ) THEN
    RAISE NOTICE 'staff_profiles table does not exist - it may need to be created separately';
  ELSE
    RAISE NOTICE 'staff_profiles table exists';
  END IF;
END $$;

-- Step 5: Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Step 6: Add comment
COMMENT ON COLUMN public.users.role IS 'User role: customer, owner, staff, or super_admin. Staff can access staff dashboard.';

