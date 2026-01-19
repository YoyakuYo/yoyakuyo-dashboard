-- Verification query: Check admin structure in Supabase
-- This shows how admins are structured with the role-based approach

-- 1. Check if admin user exists in auth.users
SELECT 
  'auth.users' as table_name,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'sowoumar45@gmail.com';

-- 2. Check if admin has customer record with is_admin flag
SELECT 
  'customers table' as table_name,
  c.id as customer_id,
  c.auth_user_id,
  c.role,
  c.is_admin,
  c.created_at,
  u.email as auth_email
FROM customers c
LEFT JOIN auth.users u ON u.id = c.auth_user_id
WHERE u.email = 'sowoumar45@gmail.com' OR c.auth_user_id IN (
  SELECT id FROM auth.users WHERE email = 'sowoumar45@gmail.com'
);

-- 3. Check all customers with is_admin = true
SELECT 
  'All admins' as info,
  c.id as customer_id,
  c.auth_user_id,
  c.role,
  c.is_admin,
  u.email,
  c.created_at
FROM customers c
LEFT JOIN auth.users u ON u.id = c.auth_user_id
WHERE c.is_admin = true
ORDER BY c.created_at DESC;

-- 4. Check customers table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- 5. Check if admins table still exists (should be deprecated)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'admins'
    ) THEN 'admins table EXISTS (deprecated)'
    ELSE 'admins table DOES NOT EXIST (correct)'
  END as admins_table_status;

-- 6. Summary: Admin verification
SELECT 
  'Admin Verification Summary' as summary,
  (SELECT COUNT(*) FROM customers WHERE is_admin = true) as total_admins,
  (SELECT COUNT(*) FROM customers c 
   JOIN auth.users u ON u.id = c.auth_user_id 
   WHERE u.email = 'sowoumar45@gmail.com' AND c.is_admin = true) as admin_user_is_admin,
  (SELECT COUNT(*) FROM customers c 
   JOIN auth.users u ON u.id = c.auth_user_id 
   WHERE u.email = 'sowoumar45@gmail.com') as admin_user_has_customer_record;

