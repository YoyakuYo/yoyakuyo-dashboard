-- Check if auth_user_id belongs to an admin
-- auth_user_id: 16e3a9f0-7a42-471f-a352-9e573555ca62

-- Check if it's an admin
SELECT 
    'ADMIN CHECK' as check_type,
    a.id,
    a.admin_role,
    a.status,
    au.email as auth_email,
    '✅ IS ADMIN' as status
FROM public.admins a
INNER JOIN auth.users au ON au.id = a.id
WHERE a.id = '16e3a9f0-7a42-471f-a352-9e573555ca62';

-- Check the customer record
SELECT 
    'CUSTOMER RECORD' as check_type,
    c.id,
    c.role,
    c.auth_user_id,
    c.email as customer_email,
    c.name as customer_name,
    '❌ CUSTOMER LINKED TO ADMIN AUTH ID' as issue
FROM public.customers c
WHERE c.id = '6a98c3d8-52b4-4f93-a610-d4f7a60e8699';

-- Check if there's a proper customer auth account for this customer
SELECT 
    'AUTH.USERS CHECK' as check_type,
    au.id,
    au.email,
    au.raw_user_meta_data->>'name' as metadata_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.admins a WHERE a.id = au.id) THEN '❌ THIS IS AN ADMIN ACCOUNT'
        WHEN EXISTS (SELECT 1 FROM public.customers c WHERE c.auth_user_id = au.id AND c.role = 'web') THEN '✅ THIS IS A CUSTOMER ACCOUNT'
        ELSE '❓ UNKNOWN'
    END as account_type
FROM auth.users au
WHERE au.id = '16e3a9f0-7a42-471f-a352-9e573555ca62';

