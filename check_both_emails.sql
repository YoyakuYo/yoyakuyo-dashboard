-- Check both email addresses to see where they exist

-- Check for sowoumar45@gmail.com (the one in owners table)
SELECT 
  'sowoumar45@gmail.com CHECK' as check_type,
  'owners' as source_table,
  o.id,
  o.email,
  o.name,
  NULL as role,
  o.created_at
FROM owners o
WHERE LOWER(o.email) = LOWER('sowoumar45@gmail.com')

UNION ALL

SELECT 
  'sowoumar45@gmail.com CHECK' as check_type,
  'users' as source_table,
  u.id,
  u.email,
  u.full_name as name,
  u.role::text as role,
  u.created_at
FROM users u
WHERE LOWER(u.email) = LOWER('sowoumar45@gmail.com')

UNION ALL

-- Check for omarsowbarca45@gmail.com (the one trying to log in)
SELECT 
  'omarsowbarca45@gmail.com CHECK' as check_type,
  'owners' as source_table,
  o.id,
  o.email,
  o.name,
  NULL as role,
  o.created_at
FROM owners o
WHERE LOWER(o.email) = LOWER('omarsowbarca45@gmail.com')

UNION ALL

SELECT 
  'omarsowbarca45@gmail.com CHECK' as check_type,
  'users' as source_table,
  u.id,
  u.email,
  u.full_name as name,
  u.role::text as role,
  u.created_at
FROM users u
WHERE LOWER(u.email) = LOWER('omarsowbarca45@gmail.com');

-- Also check if they might be the same user with different emails
SELECT 
  'SAME USER CHECK' as check_type,
  u1.id as user1_id,
  u1.email as user1_email,
  u1.role as user1_role,
  u2.id as user2_id,
  u2.email as user2_email,
  u2.role as user2_role,
  CASE 
    WHEN u1.id = u2.id THEN '✅ Same user ID, different emails'
    ELSE '❌ Different users'
  END as status
FROM users u1
CROSS JOIN users u2
WHERE LOWER(u1.email) = LOWER('sowoumar45@gmail.com')
  AND LOWER(u2.email) = LOWER('omarsowbarca45@gmail.com');

