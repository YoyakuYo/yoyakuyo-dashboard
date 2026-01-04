-- Force create users table entry - check for conflicts first
-- Customer auth_user_id: e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f

-- Step 1: Check if entry already exists
SELECT 
    'CHECK EXISTING' as check_type,
    u.id,
    u.email,
    u.full_name
FROM public.users u
WHERE u.id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
   OR u.email = 'yayakuyodemo@gmail.com';

-- Step 2: Check auth.users data
SELECT 
    'AUTH DATA' as check_type,
    au.id,
    au.email,
    au.raw_user_meta_data->>'name' as metadata_name,
    au.raw_user_meta_data->>'full_name' as metadata_full_name,
    au.raw_user_meta_data as full_metadata
FROM auth.users au
WHERE au.id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

-- Step 3: Force insert/update with ON CONFLICT
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'display_name',
        'Demo User'  -- Default name if no metadata
    ) as full_name,
    COALESCE(au.created_at, NOW()),
    NOW()
FROM auth.users au
WHERE au.id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    full_name = COALESCE(users.full_name, EXCLUDED.full_name),
    updated_at = NOW();

-- Step 4: If email conflict exists, update that entry
UPDATE public.users
SET 
    full_name = COALESCE(
        full_name,
        (SELECT 
            COALESCE(
                au.raw_user_meta_data->>'name',
                au.raw_user_meta_data->>'full_name',
                au.raw_user_meta_data->>'display_name',
                'Demo User'
            )
         FROM auth.users au 
         WHERE au.email = 'yayakuyodemo@gmail.com'
         LIMIT 1
        )
    ),
    updated_at = NOW()
WHERE email = 'yayakuyodemo@gmail.com'
  AND id != 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
  AND full_name IS NULL;

-- Step 5: Final verification
SELECT 
    'FINAL VERIFICATION' as check_type,
    u.id,
    u.email,
    u.full_name,
    CASE 
        WHEN u.full_name IS NOT NULL THEN '✅ SUCCESS - HAS NAME'
        ELSE '❌ STILL NULL'
    END as status
FROM public.users u
WHERE u.id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

