-- Check for duplicate LINE customer with same line_user_id
SELECT 
    'DUPLICATE CHECK' as check_type,
    c.id,
    c.role,
    c.line_user_id,
    c.auth_user_id,
    c.email,
    c.created_at
FROM public.customers c
WHERE c.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
ORDER BY c.created_at;

