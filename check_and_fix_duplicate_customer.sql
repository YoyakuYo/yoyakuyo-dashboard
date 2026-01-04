-- Check for bookings and fix duplicate customer
-- Correct LINE customer: 9bc12391-4116-4e4e-941b-e4606d8dfb16
-- Duplicate WEB customer: 78fea290-ef9a-43c8-96d6-90460c04efe5

-- Step 1: Check if duplicate has any bookings
SELECT 
    'BOOKINGS CHECK' as check_type,
    COUNT(*) as booking_count,
    STRING_AGG(b.id::text, ', ') as booking_ids
FROM public.bookings b
WHERE b.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Step 2: If bookings exist, migrate them to correct customer
-- (Only run this if bookings exist)
UPDATE public.bookings
SET customer_id = '9bc12391-4116-4e4e-941b-e4606d8dfb16'
WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Step 3: Delete the duplicate WEB customer
DELETE FROM public.customers
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  AND role = 'web';

-- Step 4: Delete users table entry for duplicate
DELETE FROM public.users
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Step 5: Verify correct customer exists and has name
SELECT 
    'VERIFICATION' as check_type,
    c.id,
    c.role,
    c.line_user_id,
    cp.line_display_name,
    CASE 
        WHEN c.role = 'line' 
         AND c.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47'
         AND cp.line_display_name IS NOT NULL
        THEN '✅ CORRECT LINE CUSTOMER WITH NAME'
        ELSE '❌ STILL HAS ISSUES'
    END as status
FROM public.customers c
LEFT JOIN public.customer_profiles cp ON cp.line_user_id = c.line_user_id OR cp.id = c.id
WHERE c.id = '9bc12391-4116-4e4e-941b-e4606d8dfb16';

