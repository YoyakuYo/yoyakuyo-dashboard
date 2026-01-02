-- Diagnostic script to check why claim_id column doesn't exist
-- Run this first to see what's actually in the database

-- 1. Check if shop_claim_documents table exists
SELECT 
  'Table Existence Check' AS check_type,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'shop_claim_documents'
  ) AS table_exists;

-- 2. Check all columns in shop_claim_documents table
SELECT 
  'Column Check' AS check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'shop_claim_documents'
ORDER BY ordinal_position;

-- 3. Check if there are any other tables with similar names
SELECT 
  'Similar Tables' AS check_type,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%claim%document%'
  OR table_name LIKE '%document%claim%'
ORDER BY table_name;

-- 4. Check if shop_claims table exists (needed for foreign key)
SELECT 
  'shop_claims Table Check' AS check_type,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'shop_claims'
  ) AS shop_claims_exists;

-- 5. Check foreign key constraints on shop_claim_documents
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
  AND tc.table_name = 'shop_claim_documents';

