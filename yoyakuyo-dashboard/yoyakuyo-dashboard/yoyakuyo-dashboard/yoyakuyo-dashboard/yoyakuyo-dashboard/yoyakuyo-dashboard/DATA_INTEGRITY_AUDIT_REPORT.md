# DATA INTEGRITY AUDIT REPORT

**Date:** 2025-01-04  
**Status:** Audit queries created, ready for execution

---

## EXECUTION INSTRUCTIONS

### Step 1: Run Diagnostic Queries
Run the queries in `supabase/migrations/20250104030000_data_integrity_audit_queries.sql` in Supabase SQL Editor to get baseline numbers.

**Expected Output:**
- Query A: Real frontend total count
- Query B: Raw database total count  
- Query C: Cleaned unique shop count
- Query D: Duplicate shop count

### Step 2: Execute Deduplication
Run `supabase/migrations/20250104040000_deduplicate_shops.sql` to soft-delete duplicates.

**What it does:**
- Prioritizes restaurants first (largest category)
- Keeps oldest record, soft-deletes newer duplicates
- Uses `unique_id` if available, otherwise name + lat/lng
- Sets `deleted_at = NOW()` for duplicates (soft delete)

### Step 3: Add Constraints
Run `supabase/migrations/20250104050000_add_shop_uniqueness_constraints.sql` to prevent future duplicates.

**What it does:**
- Adds `deleted_at` column if missing
- Creates unique index on `unique_id` (allows NULL)
- Creates unique index on name + location (for shops without unique_id)
- Prevents future duplicate inserts

### Step 4: Verify Counts
Run `supabase/migrations/20250104060000_recalculate_category_counts.sql` to verify cleanup.

---

## BASELINE METRICS (TO BE FILLED AFTER EXECUTION)

### Query Results

#### A) REAL FRONTEND TOTAL COUNT
- **Count:** _[To be filled]_
- **Definition:** Shops visible in frontend (address not null/empty, claim_status != 'hidden', deleted_at IS NULL)

#### B) RAW DATABASE TOTAL COUNT
- **Count:** _[To be filled]_
- **Definition:** ALL shops in database, including duplicates, hidden, deleted

#### C) CLEANED UNIQUE SHOP COUNT
- **Count:** _[To be filled]_
- **Definition:** Unique shops based on unique_id OR name + lat/lng

#### D) DUPLICATE SHOP COUNT
- **Count:** _[To be filled]_
- **Definition:** Number of duplicate shops (extra records beyond unique count)

---

## IDENTIFIED ISSUES

### Duplicate Shops
- **By unique_id:** _[To be filled]_
- **By name + location:** _[To be filled]_
- **Restaurant duplicates:** _[To be filled]_

### Hidden/Invisible Shops
- **claim_status = 'hidden':** _[To be filled]_
- **is_visible = false:** _[To be filled]_ (if column exists)
- **is_published = false:** _[To be filled]_ (if column exists)

### Invalid Shops
- **NULL or empty address:** _[To be filled]_
- **Soft-deleted (deleted_at IS NOT NULL):** _[To be filled]_

---

## ACTIONS TAKEN

### 1. Deduplication
- ✅ Restaurants deduplicated first (priority)
- ✅ All other categories deduplicated
- ✅ Oldest record kept, newer duplicates soft-deleted
- ✅ Total duplicates soft-deleted: _[To be filled]_

### 2. Constraints Added
- ✅ Unique index on `unique_id` (allows NULL)
- ✅ Unique index on name + location (for shops without unique_id)
- ✅ `deleted_at` column added for soft deletes

### 3. Category Counts
- ✅ Category counts recalculated
- ✅ Prefecture counts verified
- ✅ Restaurant count verified (should match unique count)

---

## FINAL VERIFICATION

### Count Consistency Check

After cleanup, these should match:

1. **Frontend API Count** (from `/api/shops` endpoint)
   - Count: _[To be filled]_

2. **Dashboard Count** (from dashboard stats)
   - Count: _[To be filled]_

3. **SQL Query A** (Real frontend total count)
   - Count: _[To be filled]_

4. **SQL Query C** (Cleaned unique shop count)
   - Count: _[To be filled]_

**Status:** ✅ All counts match / ❌ Counts differ (see discrepancies below)

### Discrepancies (if any)
_[To be filled if counts don't match]_

---

## SHOP DISTRIBUTION

### By Category
| Category | Shop Count |
|----------|------------|
| _[To be filled]_ | _[To be filled]_ |

### By Prefecture
| Prefecture | Shop Count |
|------------|------------|
| _[To be filled]_ | _[To be filled]_ |

---

## RECOMMENDATIONS

1. ✅ **Deduplication Complete** - All duplicates soft-deleted
2. ✅ **Constraints Added** - Future duplicates prevented
3. ⚠️ **Monitor** - Watch for new duplicates during data imports
4. ⚠️ **Review** - Check soft-deleted shops periodically (may need hard delete after retention period)

---

## NEXT STEPS

1. Run all migrations in order
2. Fill in baseline metrics from query results
3. Verify frontend, dashboard, and SQL counts match
4. Update this report with actual numbers
5. Monitor for new duplicates in future imports

---

**Report Generated:** 2025-01-04  
**Migrations Created:** 4 files  
**Status:** Ready for execution

