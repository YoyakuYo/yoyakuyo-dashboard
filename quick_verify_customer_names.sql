-- Quick verification: Check if customers have names
SELECT 
    c.id,
    c.role,
    CASE 
        WHEN c.auth_user_id IS NOT NULL THEN 'WEB'
        WHEN c.line_user_id IS NOT NULL THEN 'LINE'
        ELSE 'GUEST'
    END as customer_type,
    c.auth_user_id,
    c.name as customer_name,
    u.full_name as user_full_name,
    COALESCE(u.full_name, c.name) as display_name,
    CASE 
        WHEN COALESCE(u.full_name, c.name) IS NULL THEN '❌ NO NAME'
        ELSE '✅ HAS NAME'
    END as status
FROM public.customers c
LEFT JOIN public.users u ON u.id = c.auth_user_id
WHERE NOT EXISTS (SELECT 1 FROM shops s WHERE s.owner_user_id = c.auth_user_id)  -- Exclude owners
ORDER BY c.created_at DESC
LIMIT 30;

