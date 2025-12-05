# Quick Setup: Create Verification Documents Bucket

## ⚠️ IMPORTANT: Bucket Must Be Created Manually First

The SQL migration cannot create the bucket due to permissions. You must create it in the Supabase Dashboard first.

## Step-by-Step Instructions

### Step 1: Create the Bucket (2 minutes)

1. **Open Supabase Dashboard**
   - Go to your project
   - Click **Storage** in the left sidebar

2. **Create New Bucket**
   - Click **"New bucket"** button (top right)
   - Fill in the form:
     ```
     Name: verification-documents
     Public: ❌ (unchecked - keep it private)
     File size limit: 10 MB
     Allowed MIME types: 
       - image/jpeg
       - image/jpg
       - image/png
       - image/webp
       - application/pdf
     ```
   - Click **"Create bucket"**

3. **Verify It Was Created**
   - You should see `verification-documents` in your buckets list

### Step 2: Run the Policy Migration

After the bucket is created, run this migration to set up the storage policies:

```sql
-- File: supabase/migrations/20250106030000_create_verification_documents_bucket.sql
```

This migration will:
- ✅ Verify the bucket exists
- ✅ Create storage policies for owners to upload documents
- ✅ Create storage policies for staff to view documents
- ✅ Set up proper access controls

### Step 3: Test File Upload

Try uploading a verification document in the shop creation wizard. It should work now!

---

## Alternative: Use Node.js Script (If You Have Service Role Key)

If you have the service role key, you can use the automated script:

1. Add to `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. Run:
   ```bash
   npm install @supabase/supabase-js dotenv
   node scripts/create-verification-bucket.js
   ```

3. Then run the policy migration

---

## Troubleshooting

**Error: "must be owner of table buckets"**
- ✅ This is normal - bucket creation requires dashboard access
- ✅ Create the bucket manually in the Dashboard (Step 1 above)
- ✅ Then run the policy migration

**Error: "Storage bucket does not exist"**
- ✅ Make sure you created the bucket in Step 1 first
- ✅ Check the bucket name is exactly: `verification-documents`
- ✅ Verify it appears in Storage → Buckets list

**File upload still fails after bucket creation**
- ✅ Make sure you ran the policy migration after creating the bucket
- ✅ Check that the bucket name matches exactly: `verification-documents`
- ✅ Verify storage policies were created (Storage → Policies → verification-documents)

