# DATA INTEGRITY AUDIT - COMPLETE PACKAGE

**Date:** 2025-01-04  
**Status:** ✅ All migrations and queries created, ready for execution

---

## 📋 WHAT WAS CREATED

### 1. Diagnostic Queries (`20250104030000_data_integrity_audit_queries.sql`)
Contains 4 truth queries plus additional diagnostics:
- **Query A:** Real frontend total count (visible shops)
- **Query B:** Raw database total count (all shops)
- **Query C:** Cleaned unique shop count (deduplicated)
- **Query D:** Duplicate shop count

Plus additional queries for:
- Shops with `is_visible = false`
- Shops with `is_published = false`
- Shops with `claim_status = 'hidden'`
- Soft-deleted shops
- Shops with NULL/empty address
- Duplicate `unique_id` values
- Duplicate name + location groups
- Shops per category
- Shops per prefecture
- Restaurant duplicates (priority check)

### 2. Deduplication Migration (`20250104040000_deduplicate_shops.sql`)
Soft-deletes duplicate shops:
- ✅ Prioritizes restaurants first (largest category)
- ✅ Keeps oldest record, soft-deletes newer duplicates
- ✅ Uses `unique_id` if available, otherwise name + lat/lng
- ✅ Sets `deleted_at = NOW()` (soft delete, not hard delete)
- ✅ Reports how many duplicates were removed

### 3. Uniqueness Constraints (`20250104050000_add_shop_uniqueness_constraints.sql`)
Prevents future duplicates:
- ✅ Adds `deleted_at` column if missing
- ✅ Creates unique index on `unique_id` (allows NULL)
- ✅ Creates unique index on name + location (for shops without unique_id)
- ✅ Validates no duplicates exist before creating constraints

### 4. Category Count Verification (`20250104060000_recalculate_category_counts.sql`)
Verifies cleanup was successful:
- ✅ Category shop counts (excluding soft-deleted and hidden)
- ✅ Total count comparison (active vs visible vs soft-deleted)
- ✅ Restaurant count verification (should match unique count)
- ✅ Prefecture counts

### 5. Report Template (`DATA_INTEGRITY_AUDIT_REPORT.md`)
Template for documenting results after execution.

---

## 🚀 EXECUTION ORDER

### Step 1: Run Diagnostic Queries (Baseline)
**File:** `supabase/migrations/20250104030000_data_integrity_audit_queries.sql`

**How to run:**
1. Open Supabase SQL Editor
2. Copy and paste the entire file
3. Execute
4. **Record the results** in `DATA_INTEGRITY_AUDIT_REPORT.md`

**What you'll get:**
- Baseline counts (A, B, C, D)
- List of duplicate groups
- Hidden/invisible shop counts
- Category and prefecture distributions

### Step 2: Execute Deduplication
**File:** `supabase/migrations/20250104040000_deduplicate_shops.sql`

**How to run:**
```bash
npx supabase db push
```

Or run directly in Supabase SQL Editor.

**What it does:**
- Identifies all duplicate shops
- Soft-deletes duplicates (keeps oldest)
- Reports how many were removed
- **DOES NOT** hard delete (uses `deleted_at`)

**Expected output:**
```
=== STARTING: Deduplicating shops ===
Step 1: Deduplicating restaurants...
Restaurant group "restaurant|35.6762|139.6503": Kept abc-123 (oldest), soft-deleted 2 duplicates
...
Restaurant deduplication complete: 150 duplicates soft-deleted
Step 2: Deduplicating all other shops...
...
Other shops deduplication complete: 50 duplicates soft-deleted
=== COMPLETE: Total duplicates soft-deleted: 200 (Restaurants: 150, Others: 50) ===
```

### Step 3: Add Constraints
**File:** `supabase/migrations/20250104050000_add_shop_uniqueness_constraints.sql`

**How to run:**
```bash
npx supabase db push
```

**What it does:**
- Adds `deleted_at` column if missing
- Creates unique constraints to prevent future duplicates
- Validates no duplicates exist before creating constraints

**Note:** If constraints fail to create, it means duplicates still exist. Re-run Step 2.

### Step 4: Verify Cleanup
**File:** `supabase/migrations/20250104060000_recalculate_category_counts.sql`

**How to run:**
Run in Supabase SQL Editor to see final counts.

**What you'll get:**
- Updated category counts
- Total count comparison
- Restaurant verification (should show no duplicates)
- Prefecture counts

### Step 5: Fill Report
**File:** `DATA_INTEGRITY_AUDIT_REPORT.md`

Fill in all `_[To be filled]_` sections with actual numbers from your queries.

---

## 🔍 HOW DUPLICATES ARE IDENTIFIED

### Method 1: By `unique_id` (if set)
Shops with the same `unique_id` are considered duplicates.

### Method 2: By Name + Location (if `unique_id` is NULL)
Shops with:
- Same `name`
- Same `latitude` (rounded to 4 decimal places = ~11 meters)
- Same `longitude` (rounded to 4 decimal places = ~11 meters)

Are considered duplicates.

### Which Record is Kept?
**Always the OLDEST record** (by `created_at`, then `id`).

---

## ⚠️ IMPORTANT NOTES

### Soft Delete vs Hard Delete
- ✅ **Soft delete:** Sets `deleted_at = NOW()` (reversible)
- ❌ **Hard delete:** Actually removes from database (irreversible)

**This migration uses SOFT DELETE only.**

### Reversibility
If you need to restore soft-deleted shops:
```sql
UPDATE shops 
SET deleted_at = NULL 
WHERE deleted_at IS NOT NULL;
```

### Frontend Filtering
The frontend API already filters out:
- `deleted_at IS NOT NULL` (soft-deleted)
- `claim_status = 'hidden'` (hidden shops)
- `address IS NULL OR address = ''` (invalid addresses)

So soft-deleted duplicates won't appear in the frontend.

---

## 📊 EXPECTED RESULTS

### Before Cleanup
- Query A (Frontend): ~30,000-55,000 shops
- Query B (Raw DB): ~30,000-55,000 shops
- Query C (Unique): ~25,000-50,000 shops
- Query D (Duplicates): ~5,000-10,000 duplicates

### After Cleanup
- Query A (Frontend): Should match Query C
- Query B (Raw DB): Same as before (soft-deleted still counted)
- Query C (Unique): Same as before
- Query D (Duplicates): Should be 0 or very close to 0

### Count Consistency
After cleanup, these should all match:
1. Frontend API count (`/api/shops`)
2. Dashboard count
3. Query A (Real frontend total)
4. Query C (Cleaned unique count)

---

## 🛠️ TROUBLESHOOTING

### Constraint Creation Fails
**Error:** "Cannot create unique index: Duplicate values exist"

**Solution:** Re-run deduplication migration (Step 2). Some duplicates may have been missed.

### Counts Don't Match
**Problem:** Frontend count ≠ SQL count

**Check:**
1. Are you filtering by the same criteria?
2. Is `claim_status` being checked?
3. Is `address` being validated?
4. Are soft-deleted shops excluded?

### Too Many Duplicates Found
**Problem:** Query D shows thousands of duplicates

**Solution:** This is normal if data was imported multiple times. The deduplication will handle it.

---

## 📝 NEXT STEPS AFTER EXECUTION

1. ✅ Run all migrations in order
2. ✅ Fill in `DATA_INTEGRITY_AUDIT_REPORT.md` with actual numbers
3. ✅ Verify frontend, dashboard, and SQL counts match
4. ✅ Monitor for new duplicates in future imports
5. ✅ Consider hard-deleting old soft-deleted shops after retention period

---

## 🔒 SAFETY FEATURES

- ✅ **Soft delete only** - No data is permanently lost
- ✅ **Keeps oldest record** - Preserves original data
- ✅ **Validates before constraints** - Won't fail if duplicates exist
- ✅ **Comprehensive logging** - Reports every action
- ✅ **Reversible** - Can restore soft-deleted shops

---

**Created:** 2025-01-04  
**Migrations:** 4 files  
**Status:** Ready for execution  
**DO NOT TOUCH UI UNTIL DATABASE NUMBERS ARE CLEAN**

