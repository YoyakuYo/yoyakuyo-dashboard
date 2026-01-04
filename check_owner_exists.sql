-- Check if owner exists for the given email/id
-- Replace with actual values from the error log

SELECT 
  'OWNER CHECK' as check_type,
  o.id as owner_id,
  o.email as owner_email,
  o.name as owner_name,
  o.created_at,
  u.id as user_id,
  u.email as user_email,
  u.role as user_role,
  CASE 
    WHEN o.id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a' THEN '✅ ID matches'
    WHEN LOWER(o.email) = LOWER('omarsowbarca45@gmail.com') THEN '✅ Email matches'
    ELSE '❌ No match'
  END as match_status
FROM owners o
LEFT JOIN users u ON u.id = o.id OR u.email = o.email
WHERE o.id = 'c0fa1292-e6ad-41e1-b04d-1ea9feffcc9a'
   OR LOWER(o.email) = LOWER('omarsowbarca45@gmail.com');

-- Also check all owners to see what's in the table
SELECT 
  'ALL OWNERS' as check_type,
  id,
  email,
  name,
  created_at
FROM owners
ORDER BY created_at DESC;

