-- Migration: Fix create_customer_profile function to include full_name
-- The customer_profiles table requires full_name (NOT NULL), but the function wasn't setting it

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
BEGIN
  -- Generate a new UUID for the profile
  v_profile_id := gen_random_uuid();
  
  -- Use p_name as full_name (or derive from email if name is empty)
  v_full_name := COALESCE(NULLIF(p_name, ''), SPLIT_PART(p_email, '@', 1), 'Customer');
  
  -- Check if full_name column exists in customer_profiles
  -- If it exists and is NOT NULL, we must provide it
  -- Insert the profile with both name and full_name (if column exists)
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
  
  RETURN v_profile_id;
EXCEPTION
  WHEN undefined_column THEN
    -- If full_name column doesn't exist, try without it
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
    
    RETURN v_profile_id;
END;
$$;

-- Add comment
COMMENT ON FUNCTION create_customer_profile IS 'Creates a customer profile bypassing RLS. Handles both full_name and name columns.';

