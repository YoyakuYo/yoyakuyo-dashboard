-- Quick Admin Structure Check
-- Run this in Supabase SQL Editor to see the admin structure

-- 1. Admin user in auth.users
SELECT 
  '1. Admin in auth.users' as check_type,
  id as auth_user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'sowoumar45@gmail.com';

-- 2. Customer record with is_admin flag
SELECT 
  '2. Customer record' as check_type,
  c.id as customer_id,
  c.auth_user_id,
  c.role,
  c.is_admin,
  c.created_at,
  CASE 
    WHEN c.is_admin = true THEN '✅ ADMIN FLAG SET'
    ELSE '❌ ADMIN FLAG NOT SET'
  END as status
FROM customers c
WHERE c.auth_user_id = (
  SELECT id FROM auth.users WHERE email = 'sowoumar45@gmail.com' LIMIT 1
);

-- 3. All admins summary
SELECT 
  '3. All Admins' as check_type,
  COUNT(*) as total_admins,
  STRING_AGG(u.email, ', ') as admin_emails
FROM customers c
JOIN auth.users u ON u.id = c.auth_user_id
WHERE c.is_admin = true;

-- 4. Structure: customers table columns
SELECT 
  '4. Customers Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customers'
  AND column_name IN ('id', 'auth_user_id', 'role', 'is_admin', 'created_at')
ORDER BY 
  CASE column_name
    WHEN 'id' THEN 1
    WHEN 'auth_user_id' THEN 2
    WHEN 'role' THEN 3
    WHEN 'is_admin' THEN 4
    WHEN 'created_at' THEN 5
  END;

