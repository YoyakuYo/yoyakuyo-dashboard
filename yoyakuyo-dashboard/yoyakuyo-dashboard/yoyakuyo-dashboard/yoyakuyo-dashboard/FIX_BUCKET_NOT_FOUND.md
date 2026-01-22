# Fix: "Bucket not found" Error for shop_photos

## Problem
- Error: "Failed to upload socialize.jpg: Bucket not found"
- Bucket `shop_photos` exists in Supabase
- Storage policies exist (5 policies confirmed)
- Code uses correct bucket name: `'shop_photos'`

## Root Cause
The frontend Supabase client is likely connecting to a **different Supabase project** than where the bucket exists.

## Diagnosis Steps

### Step 1: Verify Bucket Exists
Run this SQL in Supabase SQL Editor:
```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'shop_photos';
```
**Expected:** Should return 1 row

### Step 2: Check Frontend Environment Variables
In **Vercel Dashboard** → **Environment Variables**, verify:
- `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key

### Step 3: Check Backend Environment Variables
In **Render Dashboard** → **Environment Variables**, verify:
- `SUPABASE_URL` = Same as `NEXT_PUBLIC_SUPABASE_URL` (frontend)
- `SUPABASE_SERVICE_ROLE_KEY` = From same project

### Step 4: Verify URLs Match
**CRITICAL:** Both must point to the same Supabase project:
- Frontend: `NEXT_PUBLIC_SUPABASE_URL` = `https://[PROJECT_ID].supabase.co`
- Backend: `SUPABASE_URL` = `https://[PROJECT_ID].supabase.co`

If they differ → **MIXED PROJECTS** → **This is the issue**

## Solution

### Option A: Fix Environment Variables (if mismatched)
1. Go to Vercel Dashboard → Environment Variables
2. Update `NEXT_PUBLIC_SUPABASE_URL` to match backend
3. Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` to match backend project
4. Redeploy frontend

### Option B: Create Bucket in Correct Project (if using different projects)
If you're intentionally using different projects:
1. Go to the Supabase project that the frontend connects to
2. Create `shop_photos` bucket there
3. Set up the same storage policies

## Quick Test
Add this to your browser console on the shop page:
```javascript
const { getSupabaseClient } = await import('@/lib/supabaseClient');
const supabase = getSupabaseClient();
console.log('Supabase URL:', supabase.supabaseUrl);
console.log('Testing bucket access...');
const { data, error } = await supabase.storage.from('shop_photos').list();
console.log('Bucket test result:', { data, error });
```

This will show:
- Which Supabase project the frontend is using
- The exact error message from Supabase

## Most Likely Fix
**Update Vercel environment variables to match your Supabase project where the bucket exists.**

