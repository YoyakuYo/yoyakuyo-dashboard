# Shop Classification Script

This script automatically classifies all shops in your Supabase database into 6 main categories using keyword matching and OpenAI for ambiguous cases.

## Prerequisites

1. **Environment Variables** - Create a `.env` file in the project root with:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENAI_API_KEY=sk-... (optional, but recommended)
   ```

2. **Dependencies** - Install required packages:
   ```bash
   npm install dotenv @supabase/supabase-js
   ```

3. **TypeScript Runner** - Install one of these to run TypeScript files:
   ```bash
   # Option 1: tsx (recommended)
   npm install -D tsx
   
   # Option 2: ts-node
   npm install -D ts-node @types/node
   ```

## How It Works

1. **Keyword Matching** (Fast, No API calls):
   - Analyzes shop name, description, category, and subcategory
   - Matches against comprehensive keyword lists (English + Japanese)
   - High confidence matches are applied immediately

2. **AI Classification** (When ambiguous):
   - Only used when keyword matching is ambiguous or finds no matches
   - Uses OpenAI GPT-4o-mini for cost-effective classification
   - Falls back to "Unknown" if AI is unavailable

3. **Category Mapping**:
   - Dynamically fetches category IDs from the `categories` table
   - Creates main categories if they don't exist
   - Updates shop `category_id` field only

## Main Categories

The script classifies shops into these 6 main categories:

1. **Beauty Services** - Hair salons, nail salons, barbershops, eyelash salons
2. **Spa, Onsen & Relaxation** - Spas, onsen, massage, relaxation services
3. **Hotels & Stays** - Hotels, ryokan, guesthouses, accommodations
4. **Dining & Izakaya** - Restaurants, izakaya, cafes, bars
5. **Clinics & Medical Care** - Dental, medical, aesthetic, wellness clinics
6. **Activities & Sports** - Golf courses, gyms, sports facilities, activities
7. **Unknown** - Fallback for unclassifiable shops

## Usage

### Option 1: Using tsx (Recommended)
```bash
npx tsx scripts/classifyShops.ts
```

### Option 2: Using ts-node
```bash
npx ts-node scripts/classifyShops.ts
```

### Option 3: Compile and Run
```bash
# Compile TypeScript
npx tsc scripts/classifyShops.ts --outDir dist --esModuleInterop --resolveJsonModule

# Run compiled JavaScript
node dist/scripts/classifyShops.js
```

## What the Script Does

1. ✅ Fetches all shops from the `shops` table
2. ✅ Loads/creates main categories in the database
3. ✅ Analyzes each shop using keyword matching
4. ✅ Uses AI for ambiguous cases (if OpenAI key is available)
5. ✅ Updates `category_id` for each shop
6. ✅ Logs all changes with old → new category mapping
7. ✅ Prints comprehensive summary report

## Safety Features

- ✅ **Read-only for shop data** - Only updates `category_id`, never deletes
- ✅ **Skips invalid shops** - Shops without names are skipped
- ✅ **Error handling** - Continues processing even if individual shops fail
- ✅ **Batch processing** - Processes shops in batches of 1000
- ✅ **Rate limiting** - Adds delays for AI API calls

## Output

The script provides:

1. **Progress updates** during processing
2. **Summary statistics**:
   - Total shops processed
   - Shops by category
   - Classification method breakdown (keyword vs AI vs fallback)
3. **Sample changes** showing old → new category mappings
4. **Error count** if any issues occurred

## Example Output

```
🚀 Starting shop classification script...

📋 Ensuring main categories exist in database...
✅ All main categories already exist
📋 Loading categories from database...
✅ Loaded 25 categories
📦 Fetching all shops from database...
📊 Processing batch: 1-1000 of 30000 shops...
   Processed 100 shops...
   Processed 200 shops...
...

================================================================================
📊 CLASSIFICATION SUMMARY
================================================================================
Total shops: 30000
Processed: 29950
Skipped (no name): 50
Errors: 0

Classification method breakdown:
  Keyword matching: 25000
  AI classification: 4500
  Fallback (Unknown): 450

Shops by category:
  Beauty Services: 8500 (28.4%)
  Dining & Izakaya: 7200 (24.0%)
  Hotels & Stays: 5500 (18.4%)
  Clinics & Medical Care: 4200 (14.0%)
  Spa, Onsen & Relaxation: 2800 (9.4%)
  Activities & Sports: 1500 (5.0%)
  Unknown: 250 (0.8%)

📝 Sample changes (first 10):
  Tokyo Hair Salon
    Old: None → New: Beauty Services (keyword)
  Osaka Restaurant
    Old: Restaurant → New: Dining & Izakaya (keyword)
  ...

✅ Classification complete!
```

## Notes

- The script is **idempotent** - you can run it multiple times safely
- It only updates shops where the category actually changes
- If a category doesn't exist, it will be created automatically
- OpenAI API key is optional but recommended for better accuracy
- Processing 30,000 shops may take 30-60 minutes depending on AI usage

## Troubleshooting

**Error: SUPABASE_SERVICE_ROLE_KEY is required**
- Make sure you're using the service role key (not the anon key)
- Service role key has admin privileges needed to update shops

**Error: No categories found**
- Run the migration first: `supabase/migrations/comprehensive_shop_categorization.sql`
- Or the script will create main categories automatically

**OpenAI API errors**
- Check your API key is valid and has credits
- The script will fall back to "Unknown" category if AI fails
- You can run without OpenAI key (less accurate but still works)

