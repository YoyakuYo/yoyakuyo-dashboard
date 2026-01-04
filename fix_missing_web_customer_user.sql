-- Fix missing WEB customer entry in users table
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5
-- Auth User ID: 78fea290-ef9a-43c8-96d6-90460c04efe5

-- First, check if this customer has any data in auth.users
SELECT 
  id,
  email,
  raw_user_meta_data->>'name' as metadata_name,
  raw_user_meta_data->>'full_name' as metadata_full_name,
  raw_user_meta_data
FROM auth.users
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Check the customer record
SELECT 
  id,
  role,
  email,
  name,
  auth_user_id,
  created_at
FROM customers
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Create/update users table entry
-- We'll use email from auth.users or generate a placeholder
INSERT INTO users (id, email, full_name)
SELECT 
  au.id,
  COALESCE(au.email, 'web_' || au.id || '@user.local'),
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    'Web Customer'
  ) as full_name
FROM auth.users au
WHERE au.id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
ON CONFLICT (id) DO UPDATE
SET 
  email = COALESCE(EXCLUDED.email, users.email),
  full_name = COALESCE(EXCLUDED.full_name, users.full_name);

-- Verify the fix
SELECT 
  u.id,
  u.email,
  u.full_name,
  c.id as customer_id,
  c.role,
  '✅ Fixed' as status
FROM users u
JOIN customers c ON c.auth_user_id = u.id
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

