-- Fix customer that's incorrectly linked to admin auth account
-- Customer ID: 6a98c3d8-52b4-4f93-a610-d4f7a60e8699
-- Problem: customer.auth_user_id points to admin account

-- Step 1: Check if this customer should be a guest or if auth_user_id is wrong
-- If customer has no proper auth account, convert to guest
UPDATE public.customers
SET 
    role = 'guest',
    auth_user_id = NULL,  -- Remove link to admin account
    email = COALESCE(
        (SELECT au.email FROM auth.users au WHERE au.id = '16e3a9f0-7a42-471f-a352-9e573555ca62'),
        'customer_' || SUBSTRING(id::text, 1, 8) || '@guest.user'
    )  -- Set email for guest
WHERE id = '6a98c3d8-52b4-4f93-a610-d4f7a60e8699'
  AND EXISTS (SELECT 1 FROM public.admins a WHERE a.id = '16e3a9f0-7a42-471f-a352-9e573555ca62');

-- Step 2: Verify the fix
SELECT 
    'VERIFICATION' as check_type,
    c.id,
    c.role,
    c.auth_user_id,
    c.email,
    CASE 
        WHEN c.role = 'guest' AND c.auth_user_id IS NULL THEN '✅ FIXED - NOW GUEST CUSTOMER'
        WHEN c.role = 'web' AND c.auth_user_id IS NOT NULL 
         AND NOT EXISTS (SELECT 1 FROM public.admins a WHERE a.id = c.auth_user_id)
        THEN '✅ FIXED - NOW PROPER WEB CUSTOMER'
        ELSE '❌ STILL HAS ISSUES'
    END as status
FROM public.customers c
WHERE c.id = '6a98c3d8-52b4-4f93-a610-d4f7a60e8699';

