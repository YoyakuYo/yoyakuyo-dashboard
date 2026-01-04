-- SQL to find where customer names actually exist
-- Run this first to see what data we have

-- Check WEB customers: What data exists in auth.users?
SELECT 
    'WEB CUSTOMER DATA' as check_type,
    au.id,
    au.email,
    au.raw_user_meta_data->>'name' as metadata_name,
    au.raw_user_meta_data->>'full_name' as metadata_full_name,
    au.raw_user_meta_data as full_metadata,
    u.full_name as users_table_name,
    c.name as customers_table_name
FROM auth.users au
INNER JOIN public.customers c ON c.auth_user_id = au.id
LEFT JOIN public.users u ON u.id = au.id
WHERE c.role = 'web'
  AND NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.owner_user_id = au.id)
LIMIT 10;

-- Check LINE customers: What data exists in customer_profiles?
SELECT 
    'LINE CUSTOMER DATA' as check_type,
    c.id,
    c.line_user_id,
    cp.line_display_name,
    cp.name as profile_name,
    cp.full_name as profile_full_name,
    cp.email as profile_email
FROM public.customers c
LEFT JOIN public.customer_profiles cp ON cp.line_user_id = c.line_user_id OR cp.id = c.id
WHERE c.role = 'line'
LIMIT 10;

