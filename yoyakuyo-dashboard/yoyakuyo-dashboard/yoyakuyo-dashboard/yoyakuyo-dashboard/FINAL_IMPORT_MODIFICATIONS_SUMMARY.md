# ✅ Final Import Modifications Summary

**Date:** 2025-01-24  
**Objective:** Safe re-import of 40k+ shops with local backup and duplicate protection

---

## 📋 ALL FILES CHANGED

### ⭐ NEW FILES CREATED

1. **`supabase/migrations/20250124000000_add_osm_id_unique_constraint.sql`**
   - **Purpose:** Add unique constraint on `osm_id` to prevent duplicates
   - **Location:** `supabase/migrations/`
   - **Status:** Ready to run in Supabase SQL Editor

2. **`apps/api/src/scripts/importFromBackup.ts`**
   - **Purpose:** Import shops from local backup JSON file
   - **Location:** `apps/api/src/scripts/`
   - **Status:** Ready to use

3. **`IMPORT_SCRIPT_ANALYSIS.md`**
   - **Purpose:** Analysis of current import script behavior
   - **Location:** Root directory
   - **Status:** Documentation only

4. **`SHOP_IMPORT_COMPLETE_GUIDE.md`**
   - **Purpose:** Complete step-by-step guide
   - **Location:** Root directory
   - **Status:** Documentation only

5. **`FINAL_IMPORT_MODIFICATIONS_SUMMARY.md`** (this file)
   - **Purpose:** Summary of all changes
   - **Location:** Root directory
   - **Status:** Documentation only

### ✏️ MODIFIED FILES

1. **`apps/api/src/scripts/importJapanShopsOSM.ts`**
   - **Changes:**
     - Updated backup file path: `data/shops_backup.json` (was `src/data/japan_shops_osm.json`)
     - Added dynamic category creation function
     - Improved duplicate check to prioritize `osm_id`
     - Enhanced error handling

---

## 📄 SQL MIGRATION FILE

### File: `supabase/migrations/20250124000000_add_osm_id_unique_constraint.sql`

**Full Contents:**

```sql
-- Migration: Add unique constraint on osm_id for shops
-- This ensures no duplicate shops can be inserted with the same OSM ID
-- Run this migration to prevent duplicate shops from OpenStreetMap

-- Step 1: Remove any existing duplicate osm_id values (keep the first one)
-- This is safe - we're only removing duplicates, not all data
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Count duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT osm_id, COUNT(*) as cnt
        FROM shops
        WHERE osm_id IS NOT NULL
        GROUP BY osm_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate osm_id values. Keeping first occurrence of each.', duplicate_count;
        
        -- Delete duplicates, keeping the one with the earliest created_at
        DELETE FROM shops
        WHERE id IN (
            SELECT id
            FROM (
                SELECT id,
                       ROW_NUMBER() OVER (PARTITION BY osm_id ORDER BY created_at ASC) as rn
                FROM shops
                WHERE osm_id IS NOT NULL
            ) ranked
            WHERE rn > 1
        );
        
        RAISE NOTICE 'Removed % duplicate shops.', duplicate_count;
    ELSE
        RAISE NOTICE 'No duplicate osm_id values found.';
    END IF;
END $$;

-- Step 2: Create unique index on osm_id (allows NULL values)
-- Using UNIQUE INDEX instead of UNIQUE CONSTRAINT to allow NULL values
CREATE UNIQUE INDEX IF NOT EXISTS shops_osm_id_unique_idx 
ON shops(osm_id) 
WHERE osm_id IS NOT NULL;

-- Step 3: Add comment
COMMENT ON INDEX shops_osm_id_unique_idx IS 'Ensures each OSM ID appears only once in shops table (NULL values allowed)';

-- Step 4: Verify the index was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'shops_osm_id_unique_idx'
    ) THEN
        RAISE NOTICE '✅ Unique index on osm_id created successfully';
    ELSE
        RAISE WARNING '⚠️  Failed to create unique index on osm_id';
    END IF;
END $$;
```

**What it does:**
1. Removes existing duplicate `osm_id` values (keeps first occurrence)
2. Creates unique index on `osm_id` (allows NULL)
3. Verifies index was created

**Safety:**
- ✅ Idempotent (safe to run multiple times)
- ✅ Only removes duplicates, not all data
- ✅ Keeps earliest shop if duplicates exist

---

## 🔧 CODE CHANGES DETAIL

### Modified: `apps/api/src/scripts/importJapanShopsOSM.ts`

#### Change 1: Backup File Path (Line 17-18)
```typescript
// OLD:
// const DATA_DIR = path.resolve(__dirname, "../../src/data");
// const DATASET_FILE = path.resolve(DATA_DIR, "japan_shops_osm.json");

// NEW:
const DATA_DIR = path.resolve(__dirname, "../../data");
const DATASET_FILE = path.resolve(DATA_DIR, "shops_backup.json");
```

#### Change 2: Dynamic Category Creation (Lines 1145-1183)
```typescript
// NEW FUNCTION ADDED:
const getOrCreateCategoryId = async (categoryName: string): Promise<string | null> => {
  // Check if category already exists
  if (categoryIds[categoryName]) {
    return categoryIds[categoryName];
  }
  
  // Create missing category
  const { data: newCategory, error } = await supabase
    .from("categories")
    .insert([{ name: categoryName, description: `Auto-created during shop import` }])
    .select("id")
    .single();
  
  // ... error handling and fallback logic
};
```

#### Change 3: Improved Duplicate Check (Lines 363-373)
```typescript
// ENHANCED:
async function isDuplicate(shop: any): Promise<{ isDuplicate: boolean; existingId?: string; reason?: string }> {
  // PRIMARY CHECK: OSM ID (most reliable unique identifier)
  if (shop.osm_id) {
    const { data } = await supabase
      .from("shops")
      .select("id")
      .eq("osm_id", shop.osm_id.toString())
      .maybeSingle();
    if (data) {
      return { isDuplicate: true, existingId: data.id, reason: "osm_id match" };
    }
  }
  // ... rest of duplicate checks
}
```

#### Change 4: Category Resolution (Lines 1203-1208)
```typescript
// OLD:
// const categoryId = categoryIds[shop.category] || categoryIds["Unknown"];

// NEW:
const categoryId = await getOrCreateCategoryId(shop.category);
if (!categoryId) {
  console.warn(`⚠️  Skipping shop "${shop.name}" - could not resolve category "${shop.category}"`);
  continue;
}
```

---

## 🚀 HOW TO RUN - STEP BY STEP

### Step 1: Run SQL Migration (REQUIRED FIRST)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire contents of: `supabase/migrations/20250124000000_add_osm_id_unique_constraint.sql`
4. Paste into SQL Editor
5. Click **Run**
6. Verify output shows: "✅ Unique index on osm_id created successfully"

**This prevents duplicate shops from being inserted.**

---

### Step 2: Verify Environment

Check `apps/api/.env` has:
```
SUPABASE_URL=https://neguwrjykwnfhdlwktpd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

### Step 3: Run Import Script

**Navigate to API directory:**
```bash
cd apps/api
```

**Run import:**
```bash
npx ts-node src/scripts/importJapanShopsOSM.ts
```

**What happens:**
- **First run:** Fetches from OSM, saves backup, inserts shops (takes hours)
- **Subsequent runs:** Loads from backup, inserts missing shops only (takes minutes)

---

### Step 4: Alternative - Import from Backup Only

If you already have `data/shops_backup.json`:

```bash
cd apps/api
npx ts-node src/scripts/importFromBackup.ts
```

**What happens:**
- Reads from backup file
- Checks duplicates by `osm_id`
- Inserts missing shops only
- Creates missing categories automatically

---

## ✅ SAFETY GUARANTEES

### Data Protection

1. **✅ Never Deletes** - Script only uses `INSERT`, never `DELETE` or `TRUNCATE`
2. **✅ Duplicate-Safe** - Checks `osm_id` before inserting, skips if exists
3. **✅ Unique Constraint** - Database enforces `osm_id` uniqueness
4. **✅ Existing Shops Protected** - Your 2 manual shops will remain untouched

### Import Safety

1. **✅ Resumable** - Can stop and resume (checkpoint system)
2. **✅ Local Backup** - Saves to `data/shops_backup.json` automatically
3. **✅ Batch Processing** - Inserts in batches of 100 (safe for large datasets)
4. **✅ Error Handling** - Continues even if some batches fail

### Category Safety

1. **✅ Dynamic Creation** - Creates missing categories automatically
2. **✅ Name-based** - No hard-coded category IDs
3. **✅ Fallback** - Uses "Unknown" if category can't be created

---

## 📊 EXPECTED RESULTS

### After First Import:
- ✅ `apps/api/data/shops_backup.json` created (40k+ shops)
- ✅ All shops inserted into Supabase
- ✅ Categories created automatically
- ✅ No duplicate shops (enforced by unique constraint)

### After Subsequent Imports:
- ✅ Only missing shops inserted
- ✅ Duplicates skipped automatically
- ✅ Fast execution (uses backup file)

---

## 🔍 VERIFICATION QUERIES

After import, run these in Supabase SQL Editor:

```sql
-- 1. Total shops count
SELECT COUNT(*) as total_shops FROM shops;

-- 2. Shops by category
SELECT c.name, COUNT(s.id) as count
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
GROUP BY c.name
ORDER BY count DESC;

-- 3. Verify no duplicate osm_id (should return 0 rows)
SELECT osm_id, COUNT(*) as count
FROM shops
WHERE osm_id IS NOT NULL
GROUP BY osm_id
HAVING COUNT(*) > 1;

-- 4. Unclaimed shops (your imported ones)
SELECT COUNT(*) as unclaimed_shops 
FROM shops 
WHERE owner_user_id IS NULL 
  AND claim_status = 'unclaimed';

-- 5. Check backup file exists (from file system)
-- File should be at: apps/api/data/shops_backup.json
```

---

## 📁 FILE LOCATIONS

### SQL Migration:
- **Path:** `supabase/migrations/20250124000000_add_osm_id_unique_constraint.sql`
- **Action:** Run in Supabase SQL Editor

### Import Scripts:
- **Main:** `apps/api/src/scripts/importJapanShopsOSM.ts`
- **Backup:** `apps/api/src/scripts/importFromBackup.ts`

### Backup File (Created After First Run):
- **Path:** `apps/api/data/shops_backup.json`
- **Format:** JSON with shops array
- **Size:** ~10-50MB (depending on shop count)

---

## ⚠️ IMPORTANT REMINDERS

1. **Run SQL migration FIRST** - Required before importing
2. **First run takes hours** - Be patient, respects API rate limits
3. **Backup is automatic** - Created after first successful fetch
4. **Safe to interrupt** - Can resume later
5. **Never deletes data** - Only inserts new shops
6. **Your 2 shops are safe** - They have `owner_user_id` set, won't be affected

---

## 🎯 QUICK REFERENCE

```bash
# 1. Run SQL migration in Supabase SQL Editor
# File: supabase/migrations/20250124000000_add_osm_id_unique_constraint.sql

# 2. Run import
cd apps/api
npx ts-node src/scripts/importJapanShopsOSM.ts

# 3. Or import from backup only
npx ts-node src/scripts/importFromBackup.ts
```

---

**All modifications complete. Ready to import 40k+ shops safely!** ✅

