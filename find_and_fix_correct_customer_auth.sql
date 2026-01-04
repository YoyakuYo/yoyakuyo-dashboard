-- Find correct auth account for WEB customer and fix the mismatch
-- Customer email: yayakuyodemo@gmail.com
-- Customer ID: 6a98c3d8-52b4-4f93-a610-d4f7a60e8699

-- Step 1: Find the correct auth.users account for this email
SELECT 
    'FIND CORRECT AUTH ACCOUNT' as check_type,
    au.id,
    au.email,
    au.raw_user_meta_data->>'name' as metadata_name,
    au.raw_user_meta_data->>'full_name' as metadata_full_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.admins a WHERE a.id = au.id) THEN '❌ IS ADMIN'
        WHEN EXISTS (SELECT 1 FROM public.customers c WHERE c.auth_user_id = au.id AND c.role = 'web') THEN '✅ IS WEB CUSTOMER'
        ELSE '❓ NOT FOUND IN CUSTOMERS'
    END as account_type
FROM auth.users au
WHERE au.email = 'yayakuyodemo@gmail.com';

-- Step 2: Check if correct auth_user_id already exists in customers table
DO $$
DECLARE
    correct_auth_id UUID;
    existing_customer_id UUID;
BEGIN
    -- Find correct auth account
    SELECT au.id INTO correct_auth_id
    FROM auth.users au 
    WHERE au.email = 'yayakuyodemo@gmail.com'
      AND NOT EXISTS (SELECT 1 FROM public.admins a WHERE a.id = au.id)
    LIMIT 1;
    
    IF correct_auth_id IS NULL THEN
        RAISE NOTICE 'No auth account found for yayakuyodemo@gmail.com';
        RETURN;
    END IF;
    
    -- Check if another customer already has this auth_user_id
    SELECT id INTO existing_customer_id
    FROM public.customers
    WHERE auth_user_id = correct_auth_id
      AND id != '6a98c3d8-52b4-4f93-a610-d4f7a60e8699'
    LIMIT 1;
    
    IF existing_customer_id IS NOT NULL THEN
        -- Another customer already has this auth_user_id
        -- Delete the duplicate customer record (the one pointing to admin)
        DELETE FROM public.customers
        WHERE id = '6a98c3d8-52b4-4f93-a610-d4f7a60e8699'
          AND auth_user_id = '16e3a9f0-7a42-471f-a352-9e573555ca62';
        
        RAISE NOTICE 'Deleted duplicate customer. Correct customer already exists with ID: %', existing_customer_id;
    ELSE
        -- No duplicate, safe to update
        UPDATE public.customers
        SET auth_user_id = correct_auth_id
        WHERE id = '6a98c3d8-52b4-4f93-a610-d4f7a60e8699'
          AND auth_user_id = '16e3a9f0-7a42-471f-a352-9e573555ca62';
        
        RAISE NOTICE 'Updated customer to correct auth_user_id: %', correct_auth_id;
    END IF;
END $$;

-- Step 3: Create/update users table entry with correct auth_user_id
INSERT INTO public.users (id, email, full_name, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'display_name',
        INITCAP(REPLACE(REPLACE(REPLACE(SPLIT_PART(au.email, '@', 1), '.', ' '), '_', ' '), '-', ' '))
    ) as full_name,
    au.created_at
FROM auth.users au
WHERE au.email = 'yayakuyodemo@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.admins a WHERE a.id = au.id)
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.email = au.email)
ON CONFLICT (id) DO UPDATE
SET 
    full_name = COALESCE(users.full_name, EXCLUDED.full_name),
    email = COALESCE(users.email, EXCLUDED.email),
    updated_at = NOW()
WHERE users.full_name IS NULL;

-- Step 4: Verify the fix
SELECT 
    'VERIFICATION' as check_type,
    c.id as customer_id,
    c.role,
    c.auth_user_id,
    au.email as auth_email,
    u.full_name,
    CASE 
        WHEN c.auth_user_id IS NOT NULL 
         AND au.email = 'yayakuyodemo@gmail.com'
         AND NOT EXISTS (SELECT 1 FROM public.admins a WHERE a.id = c.auth_user_id)
         AND u.full_name IS NOT NULL
        THEN '✅ FIXED - CORRECT AUTH ACCOUNT AND NAME'
        WHEN c.auth_user_id = '16e3a9f0-7a42-471f-a352-9e573555ca62'
        THEN '❌ STILL POINTS TO ADMIN'
        ELSE '⚠️ PARTIALLY FIXED'
    END as status
FROM public.customers c
LEFT JOIN auth.users au ON au.id = c.auth_user_id
LEFT JOIN public.users u ON u.id = c.auth_user_id
WHERE c.id = '6a98c3d8-52b4-4f93-a610-d4f7a60e8699';

