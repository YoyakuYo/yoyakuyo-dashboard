# Category System Rebuild - Complete Guide

This guide explains how to rebuild the category system in Supabase to match the final structure.

## 📋 Final Category Structure

### Main Categories (7):
1. **Beauty Services** - Hair salons, nail salons, barbershops, eyelash salons
2. **Spa, Onsen & Relaxation** - Spas, onsen (hot springs), massage, relaxation
3. **Hotels & Stays** - Hotels, ryokan, guesthouses, accommodations
4. **Dining & Izakaya** - Restaurants, izakaya, karaoke
5. **Clinics & Medical Care** - Dental, eye, women's, wellness clinics
6. **Activities & Sports** - Golf, pilates, yoga, sports facilities
7. **Unknown** - Uncategorized shops

### Subcategories (26):
- **Beauty Services**: Hair Salon, Nail Salon, Eyelash / Eyebrow, Beauty Salon, General Salon, Barbershop, Waxing
- **Spa, Onsen & Relaxation**: Spa, Massages, Onsen, Ryokan Onsen
- **Hotels & Stays**: Hotel, Boutique Hotel, Guest House, Ryokan Stay
- **Dining & Izakaya**: Restaurant, Izakaya, Karaoke
- **Clinics & Medical Care**: Dental Clinic, Eye Clinic, Women's Clinic, Wellness Clinic
- **Activities & Sports**: Golf, Golf Practice Range, Pilates, Yoga

## 🚀 Two Methods to Rebuild

### Method 1: SQL Migration (Recommended)

**File**: `supabase/migrations/20251202220000_rebuild_category_system.sql`

**Steps**:
1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase/migrations/20251202220000_rebuild_category_system.sql`
3. Paste into SQL Editor
4. Click "Run" to execute
5. Wait for completion (may take several minutes for 30,000+ shops)
6. Check the verification queries at the end

**What it does**:
- ✅ Backs up shops table to `shops_backup`
- ✅ Creates/renames categories (preserves UUIDs when possible)
- ✅ Reassigns all shops to correct new categories
- ✅ Deletes old categories not in final structure
- ✅ Provides verification queries

**Advantages**:
- Fast execution (single transaction)
- Atomic operation (all or nothing)
- Built-in verification queries
- No TypeScript dependencies needed

### Method 2: TypeScript Script

**File**: `scripts/reclassifyCategories.ts`

**Prerequisites**:
```bash
npm install -D tsx dotenv
```

**Environment Variables** (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Run**:
```bash
npm run reclassify-categories
```

**What it does**:
- ✅ Connects to Supabase
- ✅ Ensures all final categories exist (creates/renames)
- ✅ Reassigns all shops using mapping rules
- ✅ Deletes old categories
- ✅ Generates verification report
- ✅ Saves change log to `category_reclassification_log.json`

**Advantages**:
- More detailed logging
- Change log file for audit trail
- Can be run multiple times safely
- Better error handling

## 🔍 How UUID Preservation Works

**Critical**: The migration preserves UUIDs by **renaming** existing categories instead of creating new ones.

**Example**:
- Old category: `"Hair Salon"` (UUID: `abc-123`)
- New category: `"Beauty Services"` (UUID: `abc-123` ← **same UUID**)
- All shops with `category_id = abc-123` remain linked ✅

**Why this matters**:
- If new UUIDs were created, all existing shops would lose their category links
- Category counts would show 0
- Stat API would return empty results

## 📊 Verification

After running either method, verify the results:

### SQL Verification (included in migration):
```sql
-- Main categories
SELECT 
    c.name AS category_name,
    COUNT(s.id) AS shop_count,
    ROUND(COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM shops WHERE category_id IS NOT NULL), 2) AS percentage
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
WHERE c.name IN (
    'Beauty Services',
    'Spa, Onsen & Relaxation',
    'Hotels & Stays',
    'Dining & Izakaya',
    'Clinics & Medical Care',
    'Activities & Sports',
    'Unknown'
)
GROUP BY c.id, c.name
ORDER BY shop_count DESC;
```

### Expected Results:
- **Beauty Services**: ~9,000+ shops
- **Spa, Onsen & Relaxation**: ~X shops
- **Hotels & Stays**: ~X shops
- **Dining & Izakaya**: ~X shops
- **Clinics & Medical Care**: ~X shops
- **Activities & Sports**: ~X shops
- **Unknown**: ~X shops (should be minimal)

## 🔧 Stat API

The Stat API (`/categories/stats`) automatically works after the migration because:
- It queries by `category_id` (UUID)
- UUIDs are preserved during migration
- No code changes needed ✅

**Test the API**:
```bash
curl https://your-api-url/categories/stats
```

**Expected Response**:
```json
{
  "uuid-1": 9037,  // Beauty Services
  "uuid-2": 1234,  // Spa, Onsen & Relaxation
  "uuid-3": 567,   // Hotels & Stays
  ...
  "all": 30000
}
```

## 🗺️ Mapping Rules

The migration uses these rules to reassign shops:

| Old Category Name | New Main Category |
|------------------|-------------------|
| Hair Salon, Nail Salon, Barbershop, etc. | Beauty Services |
| Spa, Massage, Onsen, Ryokan | Spa, Onsen & Relaxation |
| Hotel, Guesthouse, Ryokan Stay | Hotels & Stays |
| Restaurant, Izakaya, Karaoke | Dining & Izakaya |
| Dental Clinic, Eye Clinic, etc. | Clinics & Medical Care |
| Golf, Pilates, Yoga, Sports | Activities & Sports |
| (anything else) | Unknown |

## ⚠️ Important Notes

1. **Backup**: The SQL migration creates `shops_backup` table automatically
2. **No Data Loss**: Shops are reassigned, never deleted
3. **Rollback**: If needed, restore from `shops_backup`:
   ```sql
   UPDATE shops SET category_id = (SELECT category_id FROM shops_backup WHERE shops_backup.id = shops.id);
   ```
4. **Hidden Shops**: Shops with `claim_status = 'hidden'` are excluded from public stats
5. **Performance**: Migration may take 5-10 minutes for 30,000+ shops

## 🐛 Troubleshooting

### Issue: All categories show 0 shops
**Solution**: Check if UUIDs match between categories and shops:
```sql
SELECT c.name, COUNT(s.id) 
FROM categories c 
LEFT JOIN shops s ON s.category_id = c.id 
GROUP BY c.name;
```

### Issue: Migration fails with foreign key error
**Solution**: Ensure no other tables reference `categories.id` with strict foreign keys

### Issue: TypeScript script fails to connect
**Solution**: Verify `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Issue: Stat API returns empty object
**Solution**: Check API logs, ensure categories exist, verify `category_id` is not NULL in shops

## 📝 Files Generated

After running the TypeScript script:
- `category_reclassification_log.json` - Full audit log of all changes

## ✅ Success Criteria

After migration, you should see:
- ✅ 7 main categories exist in database
- ✅ 26 subcategories exist in database
- ✅ All shops have `category_id` assigned
- ✅ Category counts match expected numbers
- ✅ Stat API returns correct counts
- ✅ Frontend displays correct category counts

## 🎯 Next Steps

1. Run the migration (SQL or TypeScript)
2. Verify results using verification queries
3. Test Stat API endpoint
4. Check frontend category counts
5. If all looks good, you're done! ✅

---

**Questions?** Check the migration file comments or the TypeScript script logs for detailed information.

