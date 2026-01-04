-- Check what data is actually stored for WEB customers
SELECT 
    'ACTUAL DATA IN USERS TABLE' as check_type,
    u.id,
    u.email,
    u.full_name,
    au.id as auth_id,
    au.email as auth_email,
    au.raw_user_meta_data->>'name' as metadata_name,
    au.raw_user_meta_data->>'full_name' as metadata_full_name,
    au.raw_user_meta_data as full_metadata,
    c.id as customer_id,
    c.role as customer_role
FROM public.users u
INNER JOIN public.customers c ON c.auth_user_id = u.id
LEFT JOIN auth.users au ON au.id = u.id
WHERE c.role = 'web'
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = u.id)
ORDER BY u.created_at DESC;

