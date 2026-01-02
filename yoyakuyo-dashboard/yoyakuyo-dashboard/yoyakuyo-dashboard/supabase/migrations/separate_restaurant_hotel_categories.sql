-- Migration: Separate Restaurants & Izakaya, Hotels & Ryokan into separate categories
-- This migration creates new separate categories and migrates existing shops

-- Step 1: Add new separate categories
INSERT INTO categories (name, description) VALUES
    ('Restaurant', 'Restaurants and dining establishments'),
    ('Izakaya', 'Japanese-style pubs and izakaya'),
    ('Hotel', 'Hotels and lodging'),
    ('Ryokan', 'Traditional Japanese inns')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Migrate existing shops from "Restaurants & Izakaya" to appropriate category
-- Try to detect izakaya vs restaurant based on name/description
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Izakaya')
WHERE category_id = (SELECT id FROM categories WHERE name = 'Restaurants & Izakaya')
  AND (
    LOWER(name) LIKE '%izakaya%' OR
    LOWER(name) LIKE '%居酒屋%' OR
    LOWER(name) LIKE '%焼き鳥%' OR
    LOWER(name) LIKE '%串焼き%' OR
    LOWER(name) LIKE '%酒場%' OR
    LOWER(name) LIKE '%yakitori%' OR
    LOWER(name) LIKE '%kushiyaki%'
  );

-- Update remaining to Restaurant
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Restaurant')
WHERE category_id = (SELECT id FROM categories WHERE name = 'Restaurants & Izakaya');

-- Step 3: Migrate existing shops from "Hotels & Ryokan" to appropriate category
-- Try to detect ryokan vs hotel based on name/description
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Ryokan')
WHERE category_id = (SELECT id FROM categories WHERE name = 'Hotels & Ryokan')
  AND (
    LOWER(name) LIKE '%ryokan%' OR
    LOWER(name) LIKE '%旅館%' OR
    LOWER(name) LIKE '%和風%' OR
    LOWER(name) LIKE '%温泉%' OR
    LOWER(name) LIKE '%民宿%' OR
    LOWER(name) LIKE '%onsen%' OR
    LOWER(name) LIKE '%minshuku%'
  );

-- Update remaining to Hotel
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Hotel')
WHERE category_id = (SELECT id FROM categories WHERE name = 'Hotels & Ryokan');

-- Step 4: Note: Old combined categories are kept in database for reference
-- They can be manually deleted later if needed, but keeping them allows
-- for rollback if necessary

