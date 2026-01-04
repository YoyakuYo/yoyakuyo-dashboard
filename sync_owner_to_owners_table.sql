-- Sync owner from users table to owners table
-- This ensures consistency between users and owners tables

-- Check if owner already exists in owners table
SELECT 
  'CHECK BEFORE SYNC' as check_type,
  u.id as user_id,
  u.email as user_email,
  u.role as user_role,
  u.full_name as user_full_name,
  o.id as owner_id,
  o.email as owner_email,
  CASE 
    WHEN o.id IS NOT NULL THEN '✅ Already in owners table'
    ELSE '⚠️ Missing from owners table - needs sync'
  END as status
FROM users u
LEFT JOIN owners o ON o.id = u.id OR LOWER(o.email) = LOWER(u.email)
WHERE LOWER(u.email) = LOWER('omarsowbarca45@gmail.com')
  AND u.role = 'owner';

-- Insert owner into owners table if not exists
-- Note: This assumes the owner doesn't have a password_hash in owners table
-- If password authentication is needed, the owner should reset password or use Supabase Auth
INSERT INTO owners (id, email, name, created_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.full_name, u.email.split('@')[0], 'Owner') as name,
  COALESCE(u.created_at, NOW()) as created_at
FROM users u
WHERE LOWER(u.email) = LOWER('omarsowbarca45@gmail.com')
  AND u.role = 'owner'
  AND NOT EXISTS (
    SELECT 1 FROM owners o 
    WHERE o.id = u.id OR LOWER(o.email) = LOWER(u.email)
  )
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  name = COALESCE(EXCLUDED.name, owners.name);

-- Verify after sync
SELECT 
  'VERIFY AFTER SYNC' as check_type,
  u.id as user_id,
  u.email as user_email,
  u.role as user_role,
  o.id as owner_id,
  o.email as owner_email,
  o.name as owner_name,
  CASE 
    WHEN o.id IS NOT NULL THEN '✅ Successfully synced to owners table'
    ELSE '❌ Still missing from owners table'
  END as status
FROM users u
LEFT JOIN owners o ON o.id = u.id
WHERE LOWER(u.email) = LOWER('omarsowbarca45@gmail.com')
  AND u.role = 'owner';

