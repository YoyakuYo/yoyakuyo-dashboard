-- Check what data exists in auth.users for these WEB customers
SELECT 
    'AUTH.USERS DATA' as check_type,
    au.id,
    au.email,
    au.raw_user_meta_data->>'name' as metadata_name,
    au.raw_user_meta_data->>'full_name' as metadata_full_name,
    au.raw_user_meta_data as full_metadata
FROM auth.users au
WHERE au.id IN (
    '16e3a9f0-7a42-471f-a352-9e573555ca62',
    '78fea290-ef9a-43c8-96d6-90460c04efe5'
);

-- Fix the second customer (wrong name - looks like LINE ID)
UPDATE public.users
SET 
    full_name = COALESCE(
        -- Try to get from auth.users metadata
        (SELECT 
            COALESCE(
                au.raw_user_meta_data->>'name',
                au.raw_user_meta_data->>'full_name',
                au.raw_user_meta_data->>'display_name'
            )
         FROM auth.users au 
         WHERE au.id = users.id
        ),
        -- If no metadata, format email properly (remove "line_" prefix if present)
        INITCAP(REPLACE(REPLACE(REPLACE(SPLIT_PART(email, '@', 1), 'line_', ''), '.', ' '), '_', ' '))
    ),
    updated_at = NOW()
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  AND (full_name LIKE 'line_%' OR full_name IS NULL);

-- Create users entry for first customer (only if id doesn't exist AND email doesn't exist)
INSERT INTO public.users (id, email, full_name, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'display_name',
        INITCAP(REPLACE(REPLACE(SPLIT_PART(au.email, '@', 1), '.', ' '), '_', ' '))
    ) as full_name,
    au.created_at
FROM auth.users au
WHERE au.id = '16e3a9f0-7a42-471f-a352-9e573555ca62'
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.email = au.email)
ON CONFLICT (id) DO UPDATE
SET 
    full_name = COALESCE(users.full_name, EXCLUDED.full_name),
    updated_at = NOW();

-- If email already exists but id doesn't, just update the existing entry's full_name if it's NULL
UPDATE public.users u
SET 
    full_name = COALESCE(
        u.full_name,
        (SELECT 
            COALESCE(
                au.raw_user_meta_data->>'name',
                au.raw_user_meta_data->>'full_name',
                au.raw_user_meta_data->>'display_name',
                INITCAP(REPLACE(REPLACE(SPLIT_PART(au.email, '@', 1), '.', ' '), '_', ' '))
            )
         FROM auth.users au 
         WHERE au.email = u.email
         LIMIT 1
        )
    ),
    updated_at = NOW()
WHERE u.email = (SELECT email FROM auth.users WHERE id = '16e3a9f0-7a42-471f-a352-9e573555ca62')
  AND u.id != '16e3a9f0-7a42-471f-a352-9e573555ca62'
  AND u.full_name IS NULL;

-- Verify the fix
SELECT 
    'FIXED WEB CUSTOMERS' as check_type,
    c.id as customer_id,
    c.role,
    c.auth_user_id,
    u.email,
    u.full_name,
    CASE 
        WHEN u.full_name IS NOT NULL AND u.full_name NOT LIKE 'line_%' THEN '✅ FIXED'
        ELSE '❌ STILL WRONG'
    END as status
FROM public.customers c
LEFT JOIN public.users u ON u.id = c.auth_user_id
WHERE c.role = 'web'
  AND c.auth_user_id IN (
    '16e3a9f0-7a42-471f-a352-9e573555ca62',
    '78fea290-ef9a-43c8-96d6-90460c04efe5'
  )
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = c.auth_user_id);

