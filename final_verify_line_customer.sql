-- Final verification: Check if the customer record has the correct line_user_id
-- This is the key to the mapping working

SELECT 
  'CUSTOMER RECORD' as check_type,
  c.id as customer_id,
  c.role,
  c.line_user_id,
  c.email,
  c.name,
  CASE 
    WHEN c.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47' THEN '✅ Correct line_user_id'
    WHEN c.line_user_id IS NULL THEN '❌ Missing line_user_id'
    ELSE '❌ Wrong line_user_id'
  END as line_user_id_status
FROM customers c
WHERE c.id = '9bc12391-4116-4e4e-941b-e4606d8dfb16';

-- Verify the profile exists
SELECT 
  'PROFILE CHECK' as check_type,
  cp.line_user_id,
  cp.line_display_name,
  CASE 
    WHEN cp.line_display_name IS NOT NULL THEN '✅ Has line_display_name'
    ELSE '❌ Missing line_display_name'
  END as profile_status
FROM customer_profiles cp
WHERE cp.line_user_id = 'Uf5741397f874c9a5822578e506f0cb47';

-- Final mapping test
SELECT 
  'MAPPING TEST' as check_type,
  c.id as customer_id,
  c.line_user_id as customer_line_user_id,
  cp.line_user_id as profile_line_user_id,
  cp.line_display_name,
  CASE 
    WHEN c.line_user_id = cp.line_user_id AND cp.line_display_name IS NOT NULL THEN '✅ Mapping will work'
    WHEN c.line_user_id IS NULL THEN '❌ Customer missing line_user_id'
    WHEN cp.line_display_name IS NULL THEN '❌ Profile missing line_display_name'
    ELSE '❌ Mismatch'
  END as mapping_status
FROM customers c
LEFT JOIN customer_profiles cp ON c.line_user_id = cp.line_user_id
WHERE c.id = '9bc12391-4116-4e4e-941b-e4606d8dfb16';

