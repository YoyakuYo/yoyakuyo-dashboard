# 🔍 FULL PROJECT-WIDE DIAGNOSTIC REPORT

**Date:** 2025-01-23  
**Scope:** Frontend (Vercel) + Backend (Render) + Supabase Database  
**Purpose:** Identify all issues causing login failures and shop visibility problems

---

## A. SUPABASE CLIENT USAGE VERIFICATION

### ✅ Backend Supabase Client (`yoyakuyo-api/src/lib/supabase.ts`)

**File:** `yoyakuyo-api/src/lib/supabase.ts:10-34`

**Status:** ✅ **CORRECT**

- Uses `SUPABASE_SERVICE_ROLE_KEY` (Line 11)
- Uses `SUPABASE_URL` (Line 10)
- **NO** usage of `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- Creates admin client that bypasses RLS ✅

**Code:**
```typescript
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

---

### ✅ Frontend Supabase Client (`yoyakuyo-dashboard/lib/supabaseClient.ts`)

**File:** `yoyakuyo-dashboard/lib/supabaseClient.ts:20-54`

**Status:** ✅ **CORRECT**

- Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Line 21)
- Uses `NEXT_PUBLIC_SUPABASE_URL` (Line 20)
- **NO** usage of `SUPABASE_SERVICE_ROLE_KEY` ✅
- Creates client-side client that respects RLS ✅

**Code:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

---

### ⚠️ ISSUE: Missing `apikey` Header in Frontend Supabase Auth Calls

**Problem:** Supabase Auth API requires `apikey` header for authentication requests, but frontend code does NOT include it.

**Files Affected:**
- `yoyakuyo-dashboard/app/login/page.tsx:22`
- `yoyakuyo-dashboard/app/page.tsx:119`

**Current Code:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

**Issue:** The Supabase JS client should automatically add headers, but if there's a 400 "no apikey found" error, it means:
1. The client is not properly initialized with the ANON key
2. OR the ANON key is missing/incorrect in environment variables
3. OR there's a network issue preventing headers from being sent

**Root Cause:** The Supabase JS client library (`@supabase/supabase-js`) should automatically include the `apikey` header when initialized with a key. If you're getting "no apikey found", it means:
- The client was initialized with a placeholder key (see `supabaseClient.ts:34-44`)
- OR the environment variable `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing/undefined

**Fix Required:** Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly in Vercel environment variables.

---

## B. ENVIRONMENT VARIABLES VERIFICATION

### Backend Environment Variables (Render)

**Required Variables:**
- ✅ `SUPABASE_URL` - Confirmed: `https://neguwrjykwnfhdlwktpd.supabase.co`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Confirmed: Present
- ✅ `FRONTEND_URL` - Confirmed: `https://yoyakuyo-dashboard.vercel.app`
- ✅ `NODE_ENV` - Confirmed: `production`

**Status:** ✅ **ALL CORRECT**

---

### Frontend Environment Variables (Vercel)

**Required Variables:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Should be: `https://neguwrjykwnfhdlwktpd.supabase.co`
- ⚠️ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - **MUST VERIFY** (this is likely the login issue)
- ✅ `NEXT_PUBLIC_API_URL` - Should be: `https://yoyakuyo-api.onrender.com`

**Status:** ⚠️ **VERIFY `NEXT_PUBLIC_SUPABASE_ANON_KEY`**

**Issue:** If `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing or incorrect, the Supabase client will initialize with placeholder values (see `supabaseClient.ts:34-44`), causing:
- 400 "no apikey found" errors
- Login failures
- All Supabase Auth calls to fail

---

### Local Development Environment Variables

**File:** `yoyakuyo-dashboard/.env.local` (if exists)

**Expected:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://neguwrjykwnfhdlwktpd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**File:** `yoyakuyo-api/.env` (if exists)

**Expected:**
```env
SUPABASE_URL=https://neguwrjykwnfhdlwktpd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
FRONTEND_URL=http://localhost:3001
NODE_ENV=development
```

---

## C. AUTH ROUTES VERIFICATION

### ✅ Frontend Login Routes

**Files:**
- `yoyakuyo-dashboard/app/login/page.tsx:22-25`
- `yoyakuyo-dashboard/app/page.tsx:119-122`

**Status:** ✅ **CORRECT**

- Uses `supabase.auth.signInWithPassword()` directly
- No custom backend login route
- Syncs user to `users` table after login via `/auth/sync-user`

**Code:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

**Note:** The Supabase JS client automatically includes required headers (`apikey`, `Authorization`) when initialized correctly.

---

### ✅ Backend Auth Routes

**File:** `yoyakuyo-api/src/routes/auth.ts`

**Routes:**
- ✅ `POST /auth/sync-user` - Syncs user from `auth.users` to `users` table
- ✅ `POST /auth/signup-owner` - Creates user and shop

**Status:** ✅ **NO LOGIN ROUTE** (correct - login is handled by Supabase Auth)

**Table References:**
- ✅ Uses `users` table (NOT `public.users` or `auth.users` for data storage)
- ✅ References `auth.users` only for authentication (via Supabase Auth)

---

### ⚠️ ISSUE: 400 "no apikey found" Error

**Error:** `POST https://neguwrjykwnfhdlwktpd.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)`

**Root Cause:** This error occurs when:
1. The Supabase client is initialized with a placeholder key (see `supabaseClient.ts:34-44`)
2. OR the `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variable is missing/undefined
3. OR the ANON key is incorrect/truncated

**Fix:** Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables matches the ANON key from Supabase Dashboard → Settings → API.

---

## D. SHOP ROUTES VERIFICATION

### ❌ CRITICAL ISSUE: Pagination Limit Too Small

**File:** `yoyakuyo-api/src/routes/shops.ts:32`

**Problem:** Default limit is **50 shops per page**, but frontend does NOT implement pagination to fetch all pages.

**Code:**
```typescript
const limit = parseInt(req.query.limit as string) || 50;  // ❌ DEFAULT 50
const offset = (page - 1) * limit;
```

**Impact:**
- Frontend only receives **50 shops** per request
- Frontend does NOT make multiple requests to fetch all pages
- **Result:** Only 50 shops visible (or fewer if filtered)

**Evidence:**
- `yoyakuyo-dashboard/app/browse/page.tsx:93` - Makes single request: `fetch(\`${apiUrl}/shops\`)`
- `yoyakuyo-dashboard/app/dashboard/page.tsx:76` - Requests limit 100: `shopsApi.getAll(1, 100)`
- **No pagination logic** in frontend to fetch all pages

---

### ❌ CRITICAL ISSUE: Wrong Total Count Calculation

**File:** `yoyakuyo-api/src/routes/shops.ts:71`

**Problem:** Returns `total: validShops.length` instead of using the actual `count` from Supabase.

**Code:**
```typescript
const { data, error, count } = await query;  // count is the total from DB
// ...
res.json({
  data: validShops,
  pagination: {
    page,
    limit,
    total: validShops.length,  // ❌ WRONG - This is only the current page count
    totalPages: Math.ceil(validShops.length / limit),  // ❌ WRONG
  },
});
```

**Impact:**
- Frontend thinks there are only 50 shops total (or fewer)
- Pagination UI (if any) shows incorrect page counts
- Frontend cannot determine if more pages exist

**Fix Required:** Use `count` from Supabase query result:
```typescript
total: count || validShops.length,  // Use DB count if available
totalPages: Math.ceil((count || validShops.length) / limit),
```

---

### ✅ Address Filtering (Correct)

**File:** `yoyakuyo-api/src/routes/shops.ts:41,62-64`

**Status:** ✅ **CORRECT**

- Filters out shops with NULL or empty addresses
- Uses `.neq("address", "")` in query
- Additional client-side filter for safety

**Code:**
```typescript
.neq("address", "")  // Filters empty strings
// ...
const validShops = (data || []).filter(
  (shop: Shop) => shop.address && shop.address.trim() !== ""
);
```

**Note:** This is intentional - only shops with valid addresses should be displayed.

---

### ✅ No Prefecture/Category/Lat/Lng Filtering

**File:** `yoyakuyo-api/src/routes/shops.ts:28-79`

**Status:** ✅ **CORRECT**

- Does NOT filter by prefecture (NULL is allowed)
- Does NOT filter by category (NULL is allowed)
- Does NOT filter by lat/lng (NULL is allowed)
- Only filters by address (NULL/empty addresses excluded)

**Frontend Filtering:**
- `yoyakuyo-dashboard/lib/shopBrowseData.ts:148-177` - Builds area tree from ALL shops
- `extractPrefecture()` function handles NULL addresses gracefully (returns 'unknown')
- Shops with NULL prefecture/category are included in 'unknown' category

---

### ✅ Table Name Correct

**File:** `yoyakuyo-api/src/routes/shops.ts:39`

**Status:** ✅ **CORRECT**

- Uses `.from("shops")` (NOT `public.shops` or `public_shops`)
- Supabase client automatically resolves to `public.shops` schema

---

## E. RLS BEHAVIOR VERIFICATION

### ✅ Backend Bypasses RLS

**File:** `yoyakuyo-api/src/lib/supabase.ts:29`

**Status:** ✅ **CORRECT**

- Backend uses `SUPABASE_SERVICE_ROLE_KEY`
- Service role key bypasses all RLS policies
- Backend can read/write any data regardless of RLS

**Impact:** Backend queries are NOT affected by RLS policies on `users` or `shops` tables.

---

### ✅ Frontend Respects RLS

**File:** `yoyakuyo-dashboard/lib/supabaseClient.ts:48`

**Status:** ✅ **CORRECT**

- Frontend uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Anon key respects RLS policies
- Frontend queries are subject to RLS on `users` and `shops` tables

**RLS Policy on `users` table:**
- SELECT: `auth.uid() = id` (users can only read their own record)
- INSERT: `auth.uid() = id` (users can only insert their own record)
- UPDATE: `auth.uid() = id` (users can only update their own record)

**RLS Policy on `shops` table:**
- Public SELECT: All users can read shops (if RLS allows)
- Owner UPDATE: Only shop owners can update their shops

---

## F. API CALLS FROM FRONTEND VERIFICATION

### ✅ Backend API Calls Include Headers

**File:** `yoyakuyo-dashboard/lib/apiClient.ts:37-50`

**Status:** ✅ **CORRECT**

- Includes `Content-Type: application/json`
- Includes `x-user-id` header when user is authenticated
- Uses `apiClient` class for all backend API calls

**Code:**
```typescript
const headers: HeadersInit = {
  'Content-Type': 'application/json',
  ...customHeaders,
};
if (userId) {
  headers['x-user-id'] = userId;
}
```

---

### ⚠️ ISSUE: Supabase Auth Calls Don't Need Manual Headers

**Status:** ✅ **CORRECT** (Supabase JS client handles headers automatically)

The Supabase JS client (`@supabase/supabase-js`) automatically includes:
- `apikey: <anon-key>` header
- `Authorization: Bearer <anon-key>` header

**No manual header configuration needed** for `supabase.auth.*` calls.

---

## G. CORS AND URL VERIFICATION

### ✅ CORS Configuration

**File:** `yoyakuyo-api/src/index.ts:25-52`

**Status:** ✅ **CORRECT**

- Allows `https://yoyakuyo-dashboard.vercel.app`
- Allows all `vercel.app` subdomains in production
- Allows localhost for development
- Includes `credentials: true`

**Code:**
```typescript
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3001',
  'https://yoyakuyo-dashboard.vercel.app',
  'http://localhost:3001',
  'http://localhost:3000',
];
```

---

### ✅ API URL Configuration

**Frontend:** `yoyakuyo-dashboard/lib/apiClient.ts:10`
- Uses `process.env.NEXT_PUBLIC_API_URL`
- Should be: `https://yoyakuyo-api.onrender.com`

**Backend:** `yoyakuyo-api/src/index.ts:22`
- Uses `process.env.PORT` (defaults to 3000)
- Render automatically sets PORT

**Status:** ✅ **CORRECT**

---

## H. SUPABASE AUTH TABLES VERIFICATION

### ✅ Table References Correct

**Backend:** `yoyakuyo-api/src/routes/auth.ts`

**Status:** ✅ **CORRECT**

- Uses `users` table (NOT `public.users` or `auth.users` for data)
- References `auth.users` only via Supabase Auth (automatic)
- No direct queries to `auth.users` table

**Code:**
```typescript
.from("users")  // ✅ Correct - refers to public.users table
```

**Note:** Supabase Auth handles `auth.users` table automatically. Backend only manages the custom `users` table for profile data.

---

## I. SHOP COUNT PROBLEM - ROOT CAUSE ANALYSIS

### 🔴 PRIMARY ISSUE: Pagination Limit = 50

**File:** `yoyakuyo-api/src/routes/shops.ts:32`

**Problem:**
```typescript
const limit = parseInt(req.query.limit as string) || 50;  // ❌ DEFAULT 50
```

**Impact:**
- Backend returns only **50 shops per page**
- Frontend makes **single request** (no pagination)
- Frontend receives only **50 shops** (or fewer after filtering)

**Evidence:**
- `yoyakuyo-dashboard/app/browse/page.tsx:93` - Single fetch, no pagination
- `yoyakuyo-dashboard/app/dashboard/page.tsx:76` - Requests limit 100, but still only one page

**Expected:** 14,855 valid shops  
**Actual:** ~50 shops returned (or 100 if limit=100 is specified)

---

### 🔴 SECONDARY ISSUE: Wrong Total Count

**File:** `yoyakuyo-api/src/routes/shops.ts:71`

**Problem:**
```typescript
total: validShops.length,  // ❌ Only current page count (50 or less)
```

**Impact:**
- Frontend thinks there are only 50 shops total
- Cannot implement pagination (doesn't know total count)
- UI shows incorrect shop counts

**Fix Required:**
```typescript
total: count || validShops.length,  // Use DB count
totalPages: Math.ceil((count || validShops.length) / limit),
```

---

### ✅ Address Filtering (Intentional)

**Status:** ✅ **CORRECT** (This is intentional)

- Filters out shops with NULL/empty addresses
- Only 14,855 shops have valid addresses (per user's data)
- This is the expected behavior

---

### ✅ No Prefecture/Category Filtering

**Status:** ✅ **CORRECT**

- Backend does NOT filter by prefecture/category
- Frontend handles NULL prefecture/category gracefully
- Shops with NULL prefecture appear in 'unknown' category

---

### ✅ Frontend Tree Building (Correct)

**File:** `yoyakuyo-dashboard/lib/shopBrowseData.ts:145-256`

**Status:** ✅ **CORRECT**

- `buildAreaTree()` handles NULL addresses (returns 'unknown')
- `buildCategoryTree()` handles NULL category_id (uses 'unknown')
- All shops are included in trees (except hidden shops)

**Issue:** Trees are built from only 50 shops (due to pagination limit), not all 14,855 shops.

---

## J. SUMMARY OF ISSUES

### 🔴 CRITICAL ISSUES

1. **Pagination Limit Too Small**
   - **File:** `yoyakuyo-api/src/routes/shops.ts:32`
   - **Issue:** Default limit = 50, frontend doesn't paginate
   - **Impact:** Only 50 shops visible instead of 14,855
   - **Fix:** Increase default limit OR implement frontend pagination

2. **Wrong Total Count**
   - **File:** `yoyakuyo-api/src/routes/shops.ts:71`
   - **Issue:** Returns `validShops.length` instead of `count`
   - **Impact:** Frontend thinks there are only 50 shops
   - **Fix:** Use `count` from Supabase query result

3. **Missing/Incorrect ANON Key (Likely Login Issue)**
   - **File:** Vercel Environment Variables
   - **Issue:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` may be missing/incorrect
   - **Impact:** 400 "no apikey found" error, login failures
   - **Fix:** Verify ANON key in Vercel matches Supabase Dashboard

---

### ⚠️ WARNINGS

1. **No Frontend Pagination**
   - **File:** `yoyakuyo-dashboard/app/browse/page.tsx:93`
   - **Issue:** Single fetch, no pagination logic
   - **Impact:** Cannot load all shops even if backend supports pagination
   - **Fix:** Implement pagination OR increase backend limit to fetch all shops

2. **Placeholder Supabase Client**
   - **File:** `yoyakuyo-dashboard/lib/supabaseClient.ts:34-44`
   - **Issue:** Creates placeholder client if env vars missing
   - **Impact:** Silent failures, 400 errors
   - **Fix:** Ensure env vars are set correctly

---

### ✅ CORRECT IMPLEMENTATIONS

1. ✅ Supabase client usage (backend uses service role, frontend uses anon)
2. ✅ Table references (`users` table, not `public.users` or `auth.users`)
3. ✅ Address filtering (intentional - only valid addresses)
4. ✅ No prefecture/category/lat/lng filtering (NULL allowed)
5. ✅ CORS configuration (allows Vercel frontend)
6. ✅ Auth routes (frontend uses Supabase Auth directly)
7. ✅ RLS behavior (backend bypasses, frontend respects)

---

## K. RECOMMENDED FIXES

### Priority 1: Fix Shop Visibility (14,855 shops → visible)

**Option A: Increase Backend Limit (Quick Fix)**
```typescript
// yoyakuyo-api/src/routes/shops.ts:32
const limit = parseInt(req.query.limit as string) || 20000;  // Fetch all shops
```

**Option B: Implement Frontend Pagination (Better)**
- Fetch all pages until `totalPages` is reached
- Combine all pages into single array
- Update `yoyakuyo-dashboard/app/browse/page.tsx`

**Option C: Backend Batch Fetching (Best)**
- Implement `fetchAllShops()` helper (like in `apps/api/src/routes/shops.ts:14`)
- Fetch all shops in batches of 1000
- Return all shops in single response

---

### Priority 2: Fix Total Count

```typescript
// yoyakuyo-api/src/routes/shops.ts:71
total: count || validShops.length,  // Use DB count
totalPages: Math.ceil((count || validShops.length) / limit),
```

---

### Priority 3: Fix Login (400 Error)

1. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
2. Copy full key from Supabase Dashboard → Settings → API
3. Redeploy frontend (env vars only apply to new deployments)

---

## END OF REPORT

**Next Steps:**
1. Review this report
2. Verify environment variables in Vercel
3. Apply fixes in priority order
4. Test login and shop visibility
