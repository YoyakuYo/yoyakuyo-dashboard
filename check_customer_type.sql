-- Check if this customer is actually LINE or WEB
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5

SELECT 
    'CUSTOMER TABLE DATA' as check_type,
    c.id,
    c.role,
    c.line_user_id,
    c.auth_user_id,
    c.email as customer_email,
    c.name as customer_name,
    CASE 
        WHEN c.line_user_id IS NOT NULL THEN 'LINE CUSTOMER'
        WHEN c.auth_user_id IS NOT NULL THEN 'WEB CUSTOMER'
        WHEN c.email IS NOT NULL THEN 'GUEST CUSTOMER'
        ELSE 'UNKNOWN'
    END as actual_type
FROM public.customers c
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Check if there's a customer_profiles entry
SELECT 
    'CUSTOMER_PROFILES DATA' as check_type,
    cp.id,
    cp.line_user_id,
    cp.line_display_name,
    cp.email as profile_email
FROM public.customer_profiles cp
WHERE cp.id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
   OR cp.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- Check auth.users metadata
SELECT 
    'AUTH.USERS DATA' as check_type,
    au.id,
    au.email,
    au.raw_user_meta_data->>'line_user_id' as metadata_line_user_id,
    au.raw_user_meta_data as full_metadata
FROM auth.users au
WHERE au.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

