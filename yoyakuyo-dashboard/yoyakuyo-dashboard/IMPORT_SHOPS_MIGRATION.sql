-- ============================================================================
-- BULK IMPORT SHOPS MIGRATION SCRIPT
-- ============================================================================
-- This script imports shops from external datasets into Supabase
-- Features:
--   - Auto-generates UUIDs for new shops
--   - Skips duplicates based on name + address + city
--   - Sets owner_user_id = NULL for scraped shops
--   - Auto-links categories by name or creates missing categories
--   - Handles missing optional fields gracefully
-- ============================================================================
-- 
-- USAGE:
--   1. Replace the VALUES section below with your actual shop data
--   2. Run this script in Supabase SQL Editor
--   3. The script will automatically handle duplicates and categories
--
-- DATA FORMAT:
--   Each shop should be in format:
--   (name, address, city, country, zip_code, phone, email, website, 
--    latitude, longitude, category_name, osm_id, google_place_id)
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: CREATE TEMPORARY TABLE FOR IMPORT DATA
-- ============================================================================

CREATE TEMPORARY TABLE temp_shop_import (
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(255),
    country VARCHAR(255) DEFAULT 'Japan',
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(500),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    category_name VARCHAR(255),
    osm_id TEXT,
    google_place_id VARCHAR(255),
    description TEXT,
    language_code VARCHAR(10) DEFAULT 'ja'
);

-- ============================================================================
-- STEP 2: INSERT YOUR SHOP DATA HERE
-- ============================================================================
-- Replace this section with your actual shop data
-- Example format (remove this and add your data):

/*
INSERT INTO temp_shop_import (name, address, city, country, zip_code, phone, email, website, latitude, longitude, category_name, osm_id, google_place_id, description) VALUES
('Shop Name 1', '123 Main St', 'Tokyo', 'Japan', '100-0001', '03-1234-5678', 'shop1@example.com', 'https://shop1.com', 35.6762, 139.6503, 'Hair Salon', '12345678', NULL, 'Description here'),
('Shop Name 2', '456 Oak Ave', 'Osaka', 'Japan', '530-0001', '06-9876-5432', 'shop2@example.com', 'https://shop2.com', 34.6937, 135.5023, 'Nail Salon', NULL, 'ChIJ...', NULL);
-- Add more rows as needed...
*/

-- ============================================================================
-- STEP 3: ENSURE ALL CATEGORIES EXIST
-- ============================================================================

-- Create missing categories from import data
INSERT INTO categories (name, description)
SELECT DISTINCT 
    category_name,
    'Auto-created during bulk import'
FROM temp_shop_import
WHERE category_name IS NOT NULL
  AND category_name NOT IN (SELECT name FROM categories)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 4: REMOVE DUPLICATES (BASED ON name + address + city)
-- ============================================================================

-- Create a temporary table with only unique shops (removing duplicates)
CREATE TEMPORARY TABLE temp_shop_unique AS
SELECT DISTINCT ON (name, address, city)
    *
FROM temp_shop_import
WHERE name IS NOT NULL
ORDER BY name, address, city, 
    -- Prefer records with more complete data
    CASE 
        WHEN phone IS NOT NULL AND email IS NOT NULL THEN 1
        WHEN phone IS NOT NULL OR email IS NOT NULL THEN 2
        ELSE 3
    END;

-- ============================================================================
-- STEP 5: FILTER OUT SHOPS THAT ALREADY EXIST
-- ============================================================================

-- Remove shops that already exist in the database
CREATE TEMPORARY TABLE temp_shop_new AS
SELECT t.*
FROM temp_shop_unique t
WHERE NOT EXISTS (
    SELECT 1 
    FROM shops s
    WHERE LOWER(TRIM(s.name)) = LOWER(TRIM(t.name))
      AND (
          (s.address IS NOT NULL AND t.address IS NOT NULL 
           AND LOWER(TRIM(s.address)) = LOWER(TRIM(t.address)))
          OR (s.city IS NOT NULL AND t.city IS NOT NULL 
              AND LOWER(TRIM(s.city)) = LOWER(TRIM(t.city)))
      )
);

-- ============================================================================
-- STEP 6: INSERT NEW SHOPS
-- ============================================================================

INSERT INTO shops (
    id,
    name,
    address,
    city,
    country,
    zip_code,
    phone,
    email,
    website,
    latitude,
    longitude,
    category_id,
    owner_user_id,
    claim_status,
    osm_id,
    google_place_id,
    description,
    language_code,
    created_at,
    updated_at
)
SELECT 
    uuid_generate_v4() as id,
    t.name,
    t.address,
    t.city,
    COALESCE(t.country, 'Japan') as country,
    t.zip_code,
    t.phone,
    t.email,
    t.website,
    t.latitude,
    t.longitude,
    c.id as category_id,
    NULL as owner_user_id,  -- Scraped shops have no owner
    'unclaimed' as claim_status,
    t.osm_id,
    t.google_place_id,
    t.description,
    COALESCE(t.language_code, 'ja') as language_code,
    NOW() as created_at,
    NOW() as updated_at
FROM temp_shop_new t
LEFT JOIN categories c ON c.name = t.category_name
WHERE t.name IS NOT NULL AND t.name != '';

-- ============================================================================
-- STEP 7: SUMMARY REPORT
-- ============================================================================

DO $$
DECLARE
    total_imported INTEGER;
    total_duplicates INTEGER;
    total_inserted INTEGER;
    total_skipped INTEGER;
BEGIN
    -- Count totals
    SELECT COUNT(*) INTO total_imported FROM temp_shop_import;
    SELECT COUNT(*) INTO total_duplicates FROM temp_shop_unique;
    SELECT COUNT(*) INTO total_inserted FROM temp_shop_new;
    total_skipped := total_imported - total_inserted;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'IMPORT SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total records in import: %', total_imported;
    RAISE NOTICE 'Unique records (after dedupe): %', total_duplicates;
    RAISE NOTICE 'New shops inserted: %', total_inserted;
    RAISE NOTICE 'Skipped (duplicates): %', total_skipped;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- STEP 8: CLEANUP
-- ============================================================================

DROP TABLE IF EXISTS temp_shop_import;
DROP TABLE IF EXISTS temp_shop_unique;
DROP TABLE IF EXISTS temp_shop_new;

-- ============================================================================
-- VERIFICATION QUERIES (Run after import)
-- ============================================================================

-- Count total shops
-- SELECT COUNT(*) as total_shops FROM shops;

-- Count shops by category
-- SELECT c.name, COUNT(s.id) as count
-- FROM shops s
-- LEFT JOIN categories c ON s.category_id = c.id
-- GROUP BY c.name
-- ORDER BY count DESC;

-- Count unclaimed shops
-- SELECT COUNT(*) as unclaimed_shops 
-- FROM shops 
-- WHERE owner_user_id IS NULL AND claim_status = 'unclaimed';

