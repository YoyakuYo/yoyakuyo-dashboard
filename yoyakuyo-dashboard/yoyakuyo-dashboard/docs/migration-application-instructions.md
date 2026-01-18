# Migration Application Instructions

## Migration: Add website_url to shops table

### Status
✅ **Migration file created**: `supabase/migrations/add_website_url_to_shops.sql`  
⚠️ **Requires manual application** (Supabase security prevents automated ALTER TABLE)

---

## SQL to Execute

```sql
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN shops.website_url IS 'Website URL from Google Places API enrichment (TEXT type for flexibility)';
```

---

## How to Apply

### Method 1: Supabase Dashboard (Recommended - Easiest)

1. **Open Supabase Dashboard SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/neguwrjykwnfhdlwktpd/sql/new
   - Or navigate: Dashboard → SQL Editor → New Query

2. **Paste the SQL** (shown above)

3. **Click "Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verify**:
   - You should see: "Success. No rows returned"
   - The column has been added

---

### Method 2: Supabase CLI

If you have Supabase CLI installed:

```bash
cd supabase
supabase db push
```

This will apply all pending migrations in the `supabase/migrations/` folder.

---

### Method 3: Direct psql Connection

If you have direct PostgreSQL access:

```bash
psql "<your-connection-string>" -f supabase/migrations/add_website_url_to_shops.sql
```

To get your connection string:
1. Go to Supabase Dashboard → Settings → Database
2. Copy the "Connection string" (URI format)
3. Use it in the psql command above

---

## Verification

After applying, verify the column exists:

**Via Supabase Dashboard**:
1. Go to: Table Editor → shops table
2. Check if `website_url` column appears in the column list

**Via SQL Query**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shops' AND column_name = 'website_url';
```

Expected result: Should return one row with `website_url` and `text` data type.

---

## Safety Notes

✅ **Idempotent**: Uses `IF NOT EXISTS` - safe to run multiple times  
✅ **Non-breaking**: Only adds a new column, doesn't modify existing data  
✅ **Nullable**: Column is nullable, so no data migration needed  
✅ **No impact**: Existing queries and logic continue to work unchanged

---

## What Was Updated

### Database
- ✅ Migration file created: `supabase/migrations/add_website_url_to_shops.sql`

### TypeScript Types
- ✅ Updated `yoyakuyo-api/src/types/supabase.ts`:
  - Added `website_url?: string | null;` to Shop interface
  - Added `opening_hours?: any | null;` to Shop interface (already exists in DB)

### No Changes To
- ✅ `prefecture` column - preserved
- ✅ `normalized_city` column - preserved  
- ✅ Backend extraction logic - preserved
- ✅ Frontend browse logic - preserved
- ✅ All existing functionality - preserved

---

## Next Steps

1. **Apply the migration** using one of the methods above
2. **Verify** the column exists
3. **Proceed** with Google Places API enrichment implementation

The migration is ready and safe to apply. All previous fixes remain intact.

