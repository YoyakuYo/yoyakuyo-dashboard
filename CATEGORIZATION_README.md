# Comprehensive Shop Categorization

This migration categorizes all 30,000+ shops in your database by matching shop names and descriptions to appropriate categories.

## Overview

The migration script (`20251202200620_comprehensive_shop_categorization.sql`) will:

1. **Expand Categories Table**: Adds all necessary categories including:
   - Beauty Services (Nail Salon, Hair Salon, Barbershop, Eyelash, Beauty Salon)
   - Spa, Onsen & Relaxation (Spa & Massage, Onsen, Ryokan, Relaxation)
   - Hotels & Stays (Hotel, Ryokan Stay, Guesthouse, Boutique Hotel)
   - Dining & Izakaya (Restaurant, Izakaya, Cafe, Bar)
   - Clinics & Medical Care (Dental Clinic, Medical Clinic, Aesthetic Clinic, Women's Clinic, Wellness Clinic)
   - Activities & Sports (Golf Course, Sports Facility, Activity Center, Indoor/Outdoor Sports)

2. **Categorize Shops**: Uses intelligent pattern matching on:
   - Shop names (English and Japanese)
   - Shop descriptions (English and Japanese)
   - Handles both languages with comprehensive keyword matching

3. **Order of Matching**: Categories are matched in order of specificity:
   - Most specific categories first (e.g., Eyelash, Nail Salon)
   - General categories last (e.g., General Salon, Unknown)

## How to Run

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20251202200620_comprehensive_shop_categorization.sql`
4. Copy and paste the entire SQL script
5. Click **Run** to execute

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the project root
cd /path/to/bookyo

# Apply the migration
supabase db push

# Or apply a specific migration
supabase migration up 20251202200620_comprehensive_shop_categorization
```

### Option 3: Using npm migrate:auto (if configured)

```bash
npm run migrate:auto
```

**Note**: The `migrate:auto` command will detect schema changes. Since this is a data migration (not schema), you may need to run it manually via SQL Editor.

## Verification

After running the migration, verify the results by running this query in Supabase SQL Editor:

```sql
SELECT 
    c.name AS category_name,
    COUNT(s.id) AS shop_count,
    ROUND(COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM shops), 2) AS percentage
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
GROUP BY c.id, c.name
ORDER BY shop_count DESC;
```

This will show you:
- How many shops are in each category
- The percentage distribution
- Categories sorted by shop count

## Expected Results

After categorization, you should see:
- Most shops properly categorized (not in "Unknown")
- Distribution across all 6 main category groups
- Shops matched based on their names and descriptions

## Important Notes

1. **Backup First**: Consider backing up your database before running this migration, especially if you have existing category assignments you want to preserve.

2. **Reset Option**: The migration includes a commented-out line to reset all category assignments. Uncomment it if you want to re-categorize all shops from scratch:
   ```sql
   -- UPDATE shops SET category_id = NULL;
   ```

3. **Performance**: This migration processes all shops in the database. For 30,000+ shops, it may take a few minutes to complete.

4. **Language Support**: The script handles both English and Japanese keywords, so shops with Japanese names will be properly categorized.

## Troubleshooting

If some shops remain uncategorized:
1. Check the "Unknown" category count
2. Review shop names/descriptions that didn't match
3. Add additional patterns to the migration script if needed
4. Re-run the migration after adding patterns

## Next Steps

After categorization:
1. Review the category distribution
2. Update any shops that were incorrectly categorized
3. Consider adding more specific patterns for your most common shop types
4. Update your frontend to display shops by these categories

