-- SQL Script to Fix Missing Customer Names
-- This script populates missing names for WEB and LINE customers

-- ============================================
-- 1. Fix WEB customers: Create/Update users table entries with names from auth.users
-- ============================================
-- For WEB customers that have auth_user_id but no entry in users table
-- Only insert if user doesn't exist by ID AND email doesn't exist
INSERT INTO public.users (id, email, full_name, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        -- Try to get name from auth.users metadata first
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        -- Fallback to email prefix
        SPLIT_PART(au.email, '@', 1)
    ) as full_name,
    au.created_at
FROM auth.users au
INNER JOIN public.customers c ON c.auth_user_id = au.id
WHERE c.role = 'web'
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.email = au.email)  -- Check email doesn't exist
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = au.id)  -- Exclude owners
ON CONFLICT (id) DO UPDATE
SET 
    full_name = COALESCE(users.full_name, EXCLUDED.full_name),
    updated_at = NOW()
WHERE users.full_name IS NULL;

-- Update existing users table entries that have NULL full_name
UPDATE public.users u
SET 
    full_name = COALESCE(
        u.full_name,
        -- Try to get from auth.users metadata
        (SELECT au.raw_user_meta_data->>'name' FROM auth.users au WHERE au.id = u.id),
        (SELECT au.raw_user_meta_data->>'full_name' FROM auth.users au WHERE au.id = u.id),
        -- Fallback to email prefix
        SPLIT_PART(u.email, '@', 1)
    ),
    updated_at = NOW()
WHERE u.full_name IS NULL
  AND EXISTS (
      SELECT 1 FROM public.customers c 
      WHERE c.auth_user_id = u.id 
      AND c.role = 'web'
      AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = u.id)
  );

-- ============================================
-- 2. Fix LINE customers: Update customer_profiles with line_display_name
-- ============================================
-- For LINE customers, ensure customer_profiles entries exist with line_display_name
-- Only insert if both id and email don't exist
INSERT INTO public.customer_profiles (id, line_user_id, line_display_name, email, full_name, created_at)
SELECT 
    c.id,
    c.line_user_id,
    COALESCE(
        (SELECT cp.line_display_name FROM public.customer_profiles cp WHERE cp.line_user_id = c.line_user_id LIMIT 1),
        'LINE User'
    ) as line_display_name,
    COALESCE(c.email, c.line_user_id || '@line.user') as email,
    COALESCE(
        (SELECT cp.line_display_name FROM public.customer_profiles cp WHERE cp.line_user_id = c.line_user_id LIMIT 1),
        'LINE User'
    ) as full_name,
    c.created_at
FROM public.customers c
WHERE c.role = 'line'
  AND c.line_user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.customer_profiles cp WHERE cp.id = c.id)
  AND NOT EXISTS (SELECT 1 FROM public.customer_profiles cp WHERE cp.email = COALESCE(c.email, c.line_user_id || '@line.user'))
ON CONFLICT (id) DO UPDATE
SET 
    line_display_name = COALESCE(customer_profiles.line_display_name, EXCLUDED.line_display_name),
    full_name = COALESCE(customer_profiles.full_name, EXCLUDED.full_name),
    updated_at = NOW();

-- Update existing customer_profiles that have NULL line_display_name
UPDATE public.customer_profiles cp
SET 
    line_display_name = COALESCE(
        cp.line_display_name,
        'LINE User'
    ),
    updated_at = NOW()
WHERE cp.line_display_name IS NULL
  AND cp.line_user_id IS NOT NULL
  AND EXISTS (
      SELECT 1 FROM public.customers c 
      WHERE c.line_user_id = cp.line_user_id 
      AND c.role = 'line'
  );

-- ============================================
-- 3. Summary: Show what was fixed
-- ============================================
SELECT 
    'WEB customers with names now' as check_type,
    COUNT(*) as count
FROM public.customers c
INNER JOIN public.users u ON u.id = c.auth_user_id
WHERE c.role = 'web'
  AND u.full_name IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = c.auth_user_id)
UNION ALL
SELECT 
    'LINE customers with names now' as check_type,
    COUNT(*) as count
FROM public.customers c
INNER JOIN public.customer_profiles cp ON cp.line_user_id = c.line_user_id
WHERE c.role = 'line'
  AND cp.line_display_name IS NOT NULL;

