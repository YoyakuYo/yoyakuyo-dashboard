-- Fix LINE/WEB customer mismatch
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5
-- Problem: customers.role = 'web' but auth.users says it's a LINE customer

-- Step 1: Check if another customer already has this line_user_id
DO $$
DECLARE
    existing_customer_id UUID;
BEGIN
    -- Find existing customer with this line_user_id
    SELECT id INTO existing_customer_id
    FROM public.customers
    WHERE line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
      AND id != '78fea290-ef9a-43c8-96d6-90460c04efe5'
    LIMIT 1;
    
    IF existing_customer_id IS NOT NULL THEN
        -- Another customer already has this line_user_id
        -- Delete the duplicate WEB customer record instead
        DELETE FROM public.customers
        WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
          AND role = 'web';
        
        RAISE NOTICE 'Deleted duplicate WEB customer. LINE customer already exists with ID: %', existing_customer_id;
    ELSE
        -- No duplicate, safe to update
        UPDATE public.customers
        SET 
            role = 'line',
            line_user_id = 'Uf5741397f874c9a5822578e506f0cb47',
            auth_user_id = NULL,
            email = NULL
        WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
          AND role = 'web';
        
        RAISE NOTICE 'Updated customer from WEB to LINE';
    END IF;
END $$;

-- Step 2: Remove users table entry (LINE customers shouldn't be in users table)
DELETE FROM public.users
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Step 3: Ensure customer_profiles exists with correct line_user_id
INSERT INTO public.customer_profiles (id, line_user_id, line_display_name, email, full_name, created_at)
SELECT 
    '78fea290-ef9a-43c8-96d6-90460c04efe5'::uuid,
    'Uf5741397f874c9a5822578e506f0cb47',
    COALESCE(
        (SELECT cp.line_display_name FROM public.customer_profiles cp WHERE cp.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47' LIMIT 1),
        'Alpha'  -- We know this from earlier query
    ) as line_display_name,
    'line_Uf5741397f874c9a5822578e506f0cb47@line.user' as email,
    COALESCE(
        (SELECT cp.line_display_name FROM public.customer_profiles cp WHERE cp.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47' LIMIT 1),
        'Alpha'
    ) as full_name,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.customer_profiles cp 
    WHERE cp.id = '78fea290-ef9a-43c8-96d6-90460c04efe5'::uuid
       OR cp.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
)
ON CONFLICT (id) DO UPDATE
SET 
    line_user_id = EXCLUDED.line_user_id,
    line_display_name = COALESCE(customer_profiles.line_display_name, EXCLUDED.line_display_name),
    full_name = COALESCE(customer_profiles.full_name, EXCLUDED.full_name),
    updated_at = NOW();

-- Step 4: Verify the fix
SELECT 
    'VERIFICATION' as check_type,
    c.id,
    c.role,
    c.line_user_id,
    c.auth_user_id,
    cp.line_display_name,
    CASE 
        WHEN c.role = 'line' 
         AND c.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
         AND c.auth_user_id IS NULL
         AND cp.line_display_name IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = c.id)
        THEN '✅ FIXED - NOW PROPERLY LINE CUSTOMER'
        ELSE '❌ STILL HAS ISSUES'
    END as status
FROM public.customers c
LEFT JOIN public.customer_profiles cp ON cp.line_user_id = c.line_user_id OR cp.id = c.id
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

