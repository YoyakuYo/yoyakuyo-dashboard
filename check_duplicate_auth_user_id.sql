-- Check which customer already has this auth_user_id
-- auth_user_id: e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f

SELECT 
    'EXISTING CUSTOMER WITH THIS AUTH_ID' as check_type,
    c.id,
    c.role,
    c.auth_user_id,
    c.email,
    c.name,
    c.created_at,
    au.email as auth_email
FROM public.customers c
LEFT JOIN auth.users au ON au.id = c.auth_user_id
WHERE c.auth_user_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

-- Check the customer we're trying to fix
SELECT 
    'CUSTOMER WE WANT TO FIX' as check_type,
    c.id,
    c.role,
    c.auth_user_id,
    c.email,
    c.name,
    c.created_at
FROM public.customers c
WHERE c.id = '6a98c3d8-52b4-4f93-a610-d4f7a60e8699';

