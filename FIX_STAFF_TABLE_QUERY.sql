-- ============================================================
-- IMPORTANT: There are TWO different tables:
-- 1. staff = Shop employees (no auth_user_id)
-- 2. staff_profiles = Platform staff/admins (has auth_user_id)
-- ============================================================

-- Check staff_profiles table (platform staff) - THIS IS WHAT WE NEED
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'staff_profiles'
ORDER BY ordinal_position;

-- Query platform staff users (correct table):
SELECT 
  sp.id,
  sp.auth_user_id,
  sp.full_name,
  sp.email,
  sp.active,
  sp.is_super_admin,
  u.email AS user_email
FROM staff_profiles sp
JOIN users u ON u.id = sp.auth_user_id
WHERE sp.active = true;

-- ============================================================
-- NOTE: staff table is for shop employees, not platform staff
-- ============================================================
-- If you need to check shop employees instead:
-- SELECT * FROM staff WHERE is_active = true;

