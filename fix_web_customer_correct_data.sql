-- Fix WEB customer to use correct email and name from auth.users
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5

-- First, check what's in auth.users
SELECT 
  id,
  email,
  raw_user_meta_data->>'name' as metadata_name,
  raw_user_meta_data->>'full_name' as metadata_full_name,
  raw_user_meta_data
FROM auth.users
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Update users table with correct data from auth.users
UPDATE users
SET 
  email = COALESCE(
    (SELECT email FROM auth.users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'),
    email
  ),
  full_name = COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'),
    -- If no metadata, extract from email (remove @domain)
    CASE 
      WHEN email LIKE '%@%' THEN SPLIT_PART(email, '@', 1)
      ELSE full_name
    END
  )
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- If auth.users has a real email (not LINE email), use it
-- Otherwise, we might need to check if this customer should actually be a LINE customer
-- But for now, let's just fix the users table entry

-- Verify the fix
SELECT 
  u.id,
  u.email,
  u.full_name,
  c.id as customer_id,
  c.role,
  c.email as customer_email,
  c.name as customer_name,
  '✅ Updated' as status
FROM users u
JOIN customers c ON c.auth_user_id = u.id
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

