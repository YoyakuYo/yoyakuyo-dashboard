-- Complete diagnosis of customer data mismatch
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5

-- 1. Check customers table
SELECT 
    '1. CUSTOMERS TABLE' as source,
    c.id,
    c.role,
    c.line_user_id,
    c.auth_user_id,
    c.email as customer_email,
    c.name as customer_name,
    CASE 
        WHEN c.line_user_id IS NOT NULL THEN '✅ HAS line_user_id → LINE'
        WHEN c.auth_user_id IS NOT NULL AND c.line_user_id IS NULL THEN '✅ HAS auth_user_id, NO line_user_id → WEB'
        WHEN c.email IS NOT NULL AND c.auth_user_id IS NULL AND c.line_user_id IS NULL THEN '✅ HAS email only → GUEST'
        ELSE '❓ UNKNOWN TYPE'
    END as customer_table_type
FROM public.customers c
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- 2. Check customer_profiles table
SELECT 
    '2. CUSTOMER_PROFILES TABLE' as source,
    cp.id,
    cp.line_user_id,
    cp.line_display_name,
    cp.email as profile_email,
    CASE 
        WHEN cp.line_user_id IS NOT NULL THEN '✅ HAS line_user_id → LINE PROFILE EXISTS'
        ELSE '❌ NO LINE PROFILE'
    END as profile_type
FROM public.customer_profiles cp
WHERE cp.id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
   OR cp.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- 3. Check users table
SELECT 
    '3. USERS TABLE' as source,
    u.id,
    u.email,
    u.full_name,
    CASE 
        WHEN u.email LIKE '%@line.user' THEN '⚠️ LINE EMAIL IN USERS TABLE (WRONG)'
        ELSE '✅ REGULAR EMAIL'
    END as users_table_status
FROM public.users u
WHERE u.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- 4. Check auth.users
SELECT 
    '4. AUTH.USERS' as source,
    au.id,
    au.email,
    au.raw_user_meta_data->>'line_user_id' as metadata_line_user_id,
    CASE 
        WHEN au.email LIKE '%@line.user' THEN '✅ LINE EMAIL'
        WHEN au.raw_user_meta_data->>'line_user_id' IS NOT NULL THEN '✅ HAS LINE USER ID IN METADATA'
        ELSE '❌ NOT LINE'
    END as auth_type
FROM auth.users au
WHERE au.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- 5. Summary and recommendation
SELECT 
    '5. SUMMARY' as source,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.customers c 
            WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5' 
            AND c.line_user_id IS NOT NULL
        ) THEN '✅ CUSTOMERS TABLE SAYS: LINE'
        WHEN EXISTS (
            SELECT 1 FROM public.customers c 
            WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5' 
            AND c.role = 'line'
        ) THEN '✅ CUSTOMERS TABLE SAYS: LINE (by role)'
        WHEN EXISTS (
            SELECT 1 FROM public.customers c 
            WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5' 
            AND c.role = 'web'
        ) THEN '❌ CUSTOMERS TABLE SAYS: WEB (BUT AUTH SAYS LINE - MISMATCH!)'
        ELSE '❓ UNKNOWN'
    END as diagnosis,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users au 
            WHERE au.id = '78fea290-ef9a-43c8-96d6-90460c04efe5' 
            AND (au.email LIKE '%@line.user' OR au.raw_user_meta_data->>'line_user_id' IS NOT NULL)
        ) THEN '✅ AUTH.USERS SAYS: LINE'
        ELSE '❌ AUTH.USERS SAYS: NOT LINE'
    END as auth_diagnosis;

