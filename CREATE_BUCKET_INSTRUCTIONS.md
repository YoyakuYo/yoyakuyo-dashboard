# Create Verification Documents Storage Bucket

## Quick Method: Use Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Open your project
   - Click **Storage** in the left sidebar

2. **Create Bucket**
   - Click **"New bucket"** or **"Create bucket"**
   - Fill in:
     - **Name:** `verification-documents`
     - **Public:** `false` (unchecked - private bucket)
     - **File size limit:** `10 MB` (or `10485760` bytes)
     - **Allowed MIME types:** 
       - `image/jpeg`
       - `image/jpg`
       - `image/png`
       - `image/webp`
       - `application/pdf`
   - Click **"Create bucket"**

3. **Run the Policy Migration**
   - After bucket is created, run:
   - `supabase/migrations/20250106030000_create_verification_documents_bucket.sql`
   - This will create the storage policies

---

## Alternative Method: Use Node.js Script

1. **Add Service Role Key to .env.local**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
   Find it in: Supabase Dashboard → Settings → API → service_role key

2. **Run the Script**
   ```bash
   npm install @supabase/supabase-js dotenv
   node scripts/create-verification-bucket.js
   ```

3. **Run the Policy Migration**
   - After bucket is created, run:
   - `supabase/migrations/20250106030000_create_verification_documents_bucket.sql`

---

## Alternative Method: Use SQL with Service Role

1. **Get Service Role Key**
   - Supabase Dashboard → Settings → API → service_role key

2. **Run SQL in Supabase Dashboard**
   - Go to SQL Editor
   - Run: `supabase/migrations/20250106040000_create_verification_bucket_via_sql.sql`
   - This requires service role permissions

---

## Verify Bucket Was Created

Run this query in Supabase SQL Editor:

```sql
SELECT * FROM storage.buckets WHERE id = 'verification-documents';
```

You should see:
- `id`: `verification-documents`
- `public`: `false`
- `file_size_limit`: `10485760`
- `allowed_mime_types`: Array with image and PDF types

---

## After Bucket is Created

The storage policies will be automatically created when you run:
- `supabase/migrations/20250106030000_create_verification_documents_bucket.sql`

Or they're already included in:
- `supabase/migrations/20250106040000_create_verification_bucket_via_sql.sql`

