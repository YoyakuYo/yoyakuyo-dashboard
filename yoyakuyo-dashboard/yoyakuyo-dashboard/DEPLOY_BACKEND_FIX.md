# ⚠️ IMPORTANT: Backend Deployment Required

## Issue
The error "Could not find the 'file_url' column" is still occurring because **the backend API hasn't been redeployed yet**.

## Fix Applied
The backend code has been fixed to:
- ✅ Remove `file_url` from the INSERT statement
- ✅ Only use `file_path` (which exists in the table)

## Action Required

### Option 1: Auto-Deploy (if Render is connected to GitHub)
1. The changes are already pushed to GitHub
2. Render should automatically detect the push and redeploy
3. Check Render Dashboard → Deploys to see if a new deploy is in progress
4. Wait for deployment to complete (usually 2-5 minutes)

### Option 2: Manual Deploy
1. Go to **Render Dashboard** → Your API service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for deployment to complete

### Option 3: Verify Deployment
After deployment, check the logs:
1. Render Dashboard → Your API service → **Logs**
2. Look for: `Server running on port...`
3. Verify the latest commit hash matches your push

## After Deployment
Once the backend is redeployed:
1. Try uploading a verification document again
2. The error should be resolved ✅

## If Error Persists After Deployment

### Check PostgREST Schema Cache
The error `PGRST204` suggests PostgREST's schema cache might be stale. Try:

1. **Supabase Dashboard** → **API** → **Settings**
2. Click **"Reload Schema"** or **"Refresh Schema Cache"**
3. Wait 30 seconds
4. Try upload again

### Verify Table Schema
Run this SQL in Supabase Dashboard:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'owner_verification_documents'
ORDER BY ordinal_position;
```

**Expected columns:**
- `id` (uuid)
- `verification_id` (uuid)
- `document_type` (text)
- `file_path` (text)
- `created_at` (timestamptz)

**Should NOT have:**
- ❌ `file_url` (this column doesn't exist)

