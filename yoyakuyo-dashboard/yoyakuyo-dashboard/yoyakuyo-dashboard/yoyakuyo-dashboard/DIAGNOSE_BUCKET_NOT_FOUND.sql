-- ============================================================
-- DIAGNOSE: "Bucket not found" Error
-- ============================================================
-- The bucket exists and has policies, so the issue is likely:
-- 1. Frontend using wrong Supabase project (env vars mismatch)
-- 2. Case sensitivity issue
-- 3. Bucket name typo
-- ============================================================

-- Step 1: Verify bucket exists with exact name
SELECT 
  'Bucket Verification' AS check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'shop_photos'
   OR id = 'shop-photos'  -- Check for hyphen variant
   OR id = 'Shop_Photos'  -- Check for case variant
   OR LOWER(id) = 'shop_photos';  -- Case-insensitive check

-- Step 2: List ALL buckets to see what exists
SELECT 
  'All Buckets' AS check_type,
  id,
  name,
  public,
  created_at
FROM storage.buckets
ORDER BY id;

-- Step 3: Check for any buckets with similar names
SELECT 
  'Similar Bucket Names' AS check_type,
  id,
  name
FROM storage.buckets
WHERE id LIKE '%shop%'
   OR id LIKE '%photo%'
   OR name LIKE '%shop%'
   OR name LIKE '%photo%'
ORDER BY id;

-- ============================================================
-- ROOT CAUSE ANALYSIS
-- ============================================================
-- If bucket exists in database but frontend says "not found":
-- 
-- 1. Check frontend env vars match backend:
--    - NEXT_PUBLIC_SUPABASE_URL (frontend)
--    - SUPABASE_URL (backend)
--    - These MUST point to the same project
--
-- 2. Check bucket name in code matches exactly:
--    - Code uses: 'shop_photos'
--    - Bucket id must be: 'shop_photos' (exact match, case-sensitive)
--
-- 3. Verify Supabase project:
--    - Frontend: Check browser console for Supabase URL
--    - Backend: Check Render logs for Supabase URL
--    - They must match
-- ============================================================

