# 📋 Import Script Analysis Report

## Current Script: `apps/api/src/scripts/importJapanShopsOSM.ts`

### ✅ What It Currently Does

1. **Does NOT delete shops** ✅
   - No `DELETE`, `TRUNCATE`, or `DROP` statements
   - Only uses `INSERT` operations
   - Safe for re-running

2. **Duplicate Detection** ✅
   - Checks by `osm_id` first (line 366-372)
   - Falls back to coordinates (within 50m)
   - Falls back to name similarity
   - Skips duplicates before inserting

3. **Category Mapping** ✅
   - Uses dynamic category name matching (line 1136-1141)
   - Fetches all categories from database
   - Maps by category name (not hard-coded IDs)
   - Falls back to "Unknown" if category not found

4. **Local Backup** ✅ (Just Added)
   - Saves to `apps/api/src/data/japan_shops_osm.json`
   - Loads from file if exists
   - Skips API requests if backup exists

### ⚠️ Issues Found

1. **Missing Unique Constraint on `osm_id`**
   - Column exists but no UNIQUE constraint
   - Could allow duplicate `osm_id` values
   - Should add unique constraint or unique index

2. **Category Creation**
   - Script doesn't create missing categories automatically
   - If category name doesn't exist, falls back to "Unknown"
   - Should create categories dynamically if missing

3. **Backup File Path**
   - Currently saves to `apps/api/src/data/japan_shops_osm.json`
   - User requested `data/shops_backup.json`
   - Need to update path

### 📊 Current Flow

1. **Phase 1**: Fetch shops from OSM API (or load from backup)
2. **Phase 2**: Check duplicates, prepare for insert
3. **Phase 3**: Batch insert (100 shops per batch)

### 🔧 Required Improvements

1. Add unique constraint/index on `osm_id`
2. Create missing categories dynamically
3. Update backup file path to `data/shops_backup.json`
4. Improve duplicate check to prioritize `osm_id`
5. Make script fully resumable with better checkpointing

