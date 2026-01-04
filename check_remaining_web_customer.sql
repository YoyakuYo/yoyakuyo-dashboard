-- Check the remaining WEB customer that had no name
-- Customer ID: 6a98c3d8-52b4-4f93-a610-d4f7a60e8699

SELECT 
    'REMAINING WEB CUSTOMER' as check_type,
    c.id,
    c.role,
    c.auth_user_id,
    c.email as customer_email,
    u.id as user_id,
    u.email as user_email,
    u.full_name as user_full_name,
    au.email as auth_email,
    au.raw_user_meta_data->>'name' as auth_name,
    au.raw_user_meta_data->>'full_name' as auth_full_name,
    CASE 
        WHEN u.full_name IS NOT NULL AND u.full_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
         AND u.full_name NOT LIKE 'line_%' 
         AND NOT (u.full_name LIKE 'U%' AND LENGTH(u.full_name) > 20)
        THEN '✅ HAS PROPER NAME'
        WHEN u.id IS NULL THEN '❌ NO USERS TABLE ENTRY'
        ELSE '❌ HAS WRONG NAME/ID'
    END as status
FROM public.customers c
LEFT JOIN public.users u ON u.id = c.auth_user_id
LEFT JOIN auth.users au ON au.id = c.auth_user_id
WHERE c.id = '6a98c3d8-52b4-4f93-a610-d4f7a60e8699'
  AND c.role = 'web'
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = c.auth_user_id);

