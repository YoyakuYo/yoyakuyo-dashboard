-- Fix misclassified LINE customer that was marked as WEB
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5

-- Step 1: Check current state
SELECT 
    'BEFORE FIX' as check_type,
    c.id,
    c.role,
    c.line_user_id,
    c.auth_user_id,
    u.full_name as users_table_name,
    u.email as users_table_email,
    cp.line_display_name as customer_profiles_name
FROM public.customers c
LEFT JOIN public.users u ON u.id = c.auth_user_id
LEFT JOIN public.customer_profiles cp ON cp.line_user_id = c.line_user_id OR cp.id = c.id
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Step 2: Fix customer role (change from 'web' to 'line')
UPDATE public.customers
SET 
    role = 'line',
    auth_user_id = NULL,  -- LINE customers don't have auth_user_id
    line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'  -- Ensure line_user_id is set
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  AND role = 'web';

-- Step 3: Remove users table entry (LINE customers shouldn't be in users table)
DELETE FROM public.users
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  AND email LIKE '%@line.user';

-- Step 4: Verify the fix
SELECT 
    'AFTER FIX' as check_type,
    c.id,
    c.role,
    c.line_user_id,
    c.auth_user_id,
    cp.line_display_name as customer_profiles_name,
    CASE 
        WHEN c.role = 'line' AND cp.line_display_name IS NOT NULL THEN '✅ FIXED - LINE CUSTOMER'
        WHEN c.role = 'line' AND cp.line_display_name IS NULL THEN '⚠️ FIXED ROLE BUT NO NAME IN PROFILES'
        ELSE '❌ STILL WRONG'
    END as status
FROM public.customers c
LEFT JOIN public.customer_profiles cp ON cp.line_user_id = c.line_user_id OR cp.id = c.id
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

