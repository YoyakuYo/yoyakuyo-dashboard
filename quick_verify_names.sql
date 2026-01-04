-- Quick verification: Check if owners have names in users table
SELECT 
    s.id as shop_id,
    s.name as shop_name,
    s.owner_user_id,
    u.id as user_id,
    u.email,
    u.full_name,
    CASE 
        WHEN u.full_name IS NULL THEN '❌ NO NAME'
        ELSE '✅ HAS NAME'
    END as status
FROM public.shops s
LEFT JOIN public.users u ON u.id = s.owner_user_id
WHERE s.owner_user_id IS NOT NULL
ORDER BY s.created_at DESC;

