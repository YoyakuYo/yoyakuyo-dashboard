-- Fix WEB customer name - update from "Web Customer" to actual name
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5

-- Check auth.users for the actual name
SELECT 
  id,
  email,
  raw_user_meta_data->>'name' as metadata_name,
  raw_user_meta_data->>'full_name' as metadata_full_name,
  raw_user_meta_data
FROM auth.users
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Update users table with better name
-- Extract name from email or use a better default
UPDATE users
SET full_name = COALESCE(
  (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'),
  (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'),
  SPLIT_PART(email, '@', 1), -- Extract from email
  'Web Customer'
)
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Verify
SELECT 
  u.id,
  u.email,
  u.full_name,
  c.id as customer_id,
  c.role,
  '✅ Updated' as status
FROM users u
JOIN customers c ON c.auth_user_id = u.id
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

