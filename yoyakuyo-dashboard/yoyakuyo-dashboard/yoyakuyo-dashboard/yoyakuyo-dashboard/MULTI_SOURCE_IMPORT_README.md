# 🚀 Multi-Source Shop Import Guide - Japan

**Objective:** Import 40,000+ shops from multiple FREE data sources in Japan.

---

## 📋 SOURCES

### 1. Japan Government Open Data (data.go.jp)
- **Cost:** FREE
- **API Key:** Not required (public datasets)
- **Rate Limit:** Varies by dataset
- **Expected Records:** 5,000-10,000
- **Data Format:** CSV/JSON (varies by dataset)

### 2. Japan Tourism API (JNTO)
- **Cost:** FREE (for travel businesses)
- **API Key:** Required (free registration)
- **Rate Limit:** ~1 req/sec
- **Expected Records:** 10,000-15,000
- **Data Format:** JSON

### 3. Hot Pepper Beauty API (Recruit)
- **Cost:** FREE (limited tier)
- **API Key:** Required (free registration)
- **Rate Limit:** ~1 req/sec
- **Expected Records:** 20,000-30,000
- **Data Format:** JSON

### 4. OpenStreetMap (OSM)
- **Cost:** FREE
- **API Key:** Not required
- **Rate Limit:** 1 req/sec (Nominatim)
- **Expected Records:** 10,000-20,000
- **Data Format:** JSON

**Total Expected:** 45,000-75,000 shops (with deduplication: ~40,000+ unique)

---

## 🔑 HOW TO GET FREE API KEYS

### Japan Tourism API (JNTO)

1. **Visit:** https://www.jnto.go.jp/
2. **Navigate to:** API Documentation / Developer Portal
3. **Register:** Create free account
4. **Request API Key:** Fill out form (mention you're a travel business)
5. **Add to `.env`:**
   ```
   JAPAN_TOURISM_API_KEY=your_api_key_here
   ```

**Note:** JNTO API may require business verification. Check their current terms.

---

### Hot Pepper Beauty API (Recruit)

1. **Visit:** https://webservice.recruit.co.jp/
2. **Navigate to:** Hot Pepper Beauty API
3. **Register:** Create free account
4. **Get API Key:** Available immediately after registration
5. **Add to `.env`:**
   ```
   HOT_PEPPER_BEAUTY_API_KEY=your_api_key_here
   ```

**Free Tier Limits:**
- 10,000 requests/day
- 1 request/second
- No credit card required

---

### Japan Government Open Data

1. **Visit:** https://www.data.go.jp/
2. **Search for datasets:**
   - Keywords: `サービス産業`, `美容院`, `サロン`, `宿泊施設`, `観光施設`
3. **Download datasets:**
   - CSV or JSON format
   - No API key needed
4. **Update script:**
   - Modify `fetchJapanGovernmentData()` function
   - Add dataset URL or file path

**Popular Datasets:**
- Service Industry Data
- Tourism Facility Data
- Business Registration Data

---

## ⚙️ SETUP INSTRUCTIONS

### Step 1: Run SQL Migration

**File:** `supabase/migrations/20250124000001_add_unique_id_to_shops.sql`

1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of the migration file
3. Paste and run
4. Verify: Should see "✅ Unique index on unique_id created successfully"

**This adds `unique_id` column and unique constraint.**

---

### Step 2: Configure Environment Variables

Edit `apps/api/.env`:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional (for Tourism API)
JAPAN_TOURISM_API_KEY=your_tourism_api_key

# Optional (for Hot Pepper Beauty)
HOT_PEPPER_BEAUTY_API_KEY=your_hotpepper_api_key
```

---

### Step 3: Update Government Data Source

The script includes a template for Government Data. You need to:

1. **Find actual dataset URLs:**
   - Visit https://www.data.go.jp/
   - Search for relevant datasets
   - Note the dataset URL or download CSV/JSON

2. **Update `fetchJapanGovernmentData()` function:**
   ```typescript
   // Replace template code with actual dataset URL
   const response = await fetch("https://actual-dataset-url.json");
   const data = await response.json();
   // Process data...
   ```

---

### Step 4: Run Import Script

```bash
cd apps/api
npx ts-node src/scripts/importJapanShopsMultiSource.ts
```

**What happens:**
1. Fetches from all sources in sequence
2. Normalizes data from each source
3. Checks duplicates by `unique_id`
4. Saves backup to `data/shops_multisource_backup.json`
5. Inserts shops into Supabase

---

## 📊 RATE LIMIT BEST PRACTICES

### General Rules

1. **Respect API Limits:**
   - Hot Pepper: 1 req/sec, 10k/day
   - Tourism API: 1 req/sec
   - OSM: 1 req/sec (Nominatim)

2. **Add Delays:**
   - Script includes `sleep(1000)` between requests
   - Adjust if you get rate limit errors

3. **Batch Processing:**
   - Process in batches of 100
   - Save checkpoint after each batch

4. **Error Handling:**
   - Script continues if one source fails
   - Logs errors for review

---

## 🔄 RESUMING AFTER INTERRUPTION

### Checkpoint System

The script saves progress to:
- **File:** `apps/api/multisource_checkpoint.json`
- **Contains:** List of processed `unique_id`s

### To Resume:

1. **Check checkpoint file:**
   ```bash
   cat apps/api/multisource_checkpoint.json
   ```

2. **Re-run script:**
   ```bash
   npx ts-node src/scripts/importJapanShopsMultiSource.ts
   ```

3. **Script will:**
   - Load checkpoint
   - Skip already processed shops
   - Continue from where it stopped

### Manual Resume:

If checkpoint is corrupted:

1. **Delete checkpoint:**
   ```bash
   rm apps/api/multisource_checkpoint.json
   ```

2. **Use backup file:**
   - Script checks for `data/shops_multisource_backup.json`
   - If exists, can skip API calls (modify script)

---

## 📁 FILE STRUCTURE

### Created Files:

```
supabase/migrations/
  └── 20250124000001_add_unique_id_to_shops.sql ⭐

apps/api/src/scripts/
  └── importJapanShopsMultiSource.ts ⭐

apps/api/data/
  └── shops_multisource_backup.json (created after import)

apps/api/
  └── multisource_checkpoint.json (created during import)

MULTI_SOURCE_IMPORT_README.md ⭐ (this file)
```

---

## 🔍 UNIQUE_ID FORMAT

Each shop gets a `unique_id` in format: `source:external_id`

**Examples:**
- `gov:12345` - Government data, ID 12345
- `tourism:67890` - Tourism API, ID 67890
- `hotpepper:abc123` - Hot Pepper, ID abc123
- `osm:12345678` - OpenStreetMap, ID 12345678

**This ensures no duplicates across sources.**

---

## ✅ VERIFICATION

After import, verify in Supabase SQL Editor:

```sql
-- Total shops
SELECT COUNT(*) as total_shops FROM shops;

-- Shops by source (check unique_id prefix)
SELECT 
  CASE 
    WHEN unique_id LIKE 'gov:%' THEN 'Government'
    WHEN unique_id LIKE 'tourism:%' THEN 'Tourism'
    WHEN unique_id LIKE 'hotpepper:%' THEN 'Hot Pepper'
    WHEN unique_id LIKE 'osm:%' THEN 'OSM'
    ELSE 'Unknown'
  END as source,
  COUNT(*) as count
FROM shops
WHERE unique_id IS NOT NULL
GROUP BY source
ORDER BY count DESC;

-- Shops by category
SELECT c.name, COUNT(s.id) as count
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
GROUP BY c.name
ORDER BY count DESC;

-- Check for duplicate unique_id (should be 0)
SELECT unique_id, COUNT(*) as count
FROM shops
WHERE unique_id IS NOT NULL
GROUP BY unique_id
HAVING COUNT(*) > 1;
```

---

## 🚨 TROUBLESHOOTING

### Issue: API Key Not Working

**Solution:**
1. Verify key is correct in `.env`
2. Check API provider's dashboard for key status
3. Ensure you're within rate limits

### Issue: Rate Limit Errors

**Solution:**
1. Increase `sleep()` delay in script
2. Reduce batch size
3. Run script during off-peak hours

### Issue: Government Data Not Loading

**Solution:**
1. Update `fetchJapanGovernmentData()` with actual dataset URL
2. Check dataset format (CSV vs JSON)
3. Add proper parsing logic

### Issue: Duplicate Errors

**Solution:**
1. Check if `unique_id` column exists
2. Verify unique constraint is applied
3. Review duplicate detection logic

---

## 📊 EXPECTED RESULTS

### First Run:
- **Government Data:** 5,000-10,000 shops
- **Tourism API:** 10,000-15,000 shops
- **Hot Pepper:** 20,000-30,000 shops
- **OSM:** 10,000-20,000 shops
- **Total Unique:** ~40,000-50,000 shops (after deduplication)

### Backup File:
- **Location:** `apps/api/data/shops_multisource_backup.json`
- **Size:** ~10-50MB (depending on shop count)
- **Format:** JSON with shops array

---

## 🎯 QUICK START

```bash
# 1. Run SQL migration in Supabase SQL Editor
# File: supabase/migrations/20250124000001_add_unique_id_to_shops.sql

# 2. Add API keys to apps/api/.env
JAPAN_TOURISM_API_KEY=your_key
HOT_PEPPER_BEAUTY_API_KEY=your_key

# 3. Update Government Data source (find actual dataset URL)

# 4. Run import
cd apps/api
npx ts-node src/scripts/importJapanShopsMultiSource.ts

# 5. Wait for completion (hours for first run)

# 6. Verify in Supabase
```

---

## 📝 NOTES

- **Government Data:** Requires manual dataset discovery and URL update
- **Tourism API:** May require business verification
- **Hot Pepper:** Free tier has daily limits
- **OSM:** Can use existing `importJapanShopsOSM.ts` script separately
- **Deduplication:** Handled automatically by `unique_id` constraint
- **Backup:** Created automatically after fetch phase

---

**END OF GUIDE**

