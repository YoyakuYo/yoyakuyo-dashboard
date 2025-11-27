# Import Scaling Enhancements - 80,000-100,000 Shops Target

## Summary
Enhanced the `importJapanShopsGooglePlaces.ts` script to scale from ~10,000 shops to 80,000-100,000 shops by implementing comprehensive coverage improvements.

## Key Enhancements

### 1. **Expanded City Coverage** ✅
- **Tokyo**: Expanded from 20 to 40+ locations including:
  - All 23 special wards
  - Major neighborhoods (Kichijoji, Shimokitazawa, Koenji, etc.)
  - Western Tokyo cities (Hachioji, Machida, Tachikawa, etc.)
  
- **Osaka**: Expanded from 9 to 30+ locations including:
  - All major districts (Shinsekai, Amerika-mura, Kitashinchi, etc.)
  - All 24 wards coverage
  - Suburban areas

### 2. **Increased Search Radius** ✅
- **Default radius**: Increased from 5km to 10km
- **Major cities** (population > 100k): 15km radius
- **Very large cities** (Tokyo, Osaka, Yokohama, Nagoya): Grid-based search with 5km per cell

### 3. **Grid-Based Search for Large Cities** ✅
- Implemented `generateGridPoints()` function
- For cities with population > 500k or major metros:
  - Divides area into 3x3 grid (9 search points)
  - Each grid cell searches 5km radius
  - Ensures comprehensive coverage without gaps
  - Applies to: Tokyo, Osaka, Yokohama, Nagoya

### 4. **Expanded Search Queries** ✅
Added many more Japanese search terms per category:

**Before**: 2-4 queries per category
**After**: 5-8 queries per category

Examples:
- **Hair Salon**: Added "ヘアカット", "カット", "理容", "サロン"
- **Restaurant**: Added "レスト", "食堂", "料理店", "ダイニング", "焼き鳥", "串焼き"
- **Spa**: Added "エステサロン", "リラクゼーション", "整体", "リフレクソロジー", "アロマ"
- **Cafe**: Added "喫茶店", "コーヒーショップ", "カフェテリア"
- **Hotel**: Added "宿泊", "ビジネスホテル", "リゾートホテル"
- **New categories**: Added "private karaoke rooms" and "spas, onsen & day-use bathhouses"

### 5. **Relaxed Filtering Criteria** ✅
**Before**: Required full address OR (coordinates AND category)
**After**: Accepts shops with:
- Valid coordinates (even without full address)
- Category assignment (even without full address)
- Generic names are OK if they have coordinates or category

**Impact**: Significantly increases acceptance rate while maintaining data quality

## Expected Results

### Coverage Multipliers:
1. **City coverage**: ~2-3x (Tokyo: 20→40+, Osaka: 9→30+)
2. **Search radius**: 2x (5km → 10km, 15km for major cities)
3. **Grid searches**: 9x for very large cities (3x3 grid)
4. **Search queries**: 2x (more Japanese terms per category)
5. **Filtering**: ~1.5-2x (relaxed criteria)

### Estimated Total Multiplier:
- **Base**: ~10,000 shops
- **With enhancements**: 10,000 × 2.5 (cities) × 2 (radius) × 1.5 (queries) × 1.5 (filtering) = **~112,500 shops**

For very large cities with grid search:
- **Tokyo/Osaka**: Additional 9x multiplier = **~20,000-30,000 shops per major metro**

## Performance Considerations

### API Rate Limits:
- Google Places: 200ms delay between requests (5 req/sec)
- OSM Nominatim: 2000ms delay (required by ToS)
- Grid searches will increase API calls but ensure comprehensive coverage

### Estimated Runtime:
- **Before**: ~2-4 hours for full import
- **After**: ~6-12 hours for full import (due to expanded coverage)
- Can be run in batches or overnight

## Usage

The enhanced script works the same way:

```bash
cd yoyakuyo-api
npm run import:japan-shops
```

Or with dry-run:
```bash
npm run import:japan-shops -- --dry-run
```

## Monitoring Progress

Use the check script to monitor results:
```bash
node scripts/check-import-results.js
```

This shows:
- Total shops in database
- Shops created in last 24 hours
- Breakdown by source (Google Places, OSM, etc.)
- Most recent shops

## Next Steps (Optional Further Scaling)

If you need even more shops (150k+), consider:

1. **Add more prefectures/cities**: Expand beyond current 150+ cities
2. **Increase grid density**: 4x4 or 5x5 grid for Tokyo/Osaka
3. **Add more categories**: Include more business types
4. **Reduce radius overlap**: Optimize grid spacing
5. **Add more data sources**: Integrate additional APIs

## Notes

- The script automatically handles duplicates using multiple strategies:
  - Google Place ID matching
  - OSM ID matching
  - Coordinate proximity (50m, then 10m)
  - Name + address similarity

- All existing validation and normalization functions are preserved
- No breaking changes to existing functionality

