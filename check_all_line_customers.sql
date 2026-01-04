-- Check all LINE customers and their profiles
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
ORDER BY c.created_at DESC;

