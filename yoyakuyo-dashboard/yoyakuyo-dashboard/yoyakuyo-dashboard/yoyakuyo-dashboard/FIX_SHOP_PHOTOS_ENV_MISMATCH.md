# Fix: shop_photos "Bucket not found" Error

## Problem
- Error: "Failed to upload socialize.jpg: Bucket not found"
- Bucket `shop_photos` exists in Supabase ✅
- Storage policies exist (5 policies) ✅
- Code uses correct bucket name: `'shop_photos'` ✅

## Root Cause
The frontend Supabase client is connecting to a **different Supabase project** than where the bucket exists.

## Solution

### Step 1: Verify Environment Variables Match

**Frontend (Vercel):**
- `NEXT_PUBLIC_SUPABASE_URL` = `https://[PROJECT_ID].supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Anon key from same project

**Backend (Render):**
- `SUPABASE_URL` = **MUST MATCH** `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` = Service role key from same project

### Step 2: Check Which Project Frontend Connects To

Add this to browser console on shop page:
```javascript
const { getSupabaseClient } = await import('@/lib/supabaseClient');
const supabase = getSupabaseClient();
console.log('Frontend Supabase URL:', supabase.supabaseUrl);
console.log('Project ID:', supabase.supabaseUrl.split('//')[1].split('.')[0]);
```

### Step 3: Verify Bucket Exists in That Project

1. Go to Supabase Dashboard
2. Check the project ID in the URL: `https://supabase.com/dashboard/project/[PROJECT_ID]`
3. Verify it matches the frontend URL
4. Go to Storage → Buckets
5. Confirm `shop_photos` bucket exists

### Step 4: Fix Environment Variables

If URLs don't match:
1. **Vercel Dashboard** → Environment Variables
2. Update `NEXT_PUBLIC_SUPABASE_URL` to match backend
3. Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` to match backend project
4. **Redeploy frontend**

### Step 5: Alternative - Create Bucket in Frontend Project

If you're using different projects intentionally:
1. Go to the Supabase project that frontend connects to
2. Create `shop_photos` bucket (public: true)
3. Set up the same 5 storage policies

## Quick Test

After fixing env vars, test in browser console:
```javascript
const { getSupabaseClient } = await import('@/lib/supabaseClient');
const supabase = getSupabaseClient();
const { data, error } = await supabase.storage.from('shop_photos').list();
console.log('Bucket access test:', { data, error });
```

If `error` is null → Fixed! ✅
If `error.message` contains "not found" → Still wrong project ❌

