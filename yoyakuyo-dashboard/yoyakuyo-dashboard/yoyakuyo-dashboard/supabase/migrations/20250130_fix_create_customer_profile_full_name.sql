-- Migration: Fix create_customer_profile function to include full_name
-- The customer_profiles table requires full_name (NOT NULL), but the function wasn't setting it

-- ============================================
-- First, ensure full_name column exists (add if missing)
-- ============================================
DO $$
BEGIN
  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'customer_profiles' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE customer_profiles
    ADD COLUMN full_name TEXT;
    
    -- Set default values for existing rows
    UPDATE customer_profiles
    SET full_name = COALESCE(name, email, 'Customer')
    WHERE full_name IS NULL;
    
    -- Make it NOT NULL if it's required
    -- (We'll keep it nullable for now to avoid breaking existing data)
  END IF;
END $$;

-- ============================================
-- Update create_customer_profile function
-- ============================================
CREATE OR REPLACE FUNCTION create_customer_profile(
  p_customer_auth_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_full_name TEXT;
  v_has_full_name BOOLEAN;
BEGIN
  -- Generate a new UUID for the profile
  v_profile_id := gen_random_uuid();
  
  -- Use p_name as full_name (or derive from email if name is empty)
  v_full_name := COALESCE(NULLIF(p_name, ''), SPLIT_PART(p_email, '@', 1), 'Customer');
  
  -- Check if full_name column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'customer_profiles' 
    AND column_name = 'full_name'
  ) INTO v_has_full_name;
  
  -- Insert the profile with full_name if column exists
  IF v_has_full_name THEN
    INSERT INTO customer_profiles (
      id, 
      customer_auth_id, 
      email, 
      name,
      full_name,
      phone
    )
    VALUES (
      v_profile_id, 
      p_customer_auth_id, 
      p_email, 
      p_name,
      v_full_name,
      p_phone
    )
    ON CONFLICT (email) DO UPDATE
    SET 
      customer_auth_id = EXCLUDED.customer_auth_id,
      name = COALESCE(EXCLUDED.name, customer_profiles.name),
      full_name = COALESCE(EXCLUDED.full_name, customer_profiles.full_name, v_full_name),
      phone = COALESCE(EXCLUDED.phone, customer_profiles.phone)
    RETURNING id INTO v_profile_id;
  ELSE
    -- If full_name column doesn't exist, insert without it
    INSERT INTO customer_profiles (
      id, 
      customer_auth_id, 
      email, 
      name,
      phone
    )
    VALUES (
      v_profile_id, 
      p_customer_auth_id, 
      p_email, 
      p_name,
      p_phone
    )
    ON CONFLICT (email) DO UPDATE
    SET 
      customer_auth_id = EXCLUDED.customer_auth_id,
      name = COALESCE(EXCLUDED.name, customer_profiles.name),
      phone = COALESCE(EXCLUDED.phone, customer_profiles.phone)
    RETURNING id INTO v_profile_id;
  END IF;
  
  RETURN v_profile_id;
END;
$$;

-- Add comment
COMMENT ON FUNCTION create_customer_profile IS 'Creates a customer profile bypassing RLS. Handles both full_name and name columns.';

