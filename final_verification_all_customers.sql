-- Final verification: Check all customers have proper names
-- This verifies the complete fix

-- 1. Check all WEB customers
SELECT 
    'WEB CUSTOMERS' as customer_type,
    c.id,
    c.role,
    au.email,
    u.full_name,
    CASE 
        WHEN u.full_name IS NOT NULL 
         AND u.full_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         AND u.full_name NOT LIKE 'line_%'
         AND NOT (u.full_name LIKE 'U%' AND LENGTH(u.full_name) > 20)
        THEN '✅ HAS PROPER NAME'
        ELSE '❌ MISSING OR WRONG NAME'
    END as status
FROM public.customers c
LEFT JOIN auth.users au ON au.id = c.auth_user_id
LEFT JOIN public.users u ON u.id = c.auth_user_id
WHERE c.role = 'web'
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = c.auth_user_id)
ORDER BY c.created_at DESC;

-- 2. Check all LINE customers
SELECT 
    'LINE CUSTOMERS' as customer_type,
    c.id,
    c.role,
    c.line_user_id,
    cp.line_display_name,
    CASE 
        WHEN cp.line_display_name IS NOT NULL 
         AND cp.line_display_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         AND cp.line_display_name NOT LIKE 'line_%'
         AND NOT (cp.line_display_name LIKE 'U%' AND LENGTH(cp.line_display_name) > 20)
        THEN '✅ HAS PROPER NAME'
        ELSE '❌ MISSING OR WRONG NAME'
    END as status
FROM public.customers c
LEFT JOIN public.customer_profiles cp ON cp.line_user_id = c.line_user_id OR cp.id = c.id
WHERE c.role = 'line'
ORDER BY c.created_at DESC;

-- 3. Summary count
SELECT 
    'SUMMARY' as check_type,
    COUNT(*) FILTER (WHERE c.role = 'web' AND u.full_name IS NOT NULL 
                     AND u.full_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                     AND u.full_name NOT LIKE 'line_%') as web_customers_with_names,
    COUNT(*) FILTER (WHERE c.role = 'line' AND cp.line_display_name IS NOT NULL
                     AND cp.line_display_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                     AND cp.line_display_name NOT LIKE 'line_%') as line_customers_with_names
FROM public.customers c
LEFT JOIN public.users u ON u.id = c.auth_user_id
LEFT JOIN public.customer_profiles cp ON cp.line_user_id = c.line_user_id OR cp.id = c.id
WHERE c.role IN ('web', 'line')
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = c.auth_user_id);

