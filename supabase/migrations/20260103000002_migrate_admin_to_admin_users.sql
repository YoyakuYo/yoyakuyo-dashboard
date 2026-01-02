-- Migration: Migrate existing admin account from owners to admin_users table
-- This ensures the admin account exists in the new admin_users table
-- NOTE: This migration requires 20260103000001_create_admin_users_table.sql to run first

DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'sowoumar45@gmail.com';
  table_exists BOOLEAN;
  user_exists BOOLEAN;
BEGIN
  -- Check if admin_users table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_users'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE NOTICE 'admin_users table does not exist. Please run 20260103000001_create_admin_users_table.sql first.';
    RETURN;
  END IF;

  -- Find the admin user in auth.users by email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'Admin user not found in auth.users with email: %', admin_email;
    RETURN;
  END IF;

  -- Check if admin already exists in admin_users
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE id = admin_user_id) INTO user_exists;
  
  IF user_exists THEN
    RAISE NOTICE 'Admin user already exists in admin_users table with ID: %', admin_user_id;
    RETURN;
  END IF;

  -- Insert admin into admin_users table
  INSERT INTO admin_users (id, email, role, status, created_at, updated_at)
  VALUES (
    admin_user_id,
    admin_email,
    'admin', -- Default role
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Admin user migrated to admin_users table with ID: %', admin_user_id;
END $$;

