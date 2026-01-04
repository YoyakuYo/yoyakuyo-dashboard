-- Show WEB customers with their names
SELECT 
    c.id as customer_id,
    c.role,
    c.auth_user_id,
    u.id as user_id,
    u.email,
    u.full_name,
    c.name as customer_table_name,
    CASE 
        WHEN u.full_name IS NOT NULL THEN '✅ HAS NAME'
        ELSE '❌ NO NAME'
    END as status
FROM public.customers c
LEFT JOIN public.users u ON u.id = c.auth_user_id
WHERE c.role = 'web'
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = c.auth_user_id)
ORDER BY c.created_at DESC;

