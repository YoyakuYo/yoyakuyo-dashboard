# 🚀 Complete Shop Import Guide - 40k+ Shops

**Objective:** Re-import all 40,000+ shops into Supabase safely, with local backup and resumable import.

---

## 📋 SUMMARY OF MODIFICATIONS

### ✅ Files Created/Modified

1. **`supabase/migrations/20250124000000_add_osm_id_unique_constraint.sql`** ⭐ NEW
   - Adds unique constraint on `osm_id` column
   - Removes existing duplicates before adding constraint
   - Ensures no duplicate shops with same OSM ID

2. **`apps/api/src/scripts/importJapanShopsOSM.ts`** ✏️ MODIFIED
   - Updated backup file path: `data/shops_backup.json`
   - Added dynamic category creation
   - Improved duplicate check (prioritizes `osm_id`)
   - Enhanced error messages

3. **`apps/api/src/scripts/importFromBackup.ts`** ⭐ NEW
   - New script to import from local backup
   - Reads `data/shops_backup.json`
   - Inserts missing shops only (duplicate-safe)

4. **`IMPORT_SCRIPT_ANALYSIS.md`** ⭐ NEW
   - Analysis of current import script
   - Documents what it does and doesn't do

---

## 🔍 CURRENT SCRIPT ANALYSIS

### ✅ What It Does (Safe)

- **Does NOT delete shops** - Only uses `INSERT`, never `DELETE` or `TRUNCATE`
- **Checks duplicates** - By `osm_id` first, then coordinates, then name
- **Dynamic category mapping** - Resolves categories by name, creates missing ones
- **Local backup** - Saves to `data/shops_backup.json` after fetching
- **Resumable** - Uses checkpoint file to resume interrupted imports

### ⚠️ What Was Fixed

1. **Unique Constraint** - Added migration to ensure `osm_id` uniqueness
2. **Category Creation** - Now creates missing categories automatically
3. **Backup Path** - Changed to `data/shops_backup.json` as requested
4. **Duplicate Check** - Improved to prioritize `osm_id` check

---

## 📁 SQL MIGRATION FILES

### File: `supabase/migrations/20250124000000_add_osm_id_unique_constraint.sql`

**Purpose:** Add unique constraint on `osm_id` to prevent duplicate shops

**What it does:**
1. Removes existing duplicate `osm_id` values (keeps first occurrence)
2. Creates unique index on `osm_id` (allows NULL values)
3. Verifies index was created

**Safety:**
- ✅ Uses `IF NOT EXISTS` - Safe to run multiple times
- ✅ Only removes duplicates, not all data
- ✅ Keeps the earliest shop if duplicates exist

**Run this in Supabase SQL Editor before importing shops.**

---

## 🔧 MODIFIED SCRIPTS

### 1. `apps/api/src/scripts/importJapanShopsOSM.ts`

**Changes Made:**

1. **Backup File Path** (Line 17-18):
   ```typescript
   // OLD: const DATA_DIR = path.resolve(__dirname, "../../src/data");
   // NEW:
   const DATA_DIR = path.resolve(__dirname, "../../data");
   const DATASET_FILE = path.resolve(DATA_DIR, "shops_backup.json");
   ```

2. **Dynamic Category Creation** (Lines 1145-1183):
   - Added `getOrCreateCategoryId()` function
   - Creates missing categories automatically
   - Handles race conditions gracefully

3. **Improved Duplicate Check** (Lines 363-373):
   - Prioritizes `osm_id` check
   - Returns reason for duplicate match
   - More reliable duplicate detection

4. **Category Resolution** (Lines 1195-1201):
   - Uses `getOrCreateCategoryId()` instead of static lookup
   - Creates categories on-the-fly if missing

**Behavior:**
- ✅ Checks for local backup first
- ✅ If backup exists: Loads from file, skips API calls
- ✅ If no backup: Fetches from OSM, saves to backup
- ✅ Creates missing categories automatically
- ✅ Skips duplicates by `osm_id`
- ✅ Never deletes existing shops

---

### 2. `apps/api/src/scripts/importFromBackup.ts` ⭐ NEW

**Purpose:** Import shops from local backup file

**Features:**
- Reads `data/shops_backup.json`
- Checks duplicates by `osm_id` before inserting
- Creates missing categories dynamically
- Batch inserts (100 shops per batch)
- Shows detailed progress and summary

**Usage:**
```bash
cd apps/api
npx ts-node src/scripts/importFromBackup.ts
```

---

## 📝 STEP-BY-STEP INSTRUCTIONS

### Step 1: Run SQL Migration (Required First)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of: `supabase/migrations/20250124000000_add_osm_id_unique_constraint.sql`
3. Paste and run in SQL Editor
4. Verify: Should see "✅ Unique index on osm_id created successfully"

**This ensures no duplicate shops can be inserted.**

---

### Step 2: Prepare Environment

1. Check `apps/api/.env` has:
   ```
   SUPABASE_URL=https://neguwrjykwnfhdlwktpd.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Navigate to API directory:
   ```bash
   cd apps/api
   ```

---

### Step 3: Run Import Script

**Option A: First Time (Fetch from OSM)**
```bash
npx ts-node src/scripts/importJapanShopsOSM.ts
```

**What happens:**
- 🌐 Prints: "FETCHING FROM OSM"
- Fetches shops from OpenStreetMap API
- Saves to `apps/api/data/shops_backup.json`
- Inserts shops into Supabase (skips duplicates)
- Takes several hours (respects rate limits)

**Option B: Subsequent Runs (Use Backup)**
```bash
npx ts-node src/scripts/importJapanShopsOSM.ts
```

**What happens:**
- ✅ Prints: "USING LOCAL DATASET"
- Loads from `apps/api/data/shops_backup.json`
- Skips all API requests (fast!)
- Inserts missing shops only
- Takes minutes instead of hours

---

### Step 4: Import from Backup (Alternative)

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

## 🔒 SAFETY FEATURES

### ✅ Duplicate Protection

1. **Unique Constraint** - Database prevents duplicate `osm_id`
2. **Pre-insert Check** - Script checks before inserting
3. **Skip Logic** - Duplicates are skipped, not deleted

### ✅ Data Safety

1. **No Deletes** - Script never deletes or truncates
2. **Only Inserts** - Only adds new shops
3. **Backup First** - Saves to file before inserting
4. **Resumable** - Can stop and resume anytime

### ✅ Category Safety

1. **Dynamic Creation** - Creates missing categories
2. **Name-based** - No hard-coded category IDs
3. **Fallback** - Uses "Unknown" if category can't be created

---

## 📊 EXPECTED OUTPUT

### First Run (Fetching from OSM):
```
🚀 Starting Japan-wide Shop Importer (OpenStreetMap)

🌐 FETCHING FROM OSM
   No local dataset found, fetching from OpenStreetMap API

📍 Total locations to search: 500+
🔍 Using 10 search terms
⏳ This will take a while (respecting rate limits)...

📍 [1/500] Processing: Tokyo Shinjuku
  🔍 [1/10] Searching: "hair salon"
  ⏳ Processed 100/5000 shops...
  ✓ Batch 1: Inserted 100 shops
...

💾 Saved 43000 shops to local dataset
   File: apps/api/data/shops_backup.json

📊 IMPORT SUMMARY
Total shops found: 50000
Unique shops: 43000
Duplicates skipped: 7000
Successfully inserted: 43000
```

### Subsequent Runs (Using Backup):
```
🚀 Starting Japan-wide Shop Importer (OpenStreetMap)

✅ USING LOCAL DATASET
   Skipping API requests, using cached data

📂 Loaded 43000 shops from local dataset
   File: apps/api/data/shops_backup.json
   Saved: 2025-01-XX...

💾 Phase 2: Checking duplicates and inserting shops...
  ⏳ Processed 100/43000 shops...
  ✓ 500 shops ready to insert (42500 duplicates skipped)
  
📦 Phase 3: Inserting shops in batches...
  ✓ Batch 1: Inserted 100 shops
  ...
```

---

## 🗂️ FILE STRUCTURE

### Created Files:
```
supabase/migrations/
  └── 20250124000000_add_osm_id_unique_constraint.sql ⭐

apps/api/
  ├── data/
  │   └── shops_backup.json (created after first import)
  └── src/scripts/
      ├── importJapanShopsOSM.ts ✏️ (modified)
      └── importFromBackup.ts ⭐ (new)

IMPORT_SCRIPT_ANALYSIS.md ⭐
SHOP_IMPORT_COMPLETE_GUIDE.md ⭐ (this file)
```

---

## ✅ VERIFICATION

After import, verify in Supabase SQL Editor:

```sql
-- Check total shops
SELECT COUNT(*) as total_shops FROM shops;

-- Check shops by category
SELECT c.name, COUNT(s.id) as count
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
GROUP BY c.name
ORDER BY count DESC;

-- Check for duplicate osm_id (should be 0)
SELECT osm_id, COUNT(*) as count
FROM shops
WHERE osm_id IS NOT NULL
GROUP BY osm_id
HAVING COUNT(*) > 1;

-- Check unclaimed shops (your imported ones)
SELECT COUNT(*) as unclaimed_shops 
FROM shops 
WHERE owner_user_id IS NULL 
  AND claim_status = 'unclaimed';
```

---

## 🚨 IMPORTANT NOTES

1. **Run SQL Migration First** - Required before importing
2. **First Run Takes Hours** - Be patient, it respects rate limits
3. **Backup is Created Automatically** - After first successful fetch
4. **Subsequent Runs are Fast** - Uses backup file
5. **Never Deletes Data** - Only inserts new shops
6. **Safe to Interrupt** - Can resume later (checkpoint system)

---

## 📋 CHECKLIST

Before running:
- [ ] Run SQL migration: `20250124000000_add_osm_id_unique_constraint.sql`
- [ ] Verify `apps/api/.env` has Supabase credentials
- [ ] Navigate to `apps/api` directory

To import:
- [ ] Run: `npx ts-node src/scripts/importJapanShopsOSM.ts`
- [ ] Wait for completion (hours on first run)
- [ ] Verify backup file created: `apps/api/data/shops_backup.json`
- [ ] Check shop count in Supabase

---

## 🎯 QUICK START

```bash
# 1. Run SQL migration in Supabase SQL Editor
# (Copy from: supabase/migrations/20250124000000_add_osm_id_unique_constraint.sql)

# 2. Run import script
cd apps/api
npx ts-node src/scripts/importJapanShopsOSM.ts

# 3. Wait for completion (check console output)

# 4. Verify in Supabase
# Run: SELECT COUNT(*) FROM shops;
```

---

**END OF GUIDE**

