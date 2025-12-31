-- Diagnostic Query: See actual shop names to understand why patterns aren't matching
-- Run this in Supabase SQL Editor to see sample shop names

-- See sample shop names from "Unknown" category (the 2713 shops)
SELECT 
    name,
    LENGTH(name) as name_length,
    category_id
FROM shops
WHERE category_id = (SELECT id FROM categories WHERE name = 'Unknown')
ORDER BY name
LIMIT 50;

-- See sample shop names that should match "Hair Salon" but don't
SELECT 
    name,
    category_id
FROM shops
WHERE category_id = (SELECT id FROM categories WHERE name = 'Unknown')
  AND (
    name ILIKE '%hair%' OR
    name ILIKE '%ヘア%' OR
    name ILIKE '%カット%'
  )
LIMIT 20;

-- See sample shop names that should match "Nail Salon" but don't
SELECT 
    name,
    category_id
FROM shops
WHERE category_id = (SELECT id FROM categories WHERE name = 'Unknown')
  AND (
    name ILIKE '%nail%' OR
    name ILIKE '%ネイル%' OR
    name ILIKE '%マニキュア%'
  )
LIMIT 20;

-- See sample shop names that should match "Beauty Salon" but don't
SELECT 
    name,
    category_id
FROM shops
WHERE category_id = (SELECT id FROM categories WHERE name = 'Unknown')
  AND (
    name ILIKE '%beauty%' OR
    name ILIKE '%美容%' OR
    name ILIKE '%サロン%'
  )
LIMIT 20;

-- Count shops by first few characters (to see naming patterns)
SELECT 
    LEFT(name, 10) as name_prefix,
    COUNT(*) as count
FROM shops
WHERE category_id = (SELECT id FROM categories WHERE name = 'Unknown')
GROUP BY LEFT(name, 10)
ORDER BY count DESC
LIMIT 30;

