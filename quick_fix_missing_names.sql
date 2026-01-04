-- Quick Fix: Populate missing names for customers
-- Run this in Supabase SQL Editor

-- Fix WEB customers: Ensure users table has full_name
-- Only insert if user doesn't exist by ID AND email doesn't exist
INSERT INTO public.users (id, email, full_name, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        SPLIT_PART(au.email, '@', 1)
    ) as full_name,
    au.created_at
FROM auth.users au
INNER JOIN public.customers c ON c.auth_user_id = au.id
WHERE c.role = 'web'
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.email = au.email)  -- Check email doesn't exist
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = au.id)
ON CONFLICT (id) DO UPDATE
SET full_name = COALESCE(users.full_name, EXCLUDED.full_name)
WHERE users.full_name IS NULL;

-- Update existing users with NULL full_name (for WEB customers)
UPDATE public.users u
SET full_name = COALESCE(
    u.full_name,
    (SELECT SPLIT_PART(au.email, '@', 1) FROM auth.users au WHERE au.id = u.id),
    (SELECT au.raw_user_meta_data->>'name' FROM auth.users au WHERE au.id = u.id),
    (SELECT au.raw_user_meta_data->>'full_name' FROM auth.users au WHERE au.id = u.id)
)
WHERE u.full_name IS NULL
  AND EXISTS (
      SELECT 1 FROM public.customers c 
      WHERE c.auth_user_id = u.id 
      AND c.role = 'web'
      AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = u.id)
  );

-- Fix LINE customers: Ensure customer_profiles has line_display_name
-- Only insert if both id and email don't exist
INSERT INTO public.customer_profiles (id, line_user_id, line_display_name, email, full_name)
SELECT 
    c.id,
    c.line_user_id,
    'LINE User' as line_display_name,
    COALESCE(c.email, c.line_user_id || '@line.user') as email,
    'LINE User' as full_name
FROM public.customers c
WHERE c.role = 'line'
  AND c.line_user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.customer_profiles cp WHERE cp.id = c.id)
  AND NOT EXISTS (SELECT 1 FROM public.customer_profiles cp WHERE cp.email = COALESCE(c.email, c.line_user_id || '@line.user'))
ON CONFLICT (id) DO UPDATE
SET 
    line_display_name = COALESCE(customer_profiles.line_display_name, 'LINE User'),
    full_name = COALESCE(customer_profiles.full_name, 'LINE User');

-- Update existing customer_profiles with NULL line_display_name
UPDATE public.customer_profiles cp
SET line_display_name = COALESCE(cp.line_display_name, 'LINE User')
WHERE cp.line_display_name IS NULL
  AND cp.line_user_id IS NOT NULL;

