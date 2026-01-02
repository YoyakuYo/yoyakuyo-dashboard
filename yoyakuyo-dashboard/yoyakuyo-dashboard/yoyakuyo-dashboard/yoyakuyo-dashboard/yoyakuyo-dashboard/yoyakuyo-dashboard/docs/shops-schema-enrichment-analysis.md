# Shops Table Schema Enrichment Analysis

## STEP A — Current shops table structure

Based on direct query of the Supabase database, the `shops` table currently contains the following columns:

### All Columns (alphabetical order):
- `address`: TEXT/VARCHAR
- `adress`: NULL (nullable) - *Note: appears to be a typo/duplicate*
- `average_rating`: NULL (nullable)
- `business_status`: NULL (nullable)
- `category`: NULL (nullable)
- `category_id`: TEXT/VARCHAR
- `city`: NULL (nullable)
- `claim_status`: TEXT/VARCHAR
- `claimed_at`: NULL (nullable)
- `country`: NULL (nullable)
- `cover_photo_url`: NULL (nullable)
- `cover_url`: NULL (nullable)
- `created_at`: TEXT/VARCHAR
- `description`: NULL (nullable)
- `email`: TEXT/VARCHAR
- `google_maps_url`: NULL (nullable)
- `google_place_id`: NULL (nullable)
- `id`: TEXT/VARCHAR (UUID)
- `image_url`: NULL (nullable)
- `language_code`: TEXT/VARCHAR
- `latitude`: NULL (nullable)
- `line_channel_access_token`: NULL (nullable)
- `line_official_account_id`: NULL (nullable)
- `line_webhook_url`: NULL (nullable)
- `logo_url`: NULL (nullable)
- `longitude`: NULL (nullable)
- `name`: TEXT/VARCHAR
- `normalized_city`: NULL (nullable) ✅ **PRESERVED**
- `opening_hours`: JSONB ✅ **EXISTS**
- `osm_id`: NULL (nullable)
- `owner_id`: NULL (nullable)
- `owner_user_id`: NULL (nullable)
- `phone`: TEXT/VARCHAR
- `prefecture`: NULL (nullable) ✅ **PRESERVED**
- `shop_google_place_id`: NULL (nullable)
- `subcategory`: NULL (nullable)
- `total_reviews`: NUMERIC
- `unique_id`: NULL (nullable)
- `updated_at`: TEXT/VARCHAR
- `website`: NULL (nullable) - *Note: VARCHAR(500) from previous migration*
- `zip_code`: NULL (nullable)

**Total columns**: 37

---

## STEP B — Missing fields detected

### Required Fields Check:

| Field | Status | Notes |
|-------|--------|-------|
| `website_url` | ❌ **MISSING** | Required for Google Places API enrichment. Note: A `website` field (VARCHAR(500)) exists from a previous migration, but `website_url` (TEXT) is needed. |
| `opening_hours` | ✅ **EXISTS** | Already present as JSONB type. No action needed. |

**Summary**: Only `website_url` needs to be added. `opening_hours` already exists.

---

## STEP C — SQL migration required

### Migration File Created:
`supabase/migrations/add_website_url_to_shops.sql`

### SQL Commands:

```sql
-- Add website_url column (TEXT, nullable)
-- Note: A 'website' column (VARCHAR(500)) already exists from previous migrations
-- This new 'website_url' column is specifically for Google Places API enrichment
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN shops.website_url IS 'Website URL from Google Places API enrichment (TEXT type for flexibility)';
```

### Migration Safety:
- ✅ Uses `IF NOT EXISTS` - idempotent, safe to run multiple times
- ✅ Only ADDS a new column - does not modify existing columns
- ✅ Nullable column - no data migration required
- ✅ No impact on existing data or queries

---

## STEP D — Confirm that NO previous fixes will be overwritten

### ✅ Verification Checklist:

#### 1. Prefecture & City Normalization (CRITICAL - PRESERVED)
- ✅ `prefecture` column: **NOT TOUCHED** - remains as TEXT, nullable
- ✅ `normalized_city` column: **NOT TOUCHED** - remains as TEXT, nullable
- ✅ Backend extraction logic (`extractPrefecture`, `extractCity`): **NOT MODIFIED**
- ✅ Backend route (`yoyakuyo-api/src/routes/shops.ts`): **NOT MODIFIED**
  - Lines 83-84, 258-259, 281-282: Prefecture/city extraction logic preserved
- ✅ Frontend extraction functions (`lib/browse/shopBrowseData.ts`): **NOT MODIFIED**
  - Lines 32-36: Prioritizes backend-provided `shop.prefecture`
  - Lines 104-107: Prioritizes backend-provided `shop.normalized_city`

#### 2. Browse/Area/Category UI (PRESERVED)
- ✅ `buildAreaTree()` function: **NOT MODIFIED** - uses `extractPrefecture()` and `extractCity()`
- ✅ `fetchAllShops()` function: **NOT MODIFIED** - backend function remains unchanged
- ✅ Display logic: **NOT MODIFIED** - relies on backend-provided fields only
- ✅ No reversion of previous logic
- ✅ No regeneration of old broken code

#### 3. Shop IDs and Core Structure (PRESERVED)
- ✅ Shop IDs: **NOT TOUCHED**
- ✅ All existing columns: **PRESERVED**
- ✅ Indexes: **NOT MODIFIED**
- ✅ Constraints: **NOT MODIFIED**
- ✅ RLS policies: **NOT MODIFIED**

#### 4. What This Migration Does
- ✅ **ONLY ADDS**: `website_url TEXT` column
- ✅ **DOES NOT**: Modify, rename, or delete any existing columns
- ✅ **DOES NOT**: Change data types of existing columns
- ✅ **DOES NOT**: Affect any existing queries or logic

### Impact Analysis:

**Backend (`yoyakuyo-api/src/routes/shops.ts`)**:
- No changes required - new column will be automatically included in `SELECT *` queries
- Existing prefecture/city extraction logic (lines 83-84, 258-259, 281-282) remains unchanged

**Frontend (`lib/browse/shopBrowseData.ts`)**:
- No changes required - new column will be available in Shop interface but won't affect existing logic
- `extractPrefecture()` and `extractCity()` functions remain unchanged
- `buildAreaTree()` function remains unchanged

**TypeScript Types (`yoyakuyo-api/src/types/supabase.ts`)**:
- Will need to add `website_url?: string | null;` to Shop interface (separate step, not part of migration)

---

## STEP E — Ready for confirmation

### ⚠️ IMPORTANT: Migration NOT Applied Yet

The SQL migration file has been created at:
- `supabase/migrations/add_website_url_to_shops.sql`

### Next Steps (After Your Confirmation):

1. **Review the migration SQL** (shown in STEP C above)
2. **Confirm** that you want to proceed
3. **Apply the migration** using one of these methods:
   - Via Supabase Dashboard: SQL Editor → Run the migration SQL
   - Via Supabase CLI: `supabase db push` (if using local development)
   - Via migration script: Run the migration file directly

### Migration Summary:

- **File**: `supabase/migrations/add_website_url_to_shops.sql`
- **Action**: Adds `website_url TEXT` column to `shops` table
- **Safety**: Idempotent (safe to run multiple times)
- **Impact**: Zero - only adds new column, no data changes
- **Breaking Changes**: None

---

## Additional Notes

### Existing `website` Field:
- A `website` column (VARCHAR(500)) already exists from a previous migration (`add_google_places_fields.sql`)
- The new `website_url` field (TEXT) is specifically for Google Places API enrichment
- Both fields can coexist - `website` may be from manual entry, `website_url` from API enrichment

### Opening Hours:
- `opening_hours` column already exists as JSONB type
- No migration needed for this field
- Ready for Google Places API data population

---

**Status**: ✅ Ready for your confirmation to apply the migration.

