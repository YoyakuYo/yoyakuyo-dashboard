# ✅ Multi-Source Import Script - Complete Summary

**Date:** 2025-01-24  
**Objective:** Import 40,000+ shops from multiple FREE data sources in Japan

---

## 📋 FILES CREATED/MODIFIED

### ⭐ NEW FILES

1. **`supabase/migrations/20250124000001_add_unique_id_to_shops.sql`**
   - **Purpose:** Add `unique_id` column with unique constraint
   - **Location:** `supabase/migrations/`
   - **Status:** Ready to run in Supabase SQL Editor

2. **`apps/api/src/scripts/importJapanShopsMultiSource.ts`**
   - **Purpose:** Multi-source import script
   - **Location:** `apps/api/src/scripts/`
   - **Status:** Ready to use (requires API keys and Government Data URL update)

3. **`MULTI_SOURCE_IMPORT_README.md`**
   - **Purpose:** Complete documentation and setup guide
   - **Location:** Root directory
   - **Status:** Documentation only

4. **`MULTI_SOURCE_IMPORT_SUMMARY.md`** (this file)
   - **Purpose:** Summary of all changes
   - **Location:** Root directory
   - **Status:** Documentation only

---

## 📄 SQL MIGRATION FILE

### File: `supabase/migrations/20250124000001_add_unique_id_to_shops.sql`

**Full Contents:** (78 lines)

```sql
-- Migration: Add unique_id column to shops table for multi-source import
-- unique_id format: "source:external_id" (e.g., "gov:12345", "tourism:67890", "hotpepper:abc123", "osm:12345678")

-- Step 1: Add unique_id column
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS unique_id TEXT;

-- Step 2: Create index
CREATE INDEX IF NOT EXISTS shops_unique_id_idx ON shops(unique_id) WHERE unique_id IS NOT NULL;

-- Step 3: Check for duplicates (report only)
-- Step 4: Create unique index (fails if duplicates exist)
-- Step 5: Add comments
-- Step 6: Verify index creation
```

**What it does:**
1. Adds `unique_id` TEXT column
2. Creates index for faster lookups
3. Checks for duplicates (reports only)
4. Creates unique constraint (prevents duplicates)
5. Verifies success

**Safety:**
- ✅ Idempotent (safe to run multiple times)
- ✅ Reports duplicates without deleting
- ✅ Fails safely if duplicates exist

---

## 🔧 IMPORT SCRIPT DETAILS

### File: `apps/api/src/scripts/importJapanShopsMultiSource.ts`

**Features:**
- ✅ Fetches from 4 sources sequentially
- ✅ Normalizes data from each source
- ✅ Checks duplicates by `unique_id`
- ✅ Creates missing categories dynamically
- ✅ Saves backup to `data/shops_multisource_backup.json`
- ✅ Resumable via checkpoint system
- ✅ Batch inserts (100 shops per batch)

**Sources:**
1. **Japan Government Open Data** - Template (requires dataset URL update)
2. **Japan Tourism API** - Requires free API key
3. **Hot Pepper Beauty API** - Requires free API key
4. **OpenStreetMap** - Fallback (can use existing OSM script)

**Expected Records:**
- Government: 5,000-10,000
- Tourism: 10,000-15,000
- Hot Pepper: 20,000-30,000
- OSM: 10,000-20,000
- **Total Unique: ~40,000-50,000** (after deduplication)

---

## 🔑 API KEY REQUIREMENTS

### Required (for full import):

1. **Hot Pepper Beauty API Key**
   - **Get:** https://webservice.recruit.co.jp/
   - **Free Tier:** 10,000 requests/day, 1 req/sec
   - **Add to `.env`:** `HOT_PEPPER_BEAUTY_API_KEY=your_key`

2. **Japan Tourism API Key** (Optional but recommended)
   - **Get:** https://www.jnto.go.jp/
   - **Free:** For travel businesses
   - **Add to `.env`:** `JAPAN_TOURISM_API_KEY=your_key`

### Not Required:

- **OpenStreetMap:** No API key needed
- **Government Data:** Public datasets, no key needed

---

## 📊 PROCESS STEPS

### Step 1: Run SQL Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of: `supabase/migrations/20250124000001_add_unique_id_to_shops.sql`
3. Paste and run
4. Verify: "✅ Unique index on unique_id created successfully"

---

### Step 2: Configure Environment

Edit `apps/api/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JAPAN_TOURISM_API_KEY=your_tourism_key  # Optional
HOT_PEPPER_BEAUTY_API_KEY=your_hotpepper_key  # Recommended
```

---

### Step 3: Update Government Data Source

1. Visit: https://www.data.go.jp/
2. Search for: `サービス産業`, `美容院`, `サロン`, `宿泊施設`
3. Find dataset URL or download CSV/JSON
4. Update `fetchJapanGovernmentData()` function in script
5. Add actual dataset URL or file path

---

### Step 4: Run Import Script

```bash
cd apps/api
npx ts-node src/scripts/importJapanShopsMultiSource.ts
```

**What happens:**
1. Fetches from all sources (in sequence)
2. Normalizes data
3. Checks duplicates
4. Saves backup
5. Inserts into Supabase

**Time:** Hours (first run), minutes (subsequent runs with backup)

---

### Step 5: Verify Results

Run in Supabase SQL Editor:

```sql
-- Total shops
SELECT COUNT(*) FROM shops;

-- By source
SELECT 
  CASE 
    WHEN unique_id LIKE 'gov:%' THEN 'Government'
    WHEN unique_id LIKE 'tourism:%' THEN 'Tourism'
    WHEN unique_id LIKE 'hotpepper:%' THEN 'Hot Pepper'
    WHEN unique_id LIKE 'osm:%' THEN 'OSM'
  END as source,
  COUNT(*) as count
FROM shops
WHERE unique_id IS NOT NULL
GROUP BY source;
```

---

## 🔄 RESUMING AFTER INTERRUPTION

### Checkpoint System

- **File:** `apps/api/multisource_checkpoint.json`
- **Contains:** List of processed `unique_id`s

### To Resume:

1. Re-run script (it loads checkpoint automatically)
2. Script skips already processed shops
3. Continues from where it stopped

### Manual Resume:

If checkpoint corrupted:
1. Delete: `rm apps/api/multisource_checkpoint.json`
2. Re-run script

---

## 📁 FILE LOCATIONS

### SQL Migration:
- **Path:** `supabase/migrations/20250124000001_add_unique_id_to_shops.sql`
- **Action:** Run in Supabase SQL Editor

### Import Script:
- **Path:** `apps/api/src/scripts/importJapanShopsMultiSource.ts`
- **Action:** Run via `npx ts-node`

### Backup File (Created After Import):
- **Path:** `apps/api/data/shops_multisource_backup.json`
- **Format:** JSON with shops array
- **Size:** ~10-50MB

### Checkpoint File (Created During Import):
- **Path:** `apps/api/multisource_checkpoint.json`
- **Format:** JSON with processed IDs
- **Purpose:** Resume interrupted imports

---

## ⚠️ IMPORTANT NOTES

1. **Government Data:** Requires manual dataset discovery and URL update
2. **API Keys:** Hot Pepper key is recommended (20k+ records)
3. **Rate Limits:** Script respects 1 req/sec for all APIs
4. **Deduplication:** Handled automatically by `unique_id` constraint
5. **Backup:** Created automatically after fetch phase
6. **Resumable:** Can stop and resume anytime

---

## 🎯 QUICK REFERENCE

```bash
# 1. Run SQL migration in Supabase SQL Editor
# File: supabase/migrations/20250124000001_add_unique_id_to_shops.sql

# 2. Add API keys to apps/api/.env
HOT_PEPPER_BEAUTY_API_KEY=your_key
JAPAN_TOURISM_API_KEY=your_key  # Optional

# 3. Update Government Data source in script
# Edit: apps/api/src/scripts/importJapanShopsMultiSource.ts
# Function: fetchJapanGovernmentData()

# 4. Run import
cd apps/api
npx ts-node src/scripts/importJapanShopsMultiSource.ts

# 5. Wait for completion

# 6. Verify in Supabase
```

---

## ✅ SAFETY GUARANTEES

- ✅ **Never Deletes:** Only uses `INSERT`, never `DELETE` or `TRUNCATE`
- ✅ **Duplicate-Safe:** Checks `unique_id` before inserting
- ✅ **Unique Constraint:** Database enforces `unique_id` uniqueness
- ✅ **Existing Shops Protected:** Your manual shops remain untouched
- ✅ **Resumable:** Can stop and resume anytime
- ✅ **Backup:** Saves to JSON file automatically

---

**All files created. Ready for manual execution!** ✅

