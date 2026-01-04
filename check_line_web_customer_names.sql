-- Check why LINE and WEB customers are showing generic names
-- This will help identify what data is missing

-- Check LINE customers
SELECT 
  c.id as customer_id,
  c.role,
  c.email,
  c.line_user_id,
  cp.line_display_name,
  cp.name as profile_name,
  cp.full_name as profile_full_name,
  CASE 
    WHEN cp.line_display_name IS NOT NULL THEN '✅ Has line_display_name'
    WHEN cp.name IS NOT NULL THEN '⚠️ Has name but not line_display_name'
    WHEN cp.full_name IS NOT NULL THEN '⚠️ Has full_name but not line_display_name'
    ELSE '❌ No name in customer_profiles'
  END as status
FROM customers c
LEFT JOIN customer_profiles cp ON c.line_user_id = cp.line_user_id
WHERE c.role = 'line'
ORDER BY c.created_at DESC
LIMIT 10;

-- Check WEB customers
SELECT 
  c.id as customer_id,
  c.role,
  c.email,
  c.auth_user_id,
  u.full_name as user_full_name,
  u.email as user_email,
  CASE 
    WHEN u.full_name IS NOT NULL THEN '✅ Has full_name in users'
    WHEN u.email IS NOT NULL THEN '⚠️ Has email but no full_name'
    ELSE '❌ No entry in users table'
  END as status
FROM customers c
LEFT JOIN users u ON c.auth_user_id = u.id
WHERE c.role = 'web'
ORDER BY c.created_at DESC
LIMIT 10;

