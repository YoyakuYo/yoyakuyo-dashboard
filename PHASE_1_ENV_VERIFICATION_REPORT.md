# PHASE 1 — ENVIRONMENT VERIFICATION REPORT

## Required Environment Variables

### Backend API (Render Production)
**Location:** Render Dashboard → Environment Variables

**Required Variables:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS)
- `NEXT_PUBLIC_SUPABASE_URL` - (Optional, for frontend compatibility)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - (Optional, for frontend compatibility)

**Backend Code Usage:**
- File: `yoyakuyo-api/src/lib/supabase.ts`
- Uses: `SUPABASE_URL` (line 10)
- Uses: `SUPABASE_SERVICE_ROLE_KEY` (line 11)
- ✅ **CORRECT** - Uses service role key for admin operations

---

### Frontend Dashboard (Next.js/Vercel)
**Location:** Vercel Dashboard → Environment Variables

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (must match backend)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key (respects RLS)

**Frontend Code Usage:**
- Files: `lib/supabase.ts`, `lib/supabaseClient.ts`
- Uses: `NEXT_PUBLIC_SUPABASE_URL`
- Uses: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ **CORRECT** - Uses anon key for client-side operations

---

## Verification Checklist

### ✅ Step 1: Check Render Environment Variables
1. Go to Render Dashboard → Your Service → Environment
2. Verify these exist:
   - `SUPABASE_URL` = `https://[your-project].supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...` (JWT token)

### ✅ Step 2: Check Vercel Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these exist:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://[your-project].supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJ...` (JWT token)

### ✅ Step 3: Verify URLs Match
- **CRITICAL:** `SUPABASE_URL` (Render) must equal `NEXT_PUBLIC_SUPABASE_URL` (Vercel)
- Both must point to the same Supabase project
- If they differ → **MIXED PROJECTS** → **FAIL**

### ✅ Step 4: Verify Keys Match Project
- `SUPABASE_SERVICE_ROLE_KEY` must be from the same project as `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be from the same project as `NEXT_PUBLIC_SUPABASE_URL`
- If keys don't match URLs → **MIXED PROJECTS** → **FAIL**

---

## Expected Results

### ✅ PASS Criteria:
- All 4 variables are defined
- `SUPABASE_URL` (Render) = `NEXT_PUBLIC_SUPABASE_URL` (Vercel)
- Keys match their respective projects
- No undefined variables

### ❌ FAIL Criteria:
- Any variable is undefined
- URLs don't match
- Keys don't match their projects
- Mixing different Supabase projects

---

## Manual Verification Steps

**To verify in production:**

1. **Check Render logs:**
   ```bash
   # In Render dashboard, check if startup shows:
   # "SUPABASE_URL is required" error → FAIL
   # No error → PASS (but verify values match)
   ```

2. **Check Vercel build logs:**
   ```bash
   # In Vercel dashboard, check if build shows:
   # "NEXT_PUBLIC_SUPABASE_URL is missing" → FAIL
   # No error → PASS (but verify values match)
   ```

3. **Test API connection:**
   ```bash
   curl https://your-api.onrender.com/health
   # Should return 200 OK
   ```

4. **Test frontend connection:**
   ```bash
   # Open browser console on your site
   # Should NOT show: "Supabase environment variables are missing"
   ```

---

## ⚠️ ACTION REQUIRED

**YOU MUST MANUALLY VERIFY:**
1. Log into Render Dashboard
2. Log into Vercel Dashboard  
3. Compare the values
4. Report any mismatches

**This audit cannot access production environment variables directly.**

