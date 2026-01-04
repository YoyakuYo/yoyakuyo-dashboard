-- Fix WEB customer users table entry
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5
-- This customer has no bookings and appears to be misclassified

-- Step 1: Check what's in auth.users
SELECT 
  'AUTH.USERS CHECK' as step,
  id,
  email,
  raw_user_meta_data->>'name' as metadata_name,
  raw_user_meta_data->>'full_name' as metadata_full_name,
  raw_user_meta_data->>'line_user_id' as metadata_line_user_id,
  raw_user_meta_data
FROM auth.users
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Step 2: Check the customer record
SELECT 
  'CUSTOMER CHECK' as step,
  id,
  role,
  email,
  name,
  auth_user_id,
  line_user_id,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = id) as booking_count
FROM customers
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Step 3: Update users table with correct data
-- If auth.users has a real email (not LINE email), use it
-- Otherwise, this might be a misclassified customer
UPDATE users
SET 
  email = (
    SELECT email 
    FROM auth.users 
    WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
    AND email NOT LIKE 'line_%@line.user'  -- Don't use LINE emails
    LIMIT 1
  ),
  full_name = COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'),
    'Web Customer'  -- Fallback
  )
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
AND EXISTS (SELECT 1 FROM auth.users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5');

-- Step 4: If auth.users email is also a LINE email, we need to handle it differently
-- Check if this customer should actually be deleted or if it's a real WEB customer
-- For now, if the email in auth.users is also LINE email, set a placeholder
UPDATE users
SET 
  email = COALESCE(
    (SELECT email FROM auth.users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5' AND email NOT LIKE 'line_%@line.user'),
    'web_' || id || '@user.local'  -- Placeholder if only LINE email exists
  ),
  full_name = COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5'),
    'Web Customer'
  )
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Step 5: Verify the fix
SELECT 
  'VERIFICATION' as step,
  u.id,
  u.email,
  u.full_name,
  c.id as customer_id,
  c.role,
  c.email as customer_email,
  '✅ Updated' as status
FROM users u
JOIN customers c ON c.auth_user_id = u.id
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

