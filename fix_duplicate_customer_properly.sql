-- Fix duplicate customer - check bookings and migrate if needed
-- Duplicate customer: 6a98c3d8-52b4-4f93-a610-d4f7a60e8699 (points to admin)
-- Correct auth_user_id: e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f (for yayakuyodemo@gmail.com)

-- Step 1: Find the correct customer that already has this auth_user_id
SELECT 
    'CORRECT CUSTOMER' as check_type,
    c.id,
    c.role,
    c.auth_user_id,
    c.email,
    c.name,
    au.email as auth_email
FROM public.customers c
LEFT JOIN auth.users au ON au.id = c.auth_user_id
WHERE c.auth_user_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

-- Step 2: Check if duplicate has any bookings
SELECT 
    'DUPLICATE BOOKINGS' as check_type,
    COUNT(*) as booking_count,
    STRING_AGG(b.id::text, ', ') as booking_ids
FROM public.bookings b
WHERE b.customer_id = '6a98c3d8-52b4-4f93-a610-d4f7a60e8699';

-- Step 3: Migrate bookings from duplicate to correct customer (if bookings exist)
UPDATE public.bookings
SET customer_id = (
    SELECT c.id 
    FROM public.customers c 
    WHERE c.auth_user_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
    LIMIT 1
)
WHERE customer_id = '6a98c3d8-52b4-4f93-a610-d4f7a60e8699'
  AND EXISTS (
      SELECT 1 FROM public.customers c 
      WHERE c.auth_user_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
  );

-- Step 4: Delete the duplicate customer
DELETE FROM public.customers
WHERE id = '6a98c3d8-52b4-4f93-a610-d4f7a60e8699'
  AND auth_user_id = '16e3a9f0-7a42-471f-a352-9e573555ca62';  -- Only delete if still pointing to admin

-- Step 5: Verify correct customer has name in users table
SELECT 
    'VERIFICATION' as check_type,
    c.id,
    c.role,
    c.auth_user_id,
    au.email,
    u.full_name,
    CASE 
        WHEN u.full_name IS NOT NULL 
         AND u.full_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
         AND u.full_name NOT LIKE 'line_%'
        THEN '✅ CORRECT CUSTOMER WITH NAME'
        WHEN u.id IS NULL THEN '⚠️ NEEDS USERS TABLE ENTRY'
        ELSE '❌ STILL HAS ISSUES'
    END as status
FROM public.customers c
LEFT JOIN auth.users au ON au.id = c.auth_user_id
LEFT JOIN public.users u ON u.id = c.auth_user_id
WHERE c.auth_user_id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

