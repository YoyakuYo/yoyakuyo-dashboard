-- Add staff user for omarsowbarca45@gmail.com
-- This will find the user ID and insert into staff_profiles

DO $$
DECLARE
  user_uuid UUID;
  user_email TEXT := 'omarsowbarca45@gmail.com';
BEGIN
  -- Get user ID from email
  SELECT id INTO user_uuid
  FROM users
  WHERE email = user_email;
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Insert into staff_profiles
  INSERT INTO staff_profiles (auth_user_id, full_name, email, active, is_super_admin)
  VALUES (
    user_uuid,
    'Omar Sowbarca',  -- Update name if needed
    user_email,
    true,
    true  -- First admin - can manage other staff
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET 
    active = true,
    is_super_admin = true,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Staff user added successfully!';
  RAISE NOTICE 'User ID: %', user_uuid;
  RAISE NOTICE 'Email: %', user_email;
END $$;

-- Verify the staff user was added
SELECT 
  sp.id,
  sp.auth_user_id,
  sp.full_name,
  sp.email,
  sp.active,
  sp.is_super_admin,
  u.email AS user_email,
  u.full_name AS user_full_name
FROM staff_profiles sp
JOIN users u ON u.id = sp.auth_user_id
WHERE sp.email = 'omarsowbarca45@gmail.com';

