-- ============================================
-- FIX: Recreate get_or_create_customer_from_line function with correct JSONB casting
-- ============================================

-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_or_create_customer_from_line(TEXT);

-- Recreate with correct JSONB casting
CREATE OR REPLACE FUNCTION get_or_create_customer_from_line(line_user_id_param TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_customer_id UUID;
  new_auth_user_id UUID;
BEGIN
  -- Check if line_accounts already exists
  SELECT la.customer_id INTO existing_customer_id
  FROM line_accounts la
  WHERE la.line_user_id = line_user_id_param
  LIMIT 1;

  IF existing_customer_id IS NOT NULL THEN
    RETURN existing_customer_id;
  END IF;

  -- Create new auth user (passwordless)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  )
  VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'line_' || line_user_id_param || '@line.user',
    '',
    now(),
    now(),
    now(),
    '{"provider":"line","providers":["line"]}'::jsonb,
    jsonb_build_object('line_user_id', line_user_id_param),
    false,
    'authenticated'
  )
  RETURNING id INTO new_auth_user_id;

  -- Create customer with LINE role
  INSERT INTO customers (id, role, line_user_id)
  VALUES (new_auth_user_id, 'line', line_user_id_param)
  ON CONFLICT (id) DO UPDATE SET
    role = 'line',
    line_user_id = EXCLUDED.line_user_id;

  -- Create line_accounts mapping
  INSERT INTO line_accounts (customer_id, line_user_id)
  VALUES (new_auth_user_id, line_user_id_param)
  ON CONFLICT (line_user_id) DO UPDATE SET customer_id = EXCLUDED.customer_id;

  RETURN new_auth_user_id;
END;
$$;

COMMENT ON FUNCTION get_or_create_customer_from_line IS 'Gets or creates customer from LINE user_id. Returns customer_id (which is auth.users.id)';

