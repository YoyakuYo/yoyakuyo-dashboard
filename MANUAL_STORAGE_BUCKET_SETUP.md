# Manual Storage Bucket Setup Instructions

## Error: "must be owner of table buckets"

This error occurs because storage bucket creation requires service role permissions. You need to create the bucket manually in the Supabase Dashboard.

## Steps to Create the Bucket:

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on **Storage** in the left sidebar

2. **Create New Bucket**
   - Click **"New bucket"** or **"Create bucket"** button
   - Fill in the details:
     - **Name:** `verification-documents`
     - **Public:** `false` (unchecked - this is a private bucket)
     - **File size limit:** `10 MB` (or 10485760 bytes)
     - **Allowed MIME types:** 
       - `image/jpeg`
       - `image/jpg`
       - `image/png`
       - `image/webp`
       - `application/pdf`
   - Click **"Create bucket"**

3. **Set Up Storage Policies** (After bucket is created)

   Go to **Storage → Policies** and select the `verification-documents` bucket.

   Create the following policies:

   **Policy 1: Owners can read their verification documents**
   - Policy type: `SELECT`
   - Target roles: `authenticated`
   - USING expression:
   ```sql
   bucket_id = 'verification-documents'
   AND auth.role() = 'authenticated'
   AND (
     (storage.foldername(name))[1] = auth.uid()::text
     OR EXISTS (
       SELECT 1 FROM shop_verification_requests svr
       JOIN shops s ON s.id = svr.shop_id
       WHERE s.owner_user_id = auth.uid()
       AND svr.id::text = (storage.foldername(name))[2]
     )
   )
   ```

   **Policy 2: Owners can upload verification documents**
   - Policy type: `INSERT`
   - Target roles: `authenticated`
   - WITH CHECK expression:
   ```sql
   bucket_id = 'verification-documents'
   AND auth.role() = 'authenticated'
   AND (storage.foldername(name))[1] = auth.uid()::text
   ```

   **Policy 3: Staff can read all verification documents**
   - Policy type: `SELECT`
   - Target roles: `authenticated`
   - USING expression:
   ```sql
   bucket_id = 'verification-documents'
   AND EXISTS (
     SELECT 1 FROM staff_profiles
     WHERE auth_user_id = auth.uid()
     AND active = TRUE
   )
   ```

## Alternative: Use Service Role

If you have access to the service role key, you can create the bucket using the Supabase CLI:

```bash
# Using service role (requires SUPABASE_SERVICE_ROLE_KEY)
supabase storage create-bucket verification-documents --public=false
```

## Verification

After creating the bucket, verify it exists:

```sql
SELECT * FROM storage.buckets WHERE id = 'verification-documents';
```

You should see the bucket with:
- `id`: `verification-documents`
- `public`: `false`
- `file_size_limit`: `10485760`
- `allowed_mime_types`: Array of image and PDF types

