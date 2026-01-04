-- Fix email conflict in users table
-- Email: yayakuyodemo@gmail.com
-- Correct ID: e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f

-- Step 1: Find which ID already has this email
SELECT 
    'EXISTING ENTRY WITH EMAIL' as check_type,
    u.id,
    u.email,
    u.full_name,
    CASE 
        WHEN u.id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f' THEN '✅ CORRECT ID'
        ELSE '❌ WRONG ID HAS THIS EMAIL'
    END as status
FROM public.users u
WHERE u.email = 'yayakuyodemo@gmail.com';

-- Step 2: Check if correct ID exists
SELECT 
    'CORRECT ID CHECK' as check_type,
    u.id,
    u.email,
    u.full_name
FROM public.users u
WHERE u.id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

-- Step 3: Update the existing entry to use correct ID (if wrong ID has the email)
-- First, delete the wrong entry if it exists
DELETE FROM public.users
WHERE email = 'yayakuyodemo@gmail.com'
  AND id != 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

-- Step 4: Now insert/update with correct ID
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'display_name',
        'Demo User'
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

-- Step 5: Verify the fix
SELECT 
    'VERIFICATION' as check_type,
    u.id,
    u.email,
    u.full_name,
    CASE 
        WHEN u.id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
         AND u.email = 'yayakuyodemo@gmail.com'
         AND u.full_name IS NOT NULL
        THEN '✅ FIXED - CORRECT ID WITH NAME'
        WHEN u.id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
         AND u.email = 'yayakuyodemo@gmail.com'
         AND u.full_name IS NULL
        THEN '⚠️ CORRECT ID BUT NO NAME'
        ELSE '❌ STILL HAS ISSUES'
    END as status
FROM public.users u
WHERE u.id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
   OR u.email = 'yayakuyodemo@gmail.com';

