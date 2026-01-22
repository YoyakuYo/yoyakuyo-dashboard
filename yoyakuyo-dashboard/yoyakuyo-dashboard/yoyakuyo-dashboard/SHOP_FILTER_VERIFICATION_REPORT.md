# Shop Filter Verification Report

This document explains how each of the 5 dropdown filters works and how to verify they're functioning correctly.

## Filter Overview

1. **Category** - Filters shops by business category (e.g., Barbershop, Restaurant, Spa)
2. **Region** - Filters by Japanese region (e.g., Kanto, Kansai, Tohoku)
3. **Prefecture** - Filters by Japanese prefecture (e.g., Tokyo, Osaka, Kyoto)
4. **City** - Filters by city within a prefecture (e.g., Shibuya, Chofu, Ikebukuro)
5. **Shop Status** - Filters by verification status (All Shops vs Verified Shops Only)

---

## 1. Category Filter

### How It Works:
- **Frontend**: Uses category IDs from `lib/categories.ts` (e.g., `barbershop`, `dental_clinic`)
- **Backend**: Converts frontend IDs to database UUIDs by:
  1. Looking up category slugs in the `categories` table
  2. Expanding main categories to include all subcategories
  3. Filtering shops by `category_id` using the resolved UUIDs

### Backend Implementation:
- **File**: `yoyakuyo-api/src/routes/shops.ts`
- **Lines**: 492-971
- **Key Logic**: 
  - `frontendIdToCategorySlugs()` maps frontend IDs to database slugs
  - Main categories are expanded to include subcategories
  - Only UUIDs are used in database queries (never frontend IDs)

### Verification:
```sql
-- Check category distribution
SELECT c.name, c.slug, COUNT(s.id) AS shop_count
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE s.address IS NOT NULL 
  AND s.address != ''
GROUP BY c.id, c.name, c.slug
ORDER BY shop_count DESC;
```

### Expected Behavior:
- Selecting a main category (e.g., "Beauty Services") should return shops from all subcategories
- Selecting a subcategory (e.g., "Hair Salon") should return only shops in that subcategory
- Shops without a category should appear when "Unknown" is selected

---

## 2. Region Filter

### How It Works:
- **Frontend**: Maps regions to prefectures using `lib/regions.ts`
- **Backend**: Converts region to prefectures, then applies prefecture filtering
- **Note**: Region filtering is done client-side after prefecture filtering

### Backend Implementation:
- **File**: `yoyakuyo-api/src/routes/shops.ts`
- **Lines**: 428-448
- **Key Logic**:
  - `regionToPrefectures` maps region keys to prefecture arrays
  - If both region and prefecture are selected, they are intersected
  - Prefecture patterns are then applied to shop addresses

### Verification:
```sql
-- Check prefecture distribution (Kanto region example)
SELECT prefecture, COUNT(*) AS shop_count
FROM shops
WHERE prefecture IN ('ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa')
  AND address IS NOT NULL 
  AND address != ''
GROUP BY prefecture
ORDER BY shop_count DESC;
```

### Expected Behavior:
- Selecting "Kanto" should show shops from all 7 Kanto prefectures
- Selecting a specific prefecture within a region should narrow results
- Region filter should work in combination with other filters

---

## 3. Prefecture Filter

### How It Works:
- **Frontend**: Uses prefecture keys from `lib/prefectures.ts` (e.g., `tokyo`, `osaka`)
- **Backend**: Matches prefecture patterns in shop addresses using `address.ilike` patterns
- **Database**: Uses `shops.prefecture` column if available, otherwise extracts from address

### Backend Implementation:
- **File**: `yoyakuyo-api/src/routes/shops.ts`
- **Lines**: 713-794
- **Key Logic**:
  - `prefecturePatterns` maps prefecture keys to Japanese/English patterns
  - Uses `address.ilike.%{pattern}%` for pattern matching
  - Supports multiple prefectures (comma-separated)

### Verification:
```sql
-- Check prefecture data quality
SELECT 
  COUNT(*) AS total_shops,
  COUNT(CASE WHEN prefecture IS NOT NULL THEN 1 END) AS shops_with_prefecture,
  ROUND(100.0 * COUNT(CASE WHEN prefecture IS NOT NULL THEN 1 END) / COUNT(*), 2) AS coverage_pct
FROM shops
WHERE address IS NOT NULL AND address != '';
```

### Expected Behavior:
- Selecting "Tokyo" should return shops with addresses containing "東京", "tokyo", or "東京都"
- Prefecture filter should work independently or in combination with other filters
- Shops without prefecture data should be excluded from filtered results

---

## 4. City Filter

### How It Works:
- **Frontend**: Fetches cities from `/cities?prefecture_name={prefecture}` API
- **Backend**: Uses `city_id` (UUID) to look up city names/slugs from `cities` table
- **Matching**: Matches city names and slugs in shop addresses using `address.ilike` patterns

### Backend Implementation:
- **File**: `yoyakuyo-api/src/routes/shops.ts`
- **Lines**: 795-851
- **Key Logic**:
  1. Validates `city_id` UUIDs
  2. Fetches city names and slugs from `cities` table
  3. Builds `address.ilike.%{city_name}%` and `address.ilike.%{city_slug}%` patterns
  4. Uses `.or()` to match any of the patterns

### Verification:
```sql
-- Check city data quality
SELECT 
  COUNT(*) AS total_shops,
  COUNT(CASE WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN 1 END) AS shops_with_city,
  ROUND(100.0 * COUNT(CASE WHEN normalized_city IS NOT NULL AND normalized_city != '' THEN 1 END) / COUNT(*), 2) AS coverage_pct
FROM shops
WHERE address IS NOT NULL AND address != '';

-- Verify city matching (Shibuya example)
SELECT s.id, s.name, s.address, s.normalized_city, c.name AS city_table_name, c.slug AS city_table_slug
FROM shops s
LEFT JOIN cities c ON LOWER(s.normalized_city) = LOWER(c.name) OR LOWER(s.normalized_city) = LOWER(c.slug)
WHERE (s.address ILIKE '%渋谷%' OR s.address ILIKE '%shibuya%')
  AND s.prefecture = 'tokyo'
LIMIT 10;
```

### Expected Behavior:
- City dropdown should only appear after a prefecture is selected
- Selecting a city should filter shops by matching city name/slug in address
- City filter should work in combination with prefecture, category, and status filters

---

## 5. Shop Status (is_verified) Filter

### How It Works:
- **Frontend**: Dropdown with "All Shops" and "Verified Shops Only" options
- **Backend**: Filters by `shops.is_verified` boolean column
- **Database**: Direct boolean filter using `.eq("is_verified", true)` or `.eq("is_verified", false)`

### Backend Implementation:
- **File**: `yoyakuyo-api/src/routes/shops.ts`
- **Lines**: 853-860
- **Key Logic**:
  - If `is_verified === 'true'`: `query.eq("is_verified", true)`
  - If `is_verified === 'false'`: `query.eq("is_verified", false)`
  - If not provided: No filter applied (shows all shops)

### Verification:
```sql
-- Check verification status distribution
SELECT 
  COUNT(*) AS total_shops,
  COUNT(CASE WHEN is_verified = true THEN 1 END) AS verified_shops,
  COUNT(CASE WHEN is_verified = false OR is_verified IS NULL THEN 1 END) AS unverified_shops,
  ROUND(100.0 * COUNT(CASE WHEN is_verified = true THEN 1 END) / COUNT(*), 2) AS verified_percentage
FROM shops
WHERE address IS NOT NULL AND address != '';
```

### Expected Behavior:
- "All Shops" should return both verified and unverified shops
- "Verified Shops Only" should return only shops where `is_verified = true`
- Status filter should work in combination with all other filters

---

## Combined Filter Testing

### Test Case: Barbershop in Tokyo, Shibuya, Verified
```sql
SELECT s.id, s.name, s.address, s.prefecture, s.normalized_city, s.is_verified, c.name AS category_name
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE s.prefecture = 'tokyo'
  AND (s.address ILIKE '%渋谷%' OR s.address ILIKE '%shibuya%' OR s.normalized_city ILIKE '%渋谷%' OR s.normalized_city ILIKE '%shibuya%')
  AND s.is_verified = true
  AND (c.slug = 'barbershop' OR c.slug = 'barber_shop')
  AND s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status != 'hidden');
```

### Expected Behavior:
- All filters should work together (AND logic)
- Results should match all selected criteria
- No shops should be returned if no shops match all criteria

---

## Filter Coverage Summary

Run the verification script `verify_all_shop_filters.sql` to check:
- Category coverage: % of shops with category_id
- Prefecture coverage: % of shops with prefecture data
- City coverage: % of shops with normalized_city
- Verification status: % of shops with is_verified set
- Complete coverage: % of shops with all filter data available

---

## Common Issues and Fixes

### Issue 1: Category filter returns 0 shops
- **Cause**: Frontend ID not mapped to database UUID
- **Fix**: Check `frontendIdToCategorySlugs()` mapping in `shops.ts`

### Issue 2: City filter doesn't match shops
- **Cause**: City name/slug not in shop address or `normalized_city` is NULL
- **Fix**: Run `advanced_populate_normalized_city.sql` or `fix_missing_postal_codes_and_extract_cities.sql`

### Issue 3: Prefecture filter returns wrong shops
- **Cause**: Prefecture patterns not matching address format
- **Fix**: Check `prefecturePatterns` mapping in `shops.ts` and ensure addresses contain prefecture names

### Issue 4: Verified filter shows unverified shops
- **Cause**: `is_verified` column is NULL instead of false
- **Fix**: Update shops to explicitly set `is_verified = false` for unverified shops

---

## Next Steps

1. Run `verify_all_shop_filters.sql` to check data quality
2. Test each filter individually in the frontend
3. Test filter combinations
4. Verify filter counts match expected results
5. Check API logs for filter application messages (✅ Applied ... filter)

