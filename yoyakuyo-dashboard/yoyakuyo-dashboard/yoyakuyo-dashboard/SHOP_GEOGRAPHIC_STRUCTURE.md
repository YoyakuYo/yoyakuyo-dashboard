# Shop Geographic Structure: City → Prefecture → Region

## Overview

Shops in the system are organized hierarchically:
```
Region (8 regions of Japan)
  └── Prefecture (47 prefectures)
      └── City (many cities/wards)
          └── Shop
```

## Database Structure

### 1. **Shops Table** (`shops`)

The `shops` table contains the following geographic fields:

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `address` | TEXT | Full address string (e.g., "1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0001") | Primary source |
| `prefecture` | TEXT | Prefecture key (e.g., "tokyo", "osaka") | Extracted from `address` |
| `normalized_city` | TEXT | Normalized city name (e.g., "Shibuya") | Extracted from `address` |
| `city` | TEXT | City name (nullable, legacy) | Extracted from `address` |
| `city_id` | UUID | Foreign key to `cities` table | Optional reference |

**Key Points:**
- **Primary source**: `address` field contains the full address string
- `prefecture`` and `normalized_city` are **extracted** from `address` (not always populated)
- `city_id` is an **optional** foreign key reference to the `cities` table
- Most filtering happens by **matching patterns in the `address` field**

### 2. **Cities Table** (`cities`)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | City name (e.g., "渋谷区", "Shibuya") |
| `slug` | VARCHAR(255) | URL-friendly identifier (e.g., "shibuya") |
| `prefecture_name` | VARCHAR(255) | Prefecture name (e.g., "Tokyo") |

**Purpose:**
- Provides a normalized list of cities
- Used for city dropdown filtering
- `shops.city_id` can reference this table (optional)

### 3. **Regions & Prefectures**

**Regions** (8 regions):
- Defined in `lib/regions.ts` (frontend only, not in database)
- Examples: Hokkaido, Kanto, Kansai, etc.
- Each region contains multiple prefectures

**Prefectures** (47 prefectures):
- Defined in `lib/prefectures.ts` (frontend only, not in database)
- Examples: Tokyo, Osaka, Kyoto, etc.
- Each prefecture belongs to one region

## Data Flow & Filtering

### How Shops Are Filtered

1. **Region Filter**:
   - Frontend: User selects a region (e.g., "Kanto")
   - Backend: Maps region to prefecture keys (e.g., ["tokyo", "kanagawa", "chiba", ...])
   - Query: Matches prefecture patterns in `address` field

2. **Prefecture Filter**:
   - Frontend: User selects a prefecture (e.g., "Tokyo")
   - Backend: Uses prefecture key (e.g., "tokyo")
   - Query: Matches prefecture patterns in `address` field using patterns like:
     - `address.ilike.%東京%`
     - `address.ilike.%tokyo%`
     - `address.ilike.%東京都%`

3. **City Filter**:
   - Frontend: User selects a city (sends `city_id` UUID)
   - Backend: 
     - Fetches city `name` and `slug` from `cities` table
     - Matches city name/slug in shop `address` field
   - Query: `address.ilike.%{city_name}%` OR `address.ilike.%{city_slug}%`

### Current Implementation

**Backend (`yoyakuyo-api/src/routes/shops.ts`):**

```typescript
// Prefecture filtering
if (prefectures.length > 0) {
  // Maps prefecture keys to Japanese/English patterns
  const prefecturePatterns = {
    'tokyo': ['東京', 'tokyo', '東京都'],
    'osaka': ['大阪', 'osaka', '大阪府'],
    // ... all 47 prefectures
  };
  // Matches patterns in address field
  query = query.or(allPatterns.join(','));
}

// City filtering (by city_id)
if (cityIds.length > 0) {
  // 1. Fetch city names from cities table
  const cityData = await supabase
    .from("cities")
    .select("id, name, slug")
    .in("id", validCityIds);
  
  // 2. Match city names/slugs in address field
  const cityNamePatterns = cityNames.map(name => `address.ilike.%${name}%`);
  query = query.or(cityNamePatterns.join(','));
}
```

**Frontend (`app/categories/[categoryId]/page.tsx`):**

```typescript
// City dropdown is populated from cities table
const { data: cities } = await fetch(`${apiUrl}/cities?prefecture_name=${filters.prefecture}`);

// When city is selected, sends city_id to backend
if (filters.city !== 'all') {
  params.set('city_id', filters.city); // UUID from cities table
}
```

## Example Shop Record

```json
{
  "id": "uuid-here",
  "name": "Barber Shop Example",
  "address": "1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0001, Japan",
  "prefecture": "tokyo",           // Extracted from address
  "normalized_city": "Shibuya",    // Extracted from address
  "city": null,                    // Legacy field (nullable)
  "city_id": "city-uuid-here"      // Optional reference to cities table
}
```

## Hierarchy Example

```
Region: Kanto (関東)
  └── Prefecture: Tokyo (東京都)
      └── City: Shibuya (渋谷区)
          └── Shop: "Barber Shop Example"
              Address: "1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0001"
```

## Key Insights

1. **Address is Primary**: The `address` field is the main source of geographic data
2. **Extraction-Based**: Prefecture and city are extracted from address, not always stored separately
3. **Pattern Matching**: Filtering uses pattern matching in the `address` field
4. **Cities Table is Reference**: The `cities` table provides normalized city names for dropdowns, but filtering still matches in `address`
5. **No Region Column**: Regions are not stored in the database; they're derived from prefectures in the frontend

## Filtering Flow

```
User selects Region "Kanto"
  ↓
Frontend maps to prefectures: ["tokyo", "kanagawa", "chiba", ...]
  ↓
Backend matches prefecture patterns in address field
  ↓
User selects Prefecture "Tokyo"
  ↓
Backend matches "東京", "tokyo", "東京都" in address field
  ↓
User selects City "Shibuya" (city_id)
  ↓
Backend fetches city name "渋谷区" from cities table
  ↓
Backend matches "渋谷区" or "Shibuya" in address field
  ↓
Returns filtered shops
```

