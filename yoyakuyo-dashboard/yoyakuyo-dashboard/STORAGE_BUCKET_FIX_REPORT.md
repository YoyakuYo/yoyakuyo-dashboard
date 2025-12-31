# Storage Bucket Fix Report

## STEP 1: BUCKET NAME FOUND IN CODE

**Bucket Name:** `verification-documents` (with hyphen, case-sensitive)

**Files Using This Bucket:**

1. `app/owner/claim/page.tsx` (line 413)
   - `const bucket = 'verification-documents';`
   - Used in `uploadFileToStorage()` function

2. `app/owner/dashboard/page.tsx` (lines 514, 523)
   - `.from('verification-documents')`
   - Used in `handleFileUpload()` function

3. `app/owner/verification/page.tsx` (lines 98, 107)
   - `.from('verification-documents')`
   - Used in `handleFileUpload()` function

4. `app/owner/create-shop/page.tsx` (lines 164, 173)
   - `.from('verification-documents')`
   - Used in `handleFileUpload()` function

## STEP 2: VERIFY BUCKET EXISTS IN SUPABASE

Run this SQL in Supabase SQL Editor:

```sql
SELECT 
  'Bucket Check' AS check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'verification-documents';
```

**Expected Result:**
- If bucket exists: Returns 1 row with bucket details
- If bucket missing: Returns 0 rows (empty result)

## STEP 3: IF BUCKET DOES NOT EXIST

### Option A: Create via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"** or **"Create bucket"**
3. Fill in:
   - **Name:** `verification-documents` (EXACT match, case-sensitive)
   - **Public:** `false` (unchecked - private bucket)
   - **File size limit:** `10 MB` (or `10485760` bytes)
   - **Allowed MIME types:** 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/webp`
     - `application/pdf`
4. Click **"Create bucket"**

### Option B: Create via SQL (Requires Service Role)

Run `CREATE_VERIFICATION_BUCKET.sql` in Supabase SQL Editor (requires service role permissions).

## STEP 4: VERIFY FILE URL FORMAT

The app generates URLs in this format:
```
https://PROJECT_ID.supabase.co/storage/v1/object/public/verification-documents/USER_ID/CLAIM_ID/FILENAME
```

**Important:** The bucket name in the URL (`verification-documents`) must match the bucket name in Supabase Storage exactly.

## STEP 5: STORAGE POLICIES

After creating the bucket, ensure storage policies exist. Run:

```sql
-- Check existing policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%verification%';
```

If policies are missing, run the migration:
- `supabase/migrations/20250108020000_fix_verification_documents_storage_policy.sql`

## STEP 6: TEST THE FIX

1. Re-upload ONE verification document from Owner side
2. Click "View" from Staff dashboard
3. Confirm:
   - ✅ No 404 error
   - ✅ File opens in browser

## SUMMARY

- **Bucket Name:** `verification-documents`
- **Status:** Check with SQL query above
- **Action Required:** Create bucket if missing (see Step 3)
- **Policies:** Ensure storage policies are applied

