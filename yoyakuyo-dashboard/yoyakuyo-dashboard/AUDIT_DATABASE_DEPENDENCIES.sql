-- ============================================================
-- STEP 1: AUDIT CURRENT DATABASE DEPENDENCIES
-- ============================================================
-- Inspect tables and their relationships
-- ============================================================

-- 1. Check users table structure
SELECT 
  'users table' AS check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('id', 'role', 'shop_id', 'owner_auth_id')
ORDER BY ordinal_position;

-- 2. Check shops table structure
SELECT 
  'shops table' AS check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shops'
  AND column_name IN ('id', 'owner_user_id', 'owner_id', 'claimed_at', 'claimed_by', 'claim_status', 'shop_status', 'verification_status')
ORDER BY ordinal_position;

-- 3. Check owner_verification table structure
SELECT 
  'owner_verification table' AS check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'owner_verification'
  AND column_name IN ('id', 'user_id', 'owner_id', 'shop_id', 'verification_status', 'status')
ORDER BY ordinal_position;

-- 4. Check foreign key relationships
SELECT
  'Foreign Keys' AS check_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('owner_verification', 'shops', 'users')
ORDER BY tc.table_name, kcu.column_name;

-- 5. Check for broken references
SELECT 
  'Broken owner_verification.user_id' AS check_type,
  COUNT(*) AS broken_count
FROM owner_verification ov
LEFT JOIN users u ON u.id = ov.user_id
WHERE u.id IS NULL;

SELECT 
  'Broken owner_verification.shop_id' AS check_type,
  COUNT(*) AS broken_count
FROM owner_verification ov
LEFT JOIN shops s ON s.id = ov.shop_id
WHERE ov.shop_id IS NOT NULL AND s.id IS NULL;

-- 6. Check owner_verification status values
SELECT 
  'owner_verification status distribution' AS check_type,
  verification_status,
  COUNT(*) AS count
FROM owner_verification
GROUP BY verification_status
ORDER BY count DESC;

-- 7. Check if users.shop_id is set before approval
SELECT 
  'Users with shop_id but no approved verification' AS check_type,
  u.id,
  u.email,
  u.shop_id,
  ov.verification_status
FROM users u
LEFT JOIN owner_verification ov ON ov.user_id = u.id AND ov.verification_status = 'approved'
WHERE u.shop_id IS NOT NULL
  AND (ov.id IS NULL OR ov.verification_status != 'approved')
LIMIT 10;

-- 8. Check pending verifications
SELECT 
  'Pending verifications' AS check_type,
  ov.id,
  ov.user_id,
  ov.shop_id,
  ov.verification_status,
  ov.created_at,
  u.email AS owner_email,
  s.name AS shop_name
FROM owner_verification ov
LEFT JOIN users u ON u.id = ov.user_id
LEFT JOIN shops s ON s.id = ov.shop_id
WHERE ov.verification_status = 'pending'
ORDER BY ov.created_at DESC;

-- 9. Check verifications with documents
SELECT 
  'Verifications with documents' AS check_type,
  ov.id,
  ov.verification_status,
  COUNT(ovd.id) AS doc_count
FROM owner_verification ov
LEFT JOIN owner_verification_documents ovd ON ovd.verification_id = ov.id
WHERE ov.verification_status = 'pending'
GROUP BY ov.id, ov.verification_status
HAVING COUNT(ovd.id) = 0;

