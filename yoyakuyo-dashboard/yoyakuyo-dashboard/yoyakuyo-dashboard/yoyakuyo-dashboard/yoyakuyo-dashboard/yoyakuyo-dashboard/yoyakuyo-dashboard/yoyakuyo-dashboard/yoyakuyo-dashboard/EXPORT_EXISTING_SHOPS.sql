-- ============================================================================
-- EXPORT EXISTING SHOPS FROM SUPABASE
-- ============================================================================
-- Run this query in Supabase SQL Editor to export all shops data
-- Copy the results and save as JSON/CSV for migration preparation
-- ============================================================================

-- Export all shops with all fields
SELECT 
    id,
    name,
    address,
    phone,
    email,
    latitude,
    longitude,
    city,
    country,
    zip_code,
    website,
    description,
    category_id,
    owner_user_id,
    claim_status,
    claimed_at,
    osm_id,
    google_place_id,
    business_status,
    opening_hours,
    language_code,
    created_at,
    updated_at
FROM shops
ORDER BY created_at DESC;

-- Count total shops
SELECT COUNT(*) as total_shops FROM shops;

-- Count shops by category
SELECT 
    c.name as category_name,
    COUNT(s.id) as shop_count
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
GROUP BY c.name
ORDER BY shop_count DESC;

-- Count shops by claim status
SELECT 
    COALESCE(claim_status, 'null') as claim_status,
    COUNT(*) as count
FROM shops
GROUP BY claim_status
ORDER BY count DESC;

-- Find shops with missing required fields
SELECT 
    COUNT(*) FILTER (WHERE name IS NULL OR name = '') as missing_name,
    COUNT(*) FILTER (WHERE address IS NULL OR address = '') as missing_address,
    COUNT(*) FILTER (WHERE city IS NULL OR city = '') as missing_city,
    COUNT(*) FILTER (WHERE category_id IS NULL) as missing_category
FROM shops;

-- Find potential duplicates (same name + address + city)
SELECT 
    name,
    address,
    city,
    COUNT(*) as duplicate_count,
    array_agg(id::text) as shop_ids
FROM shops
WHERE name IS NOT NULL 
  AND address IS NOT NULL 
  AND city IS NOT NULL
GROUP BY name, address, city
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 100;

