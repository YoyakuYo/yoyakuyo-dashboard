-- Verify that the migration was successful
-- Run this to check if everything is set up correctly

-- 1. Check if shop_claims table exists and has correct structure
SELECT 
  'shop_claims Table Structure' AS check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shop_claims'
ORDER BY ordinal_position;

-- 2. Check if shop_claim_documents table has claim_id column
SELECT 
  'shop_claim_documents Table Structure' AS check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shop_claim_documents'
ORDER BY ordinal_position;

-- 3. Check if verification_id column is gone (should return 0 rows)
SELECT 
  'Old Column Check' AS check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: verification_id column removed'
    ELSE 'WARNING: verification_id column still exists'
  END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shop_claim_documents'
  AND column_name = 'verification_id';

-- 4. Check foreign key constraints
SELECT
  'Foreign Keys' AS check_type,
  tc.constraint_name,
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
  AND tc.table_name = 'shop_claim_documents'
ORDER BY kcu.column_name;

-- 5. Check RLS policies
SELECT
  'RLS Policies' AS check_type,
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename = 'shop_claim_documents'
ORDER BY policyname;

-- 6. Check if enums exist
SELECT 
  'Enums' AS check_type,
  typname AS enum_name,
  array_agg(enumlabel ORDER BY enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('claim_status', 'claim_document_type')
GROUP BY typname
ORDER BY typname;

-- 7. Summary
SELECT 
  'Migration Summary' AS check_type,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'shop_claims') AS shop_claims_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'shop_claim_documents' AND column_name = 'claim_id') AS claim_id_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'shop_claim_documents' AND column_name = 'verification_id') AS verification_id_removed,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'shop_claim_documents') AS rls_policies_count;

