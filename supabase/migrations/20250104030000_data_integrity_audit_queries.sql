-- ============================================================================
-- DATA INTEGRITY AUDIT - 4 TRUTH QUERIES
-- ============================================================================
-- This migration contains diagnostic queries to identify data integrity issues
-- Run these queries in Supabase SQL Editor to get the truth about your data
-- NOTE: This version works with only basic columns (no deleted_at or claim_status checks)
-- ============================================================================

-- ============================================================================
-- QUERY A: REAL FRONTEND TOTAL COUNT
-- ============================================================================
-- This counts shops that would be visible in the frontend
-- (excludes shops with NULL/empty address)
-- ============================================================================
SELECT 
    'A) REAL FRONTEND TOTAL COUNT' AS query_type,
    COUNT(*) AS shop_count
FROM shops
WHERE 
    address IS NOT NULL 
    AND address != '';

-- ============================================================================
-- QUERY B: RAW DATABASE TOTAL COUNT
-- ============================================================================
-- This counts ALL shops in the database, including duplicates, hidden, deleted
-- ============================================================================
SELECT 
    'B) RAW DATABASE TOTAL COUNT' AS query_type,
    COUNT(*) AS shop_count
FROM shops;

-- ============================================================================
-- QUERY C: CLEANED UNIQUE SHOP COUNT
-- ============================================================================
-- This counts unique shops based on:
-- 1. unique_id (if set)
-- 2. OR name + latitude + longitude (if unique_id is NULL)
-- ============================================================================
WITH unique_shops AS (
    SELECT DISTINCT ON (
        COALESCE(unique_id, 
            CONCAT(
                COALESCE(name, ''), 
                '|', 
                COALESCE(latitude::text, ''), 
                '|', 
                COALESCE(longitude::text, '')
            )
        )
    )
    id,
    name,
    unique_id,
    latitude,
    longitude,
    address
    FROM shops
    ORDER BY 
        COALESCE(unique_id, 
            CONCAT(
                COALESCE(name, ''), 
                '|', 
                COALESCE(latitude::text, ''), 
                '|', 
                COALESCE(longitude::text, '')
            )
        ),
        COALESCE(created_at, NOW()) ASC  -- Keep oldest record
)
SELECT 
    'C) CLEANED UNIQUE SHOP COUNT' AS query_type,
    COUNT(*) AS shop_count
FROM unique_shops
WHERE 
    address IS NOT NULL 
    AND address != '';

-- ============================================================================
-- QUERY D: DUPLICATE SHOP COUNT
-- ============================================================================
-- This identifies duplicate shops:
-- 1. Same unique_id (if set)
-- 2. OR same name + latitude + longitude (within 0.0001 degree tolerance)
-- ============================================================================
WITH duplicate_groups AS (
    SELECT 
        COALESCE(unique_id, 
            CONCAT(
                COALESCE(name, ''), 
                '|', 
                COALESCE(ROUND(latitude::numeric, 4)::text, ''), 
                '|', 
                COALESCE(ROUND(longitude::numeric, 4)::text, '')
            )
        ) AS duplicate_key,
        COUNT(*) AS duplicate_count
    FROM shops
    GROUP BY 
        COALESCE(unique_id, 
            CONCAT(
                COALESCE(name, ''), 
                '|', 
                COALESCE(ROUND(latitude::numeric, 4)::text, ''), 
                '|', 
                COALESCE(ROUND(longitude::numeric, 4)::text, '')
            )
        )
    HAVING COUNT(*) > 1
)
SELECT 
    'D) DUPLICATE SHOP COUNT' AS query_type,
    SUM(duplicate_count - 1) AS duplicate_shop_count,  -- Total extra duplicates
    COUNT(*) AS duplicate_group_count  -- Number of groups with duplicates
FROM duplicate_groups;

-- ============================================================================
-- ADDITIONAL DIAGNOSTIC QUERIES
-- ============================================================================

-- Check if optional columns exist (informational only)
SELECT 
    'Column Existence Check' AS query_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'deleted_at'
    ) THEN 'deleted_at EXISTS' ELSE 'deleted_at MISSING' END AS deleted_at_status,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'claim_status'
    ) THEN 'claim_status EXISTS' ELSE 'claim_status MISSING' END AS claim_status_status,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'is_visible'
    ) THEN 'is_visible EXISTS' ELSE 'is_visible MISSING' END AS is_visible_status,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'is_published'
    ) THEN 'is_published EXISTS' ELSE 'is_published MISSING' END AS is_published_status;

-- Shops with NULL or empty address
SELECT 
    'Shops with NULL or empty address' AS query_type,
    COUNT(*) AS shop_count
FROM shops
WHERE address IS NULL OR address = '';

-- Duplicate unique_id values
SELECT 
    'Duplicate unique_id values' AS query_type,
    unique_id,
    COUNT(*) AS duplicate_count
FROM shops
WHERE unique_id IS NOT NULL
GROUP BY unique_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 20;

-- Duplicate name + location (within 0.0001 degree)
SELECT 
    'Duplicate name + location groups' AS query_type,
    name,
    ROUND(latitude::numeric, 4) AS lat,
    ROUND(longitude::numeric, 4) AS lng,
    COUNT(*) AS duplicate_count
FROM shops
WHERE 
    name IS NOT NULL 
    AND latitude IS NOT NULL 
    AND longitude IS NOT NULL
    AND unique_id IS NULL
GROUP BY 
    name,
    ROUND(latitude::numeric, 4),
    ROUND(longitude::numeric, 4)
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 20;

-- Shops per category
SELECT 
    'Shops per category' AS query_type,
    c.name AS category_name,
    COUNT(s.id) AS shop_count
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id 
    AND s.address IS NOT NULL 
    AND s.address != ''
GROUP BY c.id, c.name
ORDER BY shop_count DESC;

-- Shops per prefecture
SELECT 
    'Shops per prefecture' AS query_type,
    COALESCE(prefecture, 'Unknown') AS prefecture,
    COUNT(*) AS shop_count
FROM shops
WHERE 
    address IS NOT NULL 
    AND address != ''
GROUP BY prefecture
ORDER BY shop_count DESC;

-- Restaurants specifically (for deduplication priority)
SELECT 
    'Restaurant duplicates' AS query_type,
    COUNT(*) AS total_restaurants,
    COUNT(DISTINCT COALESCE(s.unique_id, 
        CONCAT(
            COALESCE(s.name, ''), 
            '|', 
            COALESCE(ROUND(s.latitude::numeric, 4)::text, ''), 
            '|', 
            COALESCE(ROUND(s.longitude::numeric, 4)::text, '')
        )
    )) AS unique_restaurants,
    COUNT(*) - COUNT(DISTINCT COALESCE(s.unique_id, 
        CONCAT(
            COALESCE(s.name, ''), 
            '|', 
            COALESCE(ROUND(s.latitude::numeric, 4)::text, ''), 
            '|', 
            COALESCE(ROUND(s.longitude::numeric, 4)::text, '')
        )
    )) AS restaurant_duplicates
FROM shops s
JOIN categories c ON s.category_id = c.id
WHERE 
    c.name = 'Restaurant'
    AND s.address IS NOT NULL 
    AND s.address != '';
