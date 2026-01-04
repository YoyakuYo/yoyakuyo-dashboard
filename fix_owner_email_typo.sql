-- Fix email typo: yayakuyodemo@gmail.com -> yoyakuyodemo@gmail.com
-- This fixes the email in the users table (used by owner dashboard)

-- Check current state
SELECT 
  id,
  email,
  role,
  full_name
FROM users
WHERE email LIKE '%yayakuyo%' OR email LIKE '%yoyakuyo%'
ORDER BY email;

-- Fix the typo in users table
UPDATE users
SET email = REPLACE(email, 'yayakuyodemo@gmail.com', 'yoyakuyodemo@gmail.com')
WHERE email = 'yayakuyodemo@gmail.com';

-- Also fix in auth.users if it exists there
-- Note: This requires admin access to auth.users
DO $$
BEGIN
  -- Try to update auth.users (may fail if no access)
  UPDATE auth.users
  SET email = 'yoyakuyodemo@gmail.com',
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{email}',
        '"yoyakuyodemo@gmail.com"'
      )
  WHERE email = 'yayakuyodemo@gmail.com';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not update auth.users (may require admin access): %', SQLERRM;
END $$;

-- Verify the fix
SELECT 
  id,
  email,
  role,
  full_name,
  '✅ Fixed' as status
FROM users
WHERE email = 'yoyakuyodemo@gmail.com';

-- Show any remaining typos
SELECT 
  id,
  email,
  role,
  '❌ Still has typo' as status
FROM users
WHERE email LIKE '%yayakuyo%';

