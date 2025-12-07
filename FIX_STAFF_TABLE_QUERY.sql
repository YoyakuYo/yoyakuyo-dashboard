-- First, check what columns the staff table actually has
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'staff'
ORDER BY ordinal_position;

-- Then use this corrected query based on actual schema:
-- If staff table has 'user_id' column:
SELECT 
  s.id,
  s.user_id AS auth_user_id,
  s.is_active,
  u.email
FROM staff s
JOIN users u ON u.id = s.user_id
WHERE s.is_active = true;

-- OR if staff table has 'id' that directly references users.id:
SELECT 
  s.id,
  s.id AS auth_user_id,
  s.is_active,
  u.email
FROM staff s
JOIN users u ON u.id = s.id
WHERE s.is_active = true;

-- OR if staff table has a different column name, check foreign keys:
SELECT
  tc.constraint_name,
  kcu.column_name AS staff_column,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'staff'
  AND ccu.table_name = 'users';

