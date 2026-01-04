-- Create users table entry for WEB customer
-- Customer auth_user_id: e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f
-- Email: yayakuyodemo@gmail.com

-- Step 1: Create users table entry with name from auth.users metadata
INSERT INTO public.users (id, email, full_name, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'display_name',
        INITCAP(REPLACE(REPLACE(REPLACE(SPLIT_PART(au.email, '@', 1), '.', ' '), '_', ' '), '-', ' '))
    ) as full_name,
    au.created_at
FROM auth.users au
WHERE au.id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.email = au.email)
ON CONFLICT (id) DO UPDATE
SET 
    full_name = COALESCE(users.full_name, EXCLUDED.full_name),
    email = COALESCE(users.email, EXCLUDED.email),
    updated_at = NOW()
WHERE users.full_name IS NULL;

-- Step 2: If email already exists with different ID, update that entry
UPDATE public.users u
SET 
    full_name = COALESCE(
        u.full_name,
        (SELECT 
            COALESCE(
                au.raw_user_meta_data->>'name',
                au.raw_user_meta_data->>'full_name',
                au.raw_user_meta_data->>'display_name',
                INITCAP(REPLACE(REPLACE(REPLACE(SPLIT_PART(au.email, '@', 1), '.', ' '), '_', ' '), '-', ' '))
            )
         FROM auth.users au 
         WHERE au.email = u.email
         LIMIT 1
        )
    ),
    updated_at = NOW()
WHERE u.email = 'yayakuyodemo@gmail.com'
  AND u.id != 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
  AND u.full_name IS NULL;

-- Step 3: Verify the fix
SELECT 
    'VERIFICATION' as check_type,
    c.id,
    c.role,
    c.auth_user_id,
    au.email,
    u.full_name,
    CASE 
        WHEN u.full_name IS NOT NULL 
         AND u.full_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         AND u.full_name NOT LIKE 'line_%'
         AND NOT (u.full_name LIKE 'U%' AND LENGTH(u.full_name) > 20)
        THEN '✅ FIXED - HAS PROPER NAME'
        WHEN u.id IS NULL THEN '❌ STILL NO USERS ENTRY'
        ELSE '⚠️ NAME STILL NULL OR WRONG'
    END as status
FROM public.customers c
LEFT JOIN auth.users au ON au.id = c.auth_user_id
LEFT JOIN public.users u ON u.id = c.auth_user_id
WHERE c.auth_user_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

