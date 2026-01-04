-- Fix customer names using actual data from auth.users and customer_profiles
-- This updates existing records with real names, not defaults

-- ============================================
-- 1. Update WEB customers: Get names from auth.users metadata or create from email
-- ============================================
UPDATE public.users u
SET 
    full_name = COALESCE(
        u.full_name,  -- Keep existing if present
        -- Try to get from auth.users metadata
        (SELECT 
            COALESCE(
                au.raw_user_meta_data->>'name',
                au.raw_user_meta_data->>'full_name',
                au.raw_user_meta_data->>'display_name'
            )
         FROM auth.users au 
         WHERE au.id = u.id
        ),
        -- Fallback: Use email prefix but make it look like a name
        INITCAP(REPLACE(SPLIT_PART(u.email, '@', 1), '.', ' '))
    ),
    updated_at = NOW()
WHERE u.full_name IS NULL
  AND EXISTS (
      SELECT 1 FROM public.customers c 
      WHERE c.auth_user_id = u.id 
      AND c.role = 'web'
      AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = u.id)
  );

-- Create users entries for WEB customers that don't have them yet (only if email doesn't conflict)
INSERT INTO public.users (id, email, full_name, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'display_name',
        INITCAP(REPLACE(SPLIT_PART(au.email, '@', 1), '.', ' '))
    ) as full_name,
    au.created_at
FROM auth.users au
INNER JOIN public.customers c ON c.auth_user_id = au.id
WHERE c.role = 'web'
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.email = au.email)
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = au.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. Update LINE customers: Get actual line_display_name from customer_profiles
-- ============================================
-- Update existing customer_profiles with actual line_display_name if it exists
UPDATE public.customer_profiles cp
SET 
    line_display_name = COALESCE(
        cp.line_display_name,
        -- Try to get from another customer_profiles entry with same line_user_id
        (SELECT cp2.line_display_name 
         FROM public.customer_profiles cp2 
         WHERE cp2.line_user_id = cp.line_user_id 
         AND cp2.line_display_name IS NOT NULL 
         LIMIT 1),
        -- Try to get from bookings if they have customer_name
        (SELECT b.customer_name 
         FROM public.bookings b 
         WHERE b.line_user_id = cp.line_user_id 
         AND b.customer_name IS NOT NULL 
         ORDER BY b.created_at DESC 
         LIMIT 1)
    ),
    full_name = COALESCE(
        cp.full_name,
        cp.line_display_name,
        (SELECT cp2.line_display_name 
         FROM public.customer_profiles cp2 
         WHERE cp2.line_user_id = cp.line_user_id 
         AND cp2.line_display_name IS NOT NULL 
         LIMIT 1)
    ),
    updated_at = NOW()
WHERE cp.line_user_id IS NOT NULL
  AND (cp.line_display_name IS NULL OR cp.full_name IS NULL)
  AND EXISTS (SELECT 1 FROM public.customers c WHERE c.line_user_id = cp.line_user_id AND c.role = 'line');

-- Create customer_profiles for LINE customers that don't have them (only if id and email don't conflict)
INSERT INTO public.customer_profiles (id, line_user_id, line_display_name, email, full_name, created_at)
SELECT 
    c.id,
    c.line_user_id,
    COALESCE(
        -- Try to get from existing customer_profiles
        (SELECT cp.line_display_name 
         FROM public.customer_profiles cp 
         WHERE cp.line_user_id = c.line_user_id 
         AND cp.line_display_name IS NOT NULL 
         LIMIT 1),
        -- Try to get from bookings
        (SELECT b.customer_name 
         FROM public.bookings b 
         WHERE b.line_user_id = c.line_user_id 
         AND b.customer_name IS NOT NULL 
         ORDER BY b.created_at DESC 
         LIMIT 1),
        -- Last resort: Use line_user_id as name
        'LINE User ' || SUBSTRING(c.line_user_id, 1, 8)
    ) as line_display_name,
    COALESCE(c.email, c.line_user_id || '@line.user') as email,
    COALESCE(
        (SELECT cp.line_display_name 
         FROM public.customer_profiles cp 
         WHERE cp.line_user_id = c.line_user_id 
         AND cp.line_display_name IS NOT NULL 
         LIMIT 1),
        (SELECT b.customer_name 
         FROM public.bookings b 
         WHERE b.line_user_id = c.line_user_id 
         AND b.customer_name IS NOT NULL 
         ORDER BY b.created_at DESC 
         LIMIT 1),
        'LINE User ' || SUBSTRING(c.line_user_id, 1, 8)
    ) as full_name,
    c.created_at
FROM public.customers c
WHERE c.role = 'line'
  AND c.line_user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.customer_profiles cp WHERE cp.id = c.id)
  AND NOT EXISTS (
      SELECT 1 FROM public.customer_profiles cp 
      WHERE cp.email = COALESCE(c.email, c.line_user_id || '@line.user')
  )
ON CONFLICT (id) DO UPDATE
SET 
    line_display_name = COALESCE(customer_profiles.line_display_name, EXCLUDED.line_display_name),
    full_name = COALESCE(customer_profiles.full_name, EXCLUDED.full_name),
    updated_at = NOW();

