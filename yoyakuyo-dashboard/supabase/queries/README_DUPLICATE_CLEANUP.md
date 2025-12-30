# Duplicate Shops Cleanup Guide

This guide explains how to identify and clean up duplicate shops and shops with incomplete addresses.

## 📋 SQL Queries (Start Here)

### Step 1: Get Overview
Run **Query 8** (Summary Statistics) to get a quick overview:
```sql
-- Copy Query 8 from show_duplicate_shops.sql
```

### Step 2: Find Top Duplicates
Run **Query 9** (Top 20 Most Duplicated Names) and **Query 10** (Top 20 Most Duplicated Addresses):
```sql
-- Copy Query 9 and Query 10 from show_duplicate_shops.sql
```

### Step 3: View Specific Duplicates
Use **Query 11** to see all shops for a specific address:
```sql
-- Replace 'apa hotel, japan' with any address from Query 10
SELECT * FROM shops WHERE LOWER(TRIM(address)) = LOWER(TRIM('apa hotel, japan'));
```

### Step 4: Find Incomplete Addresses
Run **Query 12** to see shops with incomplete addresses:
```sql
-- Copy Query 12 from show_duplicate_shops.sql
```

### Step 5: Count Incomplete Addresses
Run **Query 13** to get a summary of bad address data:
```sql
-- Copy Query 13 from show_duplicate_shops.sql
```

## 🧹 Cleanup Script

### Prerequisites
Make sure you have environment variables set in `apps/api/.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Usage

#### 1. Dry Run (Safe - No Changes)
First, run in dry-run mode to see what would be affected:
```bash
cd apps/api
npx ts-node src/scripts/cleanupIncompleteAddresses.ts
```

This will:
- Find all shops with incomplete addresses
- Show a summary by issue type
- Display sample shops
- **NOT make any changes** to the database

#### 2. Mark Shops as Hidden (Soft Delete)
To actually mark shops as hidden:
```bash
cd apps/api
npx ts-node src/scripts/cleanupIncompleteAddresses.ts --execute --mark-hidden
```

**⚠️ WARNING:** This will mark shops as `claim_status = 'hidden'` which will hide them from the frontend.

#### 3. Options

**Include all issue types:**
```bash
npx ts-node src/scripts/cleanupIncompleteAddresses.ts --execute --mark-hidden --all-issues
```

**Default issue types (safest):**
- `too_short` - Addresses with 3 characters or less
- `numbers_only` - Addresses that are just numbers
- `single_char` - Addresses that are single characters like "1", "2", etc.

**All issue types:**
- `too_short`
- `numbers_only`
- `single_char`
- `city_name_only` - Addresses that are just city names (e.g., "大阪市")
- `starts_with_number` - Addresses that start with just a number (e.g., "1 横浜市")

### What the Script Does

1. **Scans all shops** in batches of 1000
2. **Identifies incomplete addresses** based on patterns:
   - Too short (≤3 characters)
   - Numbers only
   - Single characters
   - City names only
   - Starts with number only
3. **Groups by issue type** and shows summary
4. **Marks shops as hidden** (if `--mark-hidden` is used)
   - Sets `claim_status = 'hidden'`
   - Shops are not deleted, just hidden from frontend

### Example Output

```
🚀 Starting cleanup of incomplete addresses...
   Dry Run: YES
   Mark as Hidden: NO
   Issue Types: too_short, numbers_only, single_char

🔍 Finding shops with incomplete addresses...
  Processed 10000 shops, found 234 with issues...
  Processed 20000 shops, found 456 with issues...

📊 Found 1234 shops with incomplete addresses

📋 Summary by Issue Type:
==================================================
  too_short: 456 shops
  numbers_only: 234 shops
  single_char: 123 shops
  city_name_only: 345 shops
  starts_with_number: 76 shops
==================================================

🎯 Shops to process: 813

📝 Sample shops (first 10):
  1. [too_short] Shop Name - "1"
  2. [numbers_only] Another Shop - "123"
  3. [single_char] Third Shop - "5"
  ...
```

## 🔍 Understanding the Results

### Legitimate Duplicates
These are **NOT** data quality issues:
- **Chain businesses**: "APA Hotel, Japan" (37 shops) - This is normal for hotel chains
- **Karaoke chains**: "Karaoke-kan, Japan" (30 shops) - Multiple locations

### Data Quality Issues
These **ARE** problems that should be cleaned:
- **City names only**: "大阪市" (34 shops) - Incomplete address
- **Single characters**: "1" (16 shops) - Clearly incomplete
- **Numbers only**: "123" - Incomplete address

## ⚠️ Important Notes

1. **Always run dry-run first** to see what will be affected
2. **The script uses soft delete** (`claim_status = 'hidden'`) - shops are not permanently deleted
3. **You can unhide shops later** by updating `claim_status` back to `unclaimed` or `approved`
4. **Chain businesses** (like APA Hotel) should probably be kept - they're legitimate duplicates
5. **Review the sample shops** before running with `--execute`

## 🔄 Reverting Changes

If you need to unhide shops that were marked as hidden:

```sql
-- Unhide all shops that were marked as hidden
UPDATE shops 
SET claim_status = 'unclaimed' 
WHERE claim_status = 'hidden' 
  AND address IN (
    -- List of addresses you want to restore
    '1', '2', '3', '大阪市', '京都市'
  );
```

Or restore all hidden shops:
```sql
UPDATE shops 
SET claim_status = 'unclaimed' 
WHERE claim_status = 'hidden';
```

## 📊 Next Steps

After cleanup:
1. Review the hidden shops to ensure they were correctly identified
2. Consider improving address parsing/validation in your data import process
3. For chain businesses, consider adding a `chain_name` field instead of marking as duplicates
4. Monitor new imports to prevent similar issues

