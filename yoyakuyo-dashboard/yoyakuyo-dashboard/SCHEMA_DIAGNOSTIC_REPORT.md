# 🔍 Schema Diagnostic Report - Pre-Fix Analysis

**Generated:** 2025-01-24  
**Purpose:** Diagnose current code state before implementing fixes for real Supabase schema

---

## 📋 EXECUTIVE SUMMARY

### Current Understanding vs. Real Schema

**User's Description:**
- ✅ `auth.users` - Supabase Auth users (correct)
- ✅ `public.users` - Business owner profiles (custom table) - **EXISTS**
- ✅ `public.shops` - Contains 96,000+ shops - **EXISTS**
- ⚠️ `shop_owner_un...` - Mapping table between shops and users - **NEEDS VERIFICATION**

**Current Code Assumptions:**
- ❌ Code uses `shops.owner_user_id` (direct foreign key) - **WRONG if mapping table exists**
- ❌ Code filters shops by `owner_user_id = current_user` - **BLOCKS 95% of shops**
- ❌ No join with mapping table - **MISSING if mapping table exists**

---

## 🔍 1. ALL LOCATIONS REFERENCING `users` TABLE

### Backend (`yoyakuyo-api/`)

#### `src/routes/auth.ts`
**Lines 24-28, 48-57, 64-67, 112-115, 129-131, 143-152, 170-173:**
```typescript
// Current queries:
.from("users")
.select("id, email, name")
.eq("id", user_id)
.maybeSingle()

.from("users")
.insert([{ id: user_id, email: email, name: name || email.split("@")[0] }])

.from("users")
.update({ email, name })
.eq("id", user_id)

.from("users")
.select("id")
.eq("id", user_id)
.single()
```

**Status:** ✅ Correctly references `public.users` table

#### `src/routes/shops.ts`
**Lines 35-48, 78-88:**
```typescript
// Current queries:
.from("shops")
.select("*", { count: "exact" })
// Filters by owner_user_id if userId provided
if (userId) {
  query = query.eq("owner_user_id", userId);  // ❌ WRONG - blocks 95% of shops
}
```

**Status:** ❌ **PROBLEM** - Filters by `owner_user_id` directly, blocking public shops

#### `src/routes/bookings.ts`
**Line 22:**
```typescript
.select("id, name, owner_email, owner_user_id")
```

**Status:** ⚠️ References `owner_user_id` but doesn't filter by it

### Frontend (`yoyakuyo-dashboard/`)

#### `app/page.tsx`
**Lines 150-161:**
```typescript
// Comments mention "public.users table"
await authApi.syncUser(...)
```

**Status:** ✅ Correctly calls sync endpoint

#### `app/login/page.tsx`
**Lines 31-42:**
```typescript
// Comments mention "public.users table"
await authApi.syncUser(...)
```

**Status:** ✅ Correctly calls sync endpoint

#### `app/shops/page.tsx`
**Line 362:**
```typescript
const url = `${apiUrl}/shops?owner_user_id=${encodeURIComponent(user.id)}`;
```

**Status:** ❌ **PROBLEM** - Filters by `owner_user_id` query param (backend doesn't use this)

#### `app/dashboard/page.tsx`
**Lines 73-94:**
```typescript
const response = await shopsApi.getAll(1, 100);
// Uses x-user-id header which triggers filtering
```

**Status:** ❌ **PROBLEM** - Sends `x-user-id` header, causing backend to filter shops

#### `app/browse/page.tsx`
**Lines 85-113:**
```typescript
const res = await fetch(`${apiUrl}/shops${params.toString() ? `?${params.toString()}` : ''}`);
// No x-user-id header - should return ALL shops
```

**Status:** ✅ Correctly fetches all shops (no auth header)

---

## 🔍 2. CURRENT SQL QUERIES FOR `/shops`

### Backend Route: `yoyakuyo-api/src/routes/shops.ts`

#### GET `/shops` (List All Shops)
```typescript
// Current Implementation:
let query = supabase
  .from("shops")
  .select("*", { count: "exact" })
  .order("name", { ascending: true })
  .range(offset, offset + limit - 1);

// ❌ PROBLEM: Filters by owner_user_id if user authenticated
if (userId) {
  query = query.eq("owner_user_id", userId);
  // This blocks 95% of shops (only shows shops where owner_user_id = current user)
}

// ✅ CORRECT: Should return ALL shops (public directory)
// Owners see their linked shops via mapping table, not direct filter
```

**Current SQL Generated:**
```sql
-- When user authenticated:
SELECT * FROM shops 
WHERE owner_user_id = '<user_id>'  -- ❌ WRONG - blocks 95% of shops
ORDER BY name ASC
LIMIT 50 OFFSET 0;

-- When no user:
SELECT * FROM shops  -- ✅ CORRECT - shows all shops
ORDER BY name ASC
LIMIT 50 OFFSET 0;
```

**Required SQL (After Fix):**
```sql
-- Always return ALL shops (public directory)
SELECT * FROM shops 
ORDER BY name ASC
LIMIT 50 OFFSET 0;

-- For owner's linked shops, use mapping table:
SELECT s.* 
FROM shops s
INNER JOIN shop_owner_un... so ON s.id = so.shop_id
WHERE so.user_id = '<user_id>';
```

#### GET `/shops/:id` (Single Shop)
```typescript
// Current Implementation:
let query = supabase
  .from("shops")
  .select("*")
  .eq("id", id)
  .single();

// ❌ PROBLEM: Filters by owner_user_id if user authenticated
if (userId) {
  query = query.eq("owner_user_id", userId);
  // This prevents viewing shops you don't own
}
```

**Current SQL Generated:**
```sql
-- When user authenticated:
SELECT * FROM shops 
WHERE id = '<shop_id>' 
  AND owner_user_id = '<user_id>';  -- ❌ WRONG - blocks public shop viewing

-- When no user:
SELECT * FROM shops 
WHERE id = '<shop_id>';  -- ✅ CORRECT
```

**Required SQL (After Fix):**
```sql
-- Always allow viewing any shop (public data)
SELECT * FROM shops 
WHERE id = '<shop_id>';

-- For owner-only fields, check mapping table separately
```

---

## 🔍 3. CURRENT RLS POLICIES

### Based on Migration Files Found:

#### `public.users` Table
**From:** `supabase/migrations/create_users_table.sql`, `20251123000000_fix_users_table_rls_and_constraints.sql`

**Expected Policies:**
```sql
-- SELECT: Users can read own record
CREATE POLICY "Users can read own record"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- INSERT: Users can insert own record
CREATE POLICY "Users can insert own record"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update own record
CREATE POLICY "Users can update own record"
ON public.users
FOR UPDATE
USING (auth.uid() = id);
```

**Status:** ⚠️ **VERIFY IN DATABASE** - Policies exist in migrations but need verification

#### `public.shops` Table
**From:** `supabase/migrations/enable_shops_rls.sql`, `20251122000001_fix_shops_insert_rls_policy.sql`

**Expected Policies:**
```sql
-- SELECT: Allow public read access (from enable_shops_rls.sql)
CREATE POLICY "Allow public read access to shops"
ON shops
FOR SELECT
USING (true);  -- ✅ CORRECT - allows all users to read

-- INSERT: Allow authenticated users to insert shops for themselves
CREATE POLICY "Allow authenticated users to insert shop for themselves"
ON shops
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_user_id);

-- UPDATE: Allow users to update shops they own
CREATE POLICY "Allow users to update own shops"
ON shops
FOR UPDATE
USING (auth.uid() = owner_user_id OR owner_user_id IS NULL);

-- DELETE: Allow users to delete shops they own
CREATE POLICY "Allow users to delete own shops"
ON shops
FOR DELETE
USING (auth.uid() = owner_user_id);
```

**Status:** ⚠️ **VERIFY IN DATABASE** - Policies exist in migrations but need verification

**⚠️ CRITICAL ISSUE:**
- Current SELECT policy allows ALL users to read ALL shops ✅
- But backend code filters by `owner_user_id`, blocking 95% of shops ❌
- **Code-level filtering overrides RLS policy benefits**

---

## 🔍 4. QUERIES THAT WOULD FAIL UNDER PRODUCTION RLS

### Scenario 1: Frontend Direct Query (Using ANON Key)

**Query:**
```typescript
const { data } = await supabase
  .from("shops")
  .select("*")
  .eq("owner_user_id", currentUserId);  // ❌ Would fail if RLS blocks
```

**RLS Impact:**
- ✅ **Would PASS** - SELECT policy allows `USING (true)` (all shops)
- ❌ **But returns WRONG data** - Only shops where `owner_user_id = currentUserId`
- **95% of shops are hidden** because `owner_user_id` is NULL for most shops

### Scenario 2: Backend Query (Using Service Role Key)

**Query:**
```typescript
const { data } = await supabase  // Service role bypasses RLS
  .from("shops")
  .select("*")
  .eq("owner_user_id", userId);  // ❌ Code-level filter blocks shops
```

**RLS Impact:**
- ✅ **Bypasses RLS** (Service Role Key)
- ❌ **But code-level filter still blocks 95% of shops**
- **Problem is in code, not RLS**

### Scenario 3: User Sync Query

**Query:**
```typescript
const { data } = await supabase  // Service role
  .from("users")
  .select("id, email, name")
  .eq("id", user_id);
```

**RLS Impact:**
- ✅ **Would PASS** - Service role bypasses RLS
- ✅ **Correct behavior** - User sync should work

### Scenario 4: Browse Page (No Auth)

**Query:**
```typescript
const res = await fetch(`${apiUrl}/shops`);  // No x-user-id header
```

**Backend Behavior:**
- ✅ **Returns ALL shops** (no filtering)
- ✅ **Correct for public directory**

**RLS Impact:**
- ✅ **Would PASS** - SELECT policy allows all
- ✅ **Correct behavior**

---

## 🔍 5. MAPPING TABLE VERIFICATION NEEDED

### User Mentions: `shop_owner_un...`

**Possible Table Names:**
- `shop_owner_unrestricted` ❓
- `shop_owner_unread_counts` ❌ (This is a VIEW for messages, not mapping)
- `shop_owner_mappings` ❓
- `shop_owners` ❓

**Current Code:**
- ❌ **NO references to mapping table found**
- ❌ **All code uses `shops.owner_user_id` directly**

**Required Verification:**
```sql
-- Run in Supabase SQL Editor:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'shop_owner%';

-- Check for mapping table structure:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name LIKE 'shop_owner%'
ORDER BY ordinal_position;
```

**If Mapping Table Exists:**
- Structure likely: `shop_id UUID, user_id UUID, created_at TIMESTAMPTZ`
- Need to update ALL queries to join with this table
- Remove direct `owner_user_id` filtering

**If NO Mapping Table:**
- Keep `shops.owner_user_id` for direct ownership
- But remove filtering to show ALL shops (public directory)
- Owners see their shops via `owner_user_id` check, but public sees all

---

## 🔍 6. FILES THAT TOUCH USERS OR SHOPS QUERIES

### Backend Files

1. **`yoyakuyo-api/src/routes/auth.ts`**
   - ✅ Queries `users` table (correct)
   - ✅ Creates users in `public.users`
   - ✅ Creates shops with `owner_user_id`

2. **`yoyakuyo-api/src/routes/shops.ts`** ⚠️ **NEEDS FIX**
   - ❌ Filters by `owner_user_id` (blocks 95% of shops)
   - ❌ No join with mapping table (if exists)
   - ❌ Single shop endpoint also filters

3. **`yoyakuyo-api/src/routes/bookings.ts`**
   - ⚠️ References `owner_user_id` but doesn't filter
   - May need update if mapping table exists

### Frontend Files

1. **`yoyakuyo-dashboard/lib/api.ts`**
   - ✅ Calls `/shops` endpoint
   - ⚠️ Sends `x-user-id` header (triggers filtering)

2. **`yoyakuyo-dashboard/app/dashboard/page.tsx`**
   - ❌ Sends `x-user-id` header via `apiClient`
   - ❌ Expects filtered shops (only owner's shops)

3. **`yoyakuyo-dashboard/app/shops/page.tsx`**
   - ❌ Adds `owner_user_id` query param (not used by backend)
   - ❌ Sends `x-user-id` header

4. **`yoyakuyo-dashboard/app/browse/page.tsx`**
   - ✅ No auth header (correct for public directory)
   - ✅ Fetches all shops

5. **`yoyakuyo-dashboard/app/page.tsx`**
   - ✅ Calls `authApi.syncUser()` (correct)

6. **`yoyakuyo-dashboard/app/login/page.tsx`**
   - ✅ Calls `authApi.syncUser()` (correct)

---

## 🎯 SUMMARY OF ISSUES

### Critical Issues

1. **❌ Shops Filtering Blocks 95% of Data**
   - Backend filters by `owner_user_id = current_user`
   - Most shops have `owner_user_id = NULL`
   - Result: Only 2 shops visible (manually created ones)

2. **❌ No Mapping Table Support**
   - Code assumes direct `owner_user_id` relationship
   - If mapping table exists, code won't work
   - Need to verify mapping table structure

3. **❌ Single Shop Endpoint Also Filters**
   - Prevents viewing shops you don't own
   - Should allow public viewing of any shop

### Medium Issues

4. **⚠️ RLS Policies Need Verification**
   - Policies exist in migrations
   - Need to verify they're active in database
   - SELECT policy should allow all users to read shops

5. **⚠️ Frontend Sends Auth Headers**
   - `x-user-id` header triggers filtering
   - Browse page correctly omits header
   - Dashboard/shops pages incorrectly send header

### Minor Issues

6. **⚠️ Query Params Not Used**
   - Frontend sends `?owner_user_id=...` but backend doesn't use it
   - Backend only uses `x-user-id` header

---

## 📝 REQUIRED FIXES (Proposed)

### Fix 1: Remove Owner Filtering from `/shops` Endpoint
```typescript
// BEFORE:
if (userId) {
  query = query.eq("owner_user_id", userId);  // ❌ Blocks shops
}

// AFTER:
// Remove filtering - return ALL shops (public directory)
// No filtering based on userId
```

### Fix 2: Add Mapping Table Support (If Exists)
```typescript
// If mapping table exists (e.g., shop_owner_unrestricted):
if (userId && mappingTableExists) {
  // Get owner's linked shops via mapping table
  const { data: linkedShops } = await supabase
    .from("shop_owner_unrestricted")  // Or actual table name
    .select("shop_id")
    .eq("user_id", userId);
  
  const shopIds = linkedShops?.map(s => s.shop_id) || [];
  // Mark these shops as "owned" in response
}
```

### Fix 3: Remove Filtering from Single Shop Endpoint
```typescript
// BEFORE:
if (userId) {
  query = query.eq("owner_user_id", userId);  // ❌ Blocks viewing
}

// AFTER:
// Remove filtering - allow viewing any shop
// Check ownership separately for edit permissions
```

### Fix 4: Update RLS Policies (If Needed)
```sql
-- Ensure SELECT policy allows all users to read shops
CREATE POLICY "Allow public read access to shops"
ON shops
FOR SELECT
USING (true);  -- ✅ Already exists in migrations

-- For restricted fields (revenues, notes), create separate policy:
CREATE POLICY "Owners can view restricted shop fields"
ON shops
FOR SELECT
USING (
  auth.uid() = owner_user_id 
  OR auth.uid() IN (
    SELECT user_id FROM shop_owner_un... WHERE shop_id = shops.id
  )
);
```

---

## ⚠️ ACTION REQUIRED BEFORE FIXES

1. **Verify Mapping Table Exists:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name LIKE 'shop_owner%';
   ```

2. **Get Mapping Table Structure:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND table_name = '<actual_mapping_table_name>';
   ```

3. **Verify Current RLS Policies:**
   ```sql
   SELECT policyname, cmd, qual, with_check
   FROM pg_policies
   WHERE schemaname = 'public' 
     AND tablename IN ('shops', 'users');
   ```

4. **Count Shops by Ownership:**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE owner_user_id IS NULL) as unowned_shops,
     COUNT(*) FILTER (WHERE owner_user_id IS NOT NULL) as owned_shops,
     COUNT(*) as total_shops
   FROM shops;
   ```

---

## 📋 NEXT STEPS

1. ✅ **Diagnostic Complete** - This report
2. ⏳ **Wait for User Confirmation:**
   - Mapping table name and structure
   - Current RLS policy status
   - Shop ownership distribution
3. ⏳ **Propose Code Changes** - After verification
4. ⏳ **Show PR Changes** - Before modifying database
5. ⏳ **Implement Fixes** - After approval

---

**Status:** ✅ Diagnostic complete, awaiting user verification of mapping table structure

---

## 🔍 7. API RESPONSE FORMAT MISMATCH

### Backend Response Format
```typescript
// yoyakuyo-api/src/routes/shops.ts (line 57-65)
res.json({
  data: data || [],           // ✅ Shops array
  pagination: {                // ✅ Pagination info
    page,
    limit,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  },
});
```

### Frontend Expectations

#### `app/browse/page.tsx` (Line 98)
```typescript
const shopsArray = Array.isArray(data) ? data : (data.shops || []);
// ❌ Expects: data (array) OR data.shops (array)
// ✅ Actually gets: data.data (array)
```

**Status:** ⚠️ **MISMATCH** - Frontend should use `data.data` or `data.shops` but checks for `data.shops` which doesn't exist

#### `app/dashboard/page.tsx` (Line 76-84)
```typescript
if (Array.isArray(response)) {
  setShops(response);
} else if (response?.data) {
  const shopsData = Array.isArray(response.data) ? response.data : [];
  setShops(shopsData);
}
```

**Status:** ✅ **CORRECT** - Handles `{ data: [...] }` format

---

## 🔍 8. VERIFICATION QUERIES TO RUN IN SUPABASE

### Query 1: Find Mapping Table
```sql
-- Find all tables starting with "shop_owner"
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'shop_owner%'
ORDER BY table_name;
```

### Query 2: Get Mapping Table Structure (if exists)
```sql
-- Replace '<mapping_table_name>' with actual table name from Query 1
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = '<mapping_table_name>'
ORDER BY ordinal_position;
```

### Query 3: Verify Current RLS Policies
```sql
-- Check shops table policies
SELECT 
    policyname,
    cmd AS operation,
    roles,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'shops'
ORDER BY cmd, policyname;

-- Check users table policies
SELECT 
    policyname,
    cmd AS operation,
    roles,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY cmd, policyname;
```

### Query 4: Count Shops by Ownership
```sql
-- Verify shop distribution
SELECT 
    COUNT(*) FILTER (WHERE owner_user_id IS NULL) as unowned_shops,
    COUNT(*) FILTER (WHERE owner_user_id IS NOT NULL) as owned_shops,
    COUNT(*) as total_shops,
    COUNT(DISTINCT owner_user_id) as unique_owners
FROM shops;
```

### Query 5: Check Mapping Table Data (if exists)
```sql
-- Replace '<mapping_table_name>' with actual table name
SELECT 
    COUNT(*) as total_mappings,
    COUNT(DISTINCT shop_id) as shops_with_owners,
    COUNT(DISTINCT user_id) as users_with_shops
FROM <mapping_table_name>;
```

---

## 📊 SUMMARY TABLE: ALL CODE LOCATIONS

| File | Line(s) | Query Type | Status | Issue |
|------|---------|------------|--------|-------|
| `yoyakuyo-api/src/routes/auth.ts` | 24-28, 48-57, etc. | `users` SELECT/INSERT | ✅ Correct | None |
| `yoyakuyo-api/src/routes/shops.ts` | 35-48 | `shops` SELECT (filtered) | ❌ **BLOCKS SHOPS** | Filters by `owner_user_id` |
| `yoyakuyo-api/src/routes/shops.ts` | 78-88 | `shops` SELECT (single) | ❌ **BLOCKS SHOPS** | Filters by `owner_user_id` |
| `yoyakuyo-api/src/routes/bookings.ts` | 22 | `shops` SELECT (fields) | ⚠️ Reference only | No filtering |
| `yoyakuyo-dashboard/lib/api.ts` | 20-25 | API call | ⚠️ Sends header | Triggers filtering |
| `yoyakuyo-dashboard/app/dashboard/page.tsx` | 73-94 | API call | ❌ **BLOCKS SHOPS** | Sends `x-user-id` |
| `yoyakuyo-dashboard/app/shops/page.tsx` | 362 | API call | ❌ **BLOCKS SHOPS** | Sends `x-user-id` + query param |
| `yoyakuyo-dashboard/app/browse/page.tsx` | 93-102 | API call | ✅ Correct | No auth header |
| `yoyakuyo-dashboard/app/browse/page.tsx` | 98 | Response parsing | ⚠️ **MISMATCH** | Expects `data.shops` but gets `data.data` |

---

**END OF DIAGNOSTIC REPORT**

**Next:** Wait for user to provide:
1. Actual mapping table name (if exists)
2. Mapping table structure
3. Current RLS policy status
4. Shop ownership distribution

Then propose code fixes.

