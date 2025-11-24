# 🔍 Shop Database Sync - End-to-End Diagnostic Report

**Generated:** $(date)  
**Purpose:** Diagnose and repair shop database sync for 43,000+ records

---

## 📊 EXECUTIVE SUMMARY

### Findings
- ✅ **Backend API**: Already supports pagination via `fetchAllShops()` (batches of 1000)
- ⚠️ **Frontend Browse Page**: Fetches ALL shops without pagination (will fail with 40k+ shops)
- ✅ **Import Scripts**: Exist but fetch from external APIs (OpenStreetMap/Google Places), not static files
- ❌ **Static Data Files**: No JSON/CSV files with 43,000+ records found in codebase
- ✅ **Schema**: Supabase shops table schema is complete and matches code expectations

### Action Items
1. ✅ Created SQL export script to extract existing Supabase shops
2. ✅ Created SQL import migration script with duplicate detection
3. ✅ Created Python helper script to convert JSON/CSV to SQL
4. ⚠️ **REQUIRED**: Update frontend browse page to use pagination
5. ⚠️ **REQUIRED**: Add pagination query params to backend API

---

## 1️⃣ DATA SOURCE DISCOVERY

### Files Searched
- `**/*shop*.json` - No files found
- `**/*shop*.csv` - No files found
- `**/*shop*.sql` - Only migration files found
- `**/*tokyo*.json` - No files found
- `**/*japan*.json` - Found: `apps/api/japanese_cities_cache.json` (cities only, not shops)

### Import Scripts Found
1. **`apps/api/src/scripts/importJapanShopsOSM.ts`**
   - Fetches shops from OpenStreetMap/Nominatim API
   - Covers Japan-wide locations (Tokyo, Osaka, Kyoto, etc.)
   - Uses checkpoint file: `apps/api/import_checkpoint.json` (not found - likely cleaned up)
   - Inserts directly into Supabase

2. **`apps/api/src/scripts/importTokyoShops.ts`**
   - Fetches shops from Google Places API
   - Covers Tokyo area only
   - Requires `GOOGLE_MAPS_API_KEY`
   - Inserts directly into Supabase

### Conclusion
**No static data files with 43,000+ records exist in the codebase.**

The import scripts fetch data from external APIs on-the-fly. If you have 43,000+ shops already in Supabase, use `EXPORT_EXISTING_SHOPS.sql` to export them.

---

## 2️⃣ SCHEMA COMPARISON

### Supabase `shops` Table Schema (Current)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(255) | NOT NULL | - | Required |
| `address` | VARCHAR(255) | NULL | - | Optional |
| `phone` | VARCHAR(20) | NULL | - | Optional |
| `email` | VARCHAR(255) | NULL | - | Optional |
| `latitude` | NUMERIC(10,8) | NULL | - | From Google Places/OSM |
| `longitude` | NUMERIC(11,8) | NULL | - | From Google Places/OSM |
| `city` | VARCHAR(255) | NULL | - | Added in `fix_shops_schema_complete.sql` |
| `country` | VARCHAR(255) | NULL | - | Added in `fix_shops_schema_complete.sql` |
| `zip_code` | VARCHAR(20) | NULL | - | Added in `fix_shops_schema_complete.sql` |
| `website` | VARCHAR(500) | NULL | - | From Google Places |
| `description` | TEXT | NULL | - | Added in `fix_shops_schema_complete.sql` |
| `category_id` | UUID | NULL | - | FK to `categories` table |
| `owner_user_id` | UUID | NULL | - | FK to `public.users(id)` |
| `claim_status` | TEXT | NULL | `'unclaimed'` | Enum: unclaimed, pending, approved, rejected |
| `claimed_at` | TIMESTAMPTZ | NULL | - | Timestamp when claimed |
| `osm_id` | TEXT | NULL | - | OpenStreetMap ID |
| `google_place_id` | VARCHAR(255) | NULL | - | Google Places API ID |
| `business_status` | VARCHAR(50) | NULL | - | From Google Places |
| `opening_hours` | JSONB | NULL | - | From Google Places |
| `language_code` | VARCHAR(10) | NULL | - | Added in `fix_shops_schema_complete.sql` |
| `created_at` | TIMESTAMPTZ | NULL | `NOW()` | Auto-generated |
| `updated_at` | TIMESTAMPTZ | NULL | `NOW()` | Auto-updated via trigger |

### Import Script Expected Fields

**From `importJapanShopsOSM.ts`:**
```typescript
{
  name: string,
  address: string,
  latitude: number,
  longitude: number,
  city: string,
  country: string,
  zip_code: string,
  phone: string | null,
  email: string | null,
  website: string | null,
  category_id: UUID,
  claim_status: 'unclaimed',
  osm_id: string
}
```

**From `importTokyoShops.ts`:**
```typescript
{
  name: string,
  address: string | null,
  phone: string | null,
  email: string,
  // ... (similar fields)
}
```

### Schema Match Status
✅ **All fields match** - No missing columns detected

---

## 3️⃣ MIGRATION SCRIPTS GENERATED

### Files Created

1. **`EXPORT_EXISTING_SHOPS.sql`**
   - Exports all shops from Supabase
   - Includes verification queries
   - Run this first to see what data you have

2. **`IMPORT_SHOPS_MIGRATION.sql`**
   - Bulk import script with duplicate detection
   - Auto-generates UUIDs
   - Sets `owner_user_id = NULL` for scraped shops
   - Auto-links categories by name
   - Creates missing categories automatically
   - Skips duplicates based on `name + address + city`

3. **`SHOP_IMPORT_PYTHON_SCRIPT.py`**
   - Converts JSON/CSV files to SQL INSERT statements
   - Usage: `python shop_import_script.py input.json output.sql`
   - Handles various field name variations

### Migration Features

✅ **Duplicate Detection:**
- Checks `name + address + city` combination
- Skips shops that already exist
- Prefers records with more complete data

✅ **Category Handling:**
- Links by category name
- Creates missing categories automatically
- Defaults to 'General Salon' if category not found

✅ **Data Validation:**
- Skips shops with missing `name`
- Handles NULL values gracefully
- Sets defaults: `country = 'Japan'`, `language_code = 'ja'`

---

## 4️⃣ BACKEND API PAGINATION

### Current Implementation

**File:** `apps/api/src/routes/shops.ts`

**Function:** `fetchAllShops()`
- ✅ Already supports pagination (batches of 1000)
- ✅ Handles search, category, and owner filters
- ✅ Fetches all shops in batches and combines

**Issue:** The `GET /shops` endpoint doesn't expose pagination query params.

### Required Updates

**Add pagination query params:**
- `limit` - Number of shops per page (default: 50, max: 1000)
- `offset` - Number of shops to skip (default: 0)
- `page` - Page number (alternative to offset)

**Update `apps/api/src/routes/shops.ts`:**

```typescript
router.get("/", async (req: Request, res: Response) => {
    // ... existing code ...
    
    // Add pagination params
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const page = parseInt(req.query.page as string) || 1;
    const actualOffset = offset || (page - 1) * limit;
    
    // Use limit/offset in query instead of fetchAllShops
    let query = dbClient
        .from("shops")
        .select("*")
        .order("name", { ascending: true })
        .range(actualOffset, actualOffset + limit - 1);
    
    // ... apply filters ...
    
    const { data, error, count } = await query;
    
    // Return paginated response
    return res.json({
        shops: data,
        pagination: {
            limit,
            offset: actualOffset,
            page,
            total: count, // Requires .select('*, count') or separate count query
            hasMore: data.length === limit
        }
    });
});
```

---

## 5️⃣ FRONTEND PAGINATION

### Current Implementation

**File:** `apps/dashboard/app/browse/page.tsx`

**Issue:** Fetches ALL shops without pagination:
```typescript
const res = await fetch(`${apiUrl}/shops${params.toString() ? `?${params.toString()}` : ''}`);
```

This will fail with 40,000+ shops.

### Required Updates

1. **Add pagination state:**
```typescript
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [hasMore, setHasMore] = useState(false);
```

2. **Update fetch function:**
```typescript
const fetchShops = useCallback(async () => {
    // ... existing code ...
    params.set('limit', '50'); // or use state
    params.set('page', page.toString());
    
    const res = await fetch(`${apiUrl}/shops?${params.toString()}`);
    const data = await res.json();
    
    // Handle paginated response
    if (data.pagination) {
        setShops(data.shops || []);
        setTotalPages(Math.ceil(data.pagination.total / data.pagination.limit));
        setHasMore(data.pagination.hasMore);
    } else {
        // Fallback for non-paginated response
        setShops(Array.isArray(data) ? data : []);
    }
}, [apiUrl, debouncedSearch, selectedCategoryId, page]);
```

3. **Add pagination UI:**
```typescript
{/* Pagination controls */}
<div className="flex justify-center gap-2 mt-8">
    <button 
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
    >
        Previous
    </button>
    <span>Page {page} of {totalPages}</span>
    <button 
        onClick={() => setPage(p => p + 1)}
        disabled={!hasMore}
    >
        Next
    </button>
</div>
```

---

## 6️⃣ FINAL REPORT SUMMARY

### Data Location
- ❌ **No static data files found** (JSON/CSV with 43,000+ records)
- ✅ **Import scripts exist** but fetch from external APIs
- ✅ **Export script created** to extract existing Supabase data

### Schema Status
- ✅ **All required fields exist** in Supabase shops table
- ✅ **No mismatches** between code expectations and database schema
- ✅ **Foreign keys properly configured** (categories, users)

### Migration Scripts
- ✅ `EXPORT_EXISTING_SHOPS.sql` - Export existing data
- ✅ `IMPORT_SHOPS_MIGRATION.sql` - Bulk import with duplicate detection
- ✅ `SHOP_IMPORT_PYTHON_SCRIPT.py` - Convert JSON/CSV to SQL

### Backend API
- ✅ **Pagination logic exists** (`fetchAllShops` batches of 1000)
- ⚠️ **Pagination params missing** - Need to add `limit`, `offset`, `page` query params
- ⚠️ **Response format** - Need to return pagination metadata

### Frontend
- ❌ **No pagination** - Fetches all shops (will fail with 40k+)
- ⚠️ **Needs update** - Add pagination state and UI

### Required Actions

1. **If you have existing shops in Supabase:**
   - Run `EXPORT_EXISTING_SHOPS.sql` to export data
   - Review the exported data
   - Use `IMPORT_SHOPS_MIGRATION.sql` to re-import if needed

2. **If you have external data files (JSON/CSV):**
   - Use `SHOP_IMPORT_PYTHON_SCRIPT.py` to convert to SQL
   - Run the generated SQL in Supabase SQL Editor

3. **Update Backend API:**
   - Add pagination query params (`limit`, `offset`, `page`)
   - Return pagination metadata in response

4. **Update Frontend:**
   - Add pagination state and controls
   - Update `fetchShops` to use pagination params
   - Add pagination UI component

5. **Test:**
   - Verify pagination works with large datasets
   - Test search and filter with pagination
   - Verify duplicate detection works correctly

---

## 7️⃣ ENVIRONMENT VARIABLES

### Required for Import Scripts

**For `importJapanShopsOSM.ts`:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS)

**For `importTokyoShops.ts`:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `GOOGLE_MAPS_API_KEY` - Google Places API key (required)

### No Additional Config Needed
The migration scripts run directly in Supabase SQL Editor and don't require environment variables.

---

## 8️⃣ ROW COUNTS & STATISTICS

### To Get Current Counts

Run these queries in Supabase SQL Editor:

```sql
-- Total shops
SELECT COUNT(*) as total_shops FROM shops;

-- Shops by category
SELECT c.name, COUNT(s.id) as count
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
GROUP BY c.name
ORDER BY count DESC;

-- Shops by claim status
SELECT 
    COALESCE(claim_status, 'null') as claim_status,
    COUNT(*) as count
FROM shops
GROUP BY claim_status
ORDER BY count DESC;

-- Unclaimed shops (scraped)
SELECT COUNT(*) as unclaimed_shops 
FROM shops 
WHERE owner_user_id IS NULL AND claim_status = 'unclaimed';
```

---

## 9️⃣ MIGRATION EXECUTION ORDER

### If Importing New Data

1. **Export existing data** (optional, for backup):
   ```sql
   -- Run EXPORT_EXISTING_SHOPS.sql
   ```

2. **Prepare your data:**
   - If JSON/CSV: Use `SHOP_IMPORT_PYTHON_SCRIPT.py` to convert to SQL
   - If already in SQL format: Use `IMPORT_SHOPS_MIGRATION.sql` template

3. **Run import migration:**
   ```sql
   -- Run IMPORT_SHOPS_MIGRATION.sql in Supabase SQL Editor
   -- Replace the VALUES section with your actual data
   ```

4. **Verify import:**
   ```sql
   -- Check counts
   SELECT COUNT(*) FROM shops;
   
   -- Check for duplicates
   SELECT name, address, city, COUNT(*) 
   FROM shops 
   GROUP BY name, address, city 
   HAVING COUNT(*) > 1;
   ```

---

## 🔟 FILES REFERENCE

### Created Files
- `EXPORT_EXISTING_SHOPS.sql` - Export script
- `IMPORT_SHOPS_MIGRATION.sql` - Import migration template
- `SHOP_IMPORT_PYTHON_SCRIPT.py` - JSON/CSV to SQL converter
- `SHOP_DATABASE_SYNC_REPORT.md` - This report

### Existing Files (Not Modified)
- `apps/api/src/scripts/importJapanShopsOSM.ts` - OSM importer
- `apps/api/src/scripts/importTokyoShops.ts` - Google Places importer
- `apps/api/src/routes/shops.ts` - Backend API (needs pagination update)
- `apps/dashboard/app/browse/page.tsx` - Frontend browse page (needs pagination update)

---

## ✅ NEXT STEPS

1. **Run `EXPORT_EXISTING_SHOPS.sql`** to see current shop count
2. **If importing new data:** Use `IMPORT_SHOPS_MIGRATION.sql` or `SHOP_IMPORT_PYTHON_SCRIPT.py`
3. **Update backend API** to add pagination query params
4. **Update frontend** to use pagination
5. **Test** with large datasets

---

**END OF REPORT**

