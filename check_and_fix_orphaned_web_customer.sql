-- Check if this WEB customer should be deleted or fixed
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5

-- Step 1: Check auth.users - what data exists?
SELECT 
  'AUTH.USERS' as source,
  id,
  email,
  raw_user_meta_data->>'name' as metadata_name,
  raw_user_meta_data->>'full_name' as metadata_full_name,
  raw_user_meta_data->>'line_user_id' as metadata_line_user_id,
  created_at
FROM auth.users
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Step 2: Check customers table
SELECT 
  'CUSTOMERS' as source,
  id,
  role,
  email,
  name,
  auth_user_id,
  line_user_id,
  created_at,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = id) as booking_count
FROM customers
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Step 3: Check if there's a LINE customer with the same line_user_id pattern
-- The email pattern suggests line_user_id = Uf5741397f874c9a5822578e506f0cb47
SELECT 
  'LINE CUSTOMER CHECK' as source,
  id,
  role,
  email,
  line_user_id,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = id) as booking_count
FROM customers
WHERE line_user_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- Step 4: Check customer_profiles for this line_user_id
SELECT 
  'CUSTOMER_PROFILES' as source,
  line_user_id,
  line_display_name,
  name,
  full_name,
  email
FROM customer_profiles
WHERE line_user_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- DECISION: Since this customer has:
-- - No bookings
-- - NULL email/full_name in auth.users
-- - LINE email pattern
-- - Likely a duplicate of the LINE customer

-- Option A: Delete this orphaned customer (if no bookings)
-- DELETE FROM users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';
-- DELETE FROM customers WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Option B: If you want to keep it, update with placeholder data
-- But since it has no bookings and no real data, deletion is probably best

