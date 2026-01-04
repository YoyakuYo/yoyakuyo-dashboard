-- Check if owner exists for email: omarsowbarca45@gmail.com

SELECT 
  'OWNER CHECK' as check_type,
  o.id as owner_id,
  o.email as owner_email,
  o.name as owner_name,
  o.created_at as owner_created_at,
  u.id as user_id,
  u.email as user_email,
  u.role as user_role,
  u.full_name as user_full_name,
  u.created_at as user_created_at,
  CASE 
    WHEN o.id IS NOT NULL THEN '✅ Found in owners table'
    WHEN u.id IS NOT NULL AND u.role = 'owner' THEN '⚠️ Found in users table with role=owner but NOT in owners table'
    WHEN u.id IS NOT NULL THEN '⚠️ Found in users table but role is not owner'
    ELSE '❌ Not found anywhere'
  END as status
FROM (SELECT 'omarsowbarca45@gmail.com'::text as email) AS search_email
LEFT JOIN owners o ON LOWER(o.email) = LOWER(search_email.email)
LEFT JOIN users u ON LOWER(u.email) = LOWER(search_email.email);

-- Also check all owners to see what's in the table
SELECT 
  'ALL OWNERS' as check_type,
  id,
  email,
  name,
  created_at
FROM owners
ORDER BY created_at DESC
LIMIT 10;

