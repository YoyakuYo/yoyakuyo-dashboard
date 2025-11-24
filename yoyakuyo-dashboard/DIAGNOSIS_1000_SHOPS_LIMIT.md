# 🔍 DIAGNOSIS: Why Only 1000 Shops Are Shown (Out of 2800+)

## Problem Summary
The dashboard shows only **1000 shops** even though the database contains **2800+ shops**.

## Root Cause

### **Supabase Default Row Limit: 1000**

Supabase (PostgREST) has a **hard-coded default limit of 1000 rows** per query. This is a built-in safety feature to:
- Prevent excessive payload sizes
- Avoid accidental or malicious large requests
- Improve API performance

### Evidence

1. **No `.limit()` in code:**
   - Line 53-55 in `apps/api/src/routes/shops.ts`: 
     ```typescript
     let query = dbClient
         .from("shops")
         .select("*, categories(id, name, description)");
     ```
   - There's NO explicit `.limit()` call, so Supabase applies its default limit of 1000

2. **Console confirms exactly 1000:**
   - `Fetched shops: 1000 shops` - This is the default limit being hit

3. **Database has 2800+ shops:**
   - Your import script successfully imported 2800+ shops
   - But only 1000 are returned due to the default limit

## Where the Limit is Applied

**Location:** `apps/api/src/routes/shops.ts` - GET /shops route

**Current Query (Line 53-70):**
```typescript
let query = dbClient
    .from("shops")
    .select("*, categories(id, name, description)");
// ... filters applied ...
let { data, error } = await query;  // ← Returns max 1000 rows
```

**What happens:**
- Query executes successfully
- Supabase automatically limits results to 1000 rows
- No error is thrown (it's a silent limit)
- Only first 1000 shops (ordered by name) are returned

## Solutions Available

### Option 1: Increase Supabase `max_rows` Setting
- Modify Supabase project API settings
- Increase `max_rows` from 1000 to 3000+ (or higher)
- **Pros:** Simple, all shops in one request
- **Cons:** Large payload size, not scalable, security risk

### Option 2: Implement Pagination (RECOMMENDED)
- Use `.range(start, end)` to fetch shops in batches
- Example: `.range(0, 999)` for first 1000, `.range(1000, 1999)` for next 1000, etc.
- **Pros:** Scalable, efficient, follows best practices
- **Cons:** Requires frontend changes for pagination UI

### Option 3: Remove Limit Explicitly (NOT RECOMMENDED)
- Use `.limit()` with a very high number
- **Pros:** Simple
- **Cons:** Still subject to Supabase's max_rows setting, large payload

## Current Code Analysis

**File:** `apps/api/src/routes/shops.ts`
- **Line 53-55:** Query without limit → defaults to 1000
- **Line 70:** `.order("name", { ascending: true })` → orders results
- **Line 73:** `await query` → executes, returns max 1000 rows
- **Line 120:** Returns data (only first 1000 shops)

## Impact

- ✅ **Working:** First 1000 shops (alphabetically by name)
- ❌ **Missing:** Remaining 1800+ shops
- ❌ **No Error:** Limit is silent, no indication to user
- ❌ **No Pagination:** Frontend doesn't know there are more shops

## Next Steps (When Ready to Fix)

1. **Check Supabase max_rows setting** (if you want to increase it)
2. **Implement pagination** in the API route
3. **Add pagination UI** in the frontend
4. **Or combine both:** Pagination + higher limit

---

**Summary:** The 1000 shop limit is Supabase's default safety limit. No explicit limit is set in your code, so it defaults to 1000. To show all 2800+ shops, you need to either increase the Supabase max_rows setting or implement pagination.

