-- ============================================================================
-- FINALIZE CATEGORIES CLEANUP - Reassign Remaining Old Subcategories
-- Keep Karaoke as a subcategory, remove Bar references
-- ============================================================================

-- ============================================================================
-- STEP 1: Create/Update Karaoke Category
-- ============================================================================

-- Create Karaoke category if it doesn't exist
INSERT INTO categories (name, description)
VALUES ('Karaoke', 'Private karaoke rooms and karaoke establishments')
ON CONFLICT (name) DO NOTHING;

-- Update shops from "Private Karaoke Rooms" to "Karaoke"
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Karaoke')
WHERE category_id IN (
    SELECT id FROM categories WHERE name = 'Private Karaoke Rooms'
);

-- ============================================================================
-- STEP 2: Reassign Other Old Subcategories to Main Categories
-- ============================================================================

-- Hotels & Ryokan → Hotels & Stays
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Hotels & Stays')
WHERE category_id IN (
    SELECT id FROM categories WHERE name = 'Hotels & Ryokan'
);

-- Spas, Onsen & Day-use Bathhouses → Spa, Onsen & Relaxation
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Spa, Onsen & Relaxation')
WHERE category_id IN (
    SELECT id FROM categories WHERE name = 'Spas, Onsen & Day-use Bathhouses'
);

-- Golf Courses & Practice Ranges → Activities & Sports
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Activities & Sports')
WHERE category_id IN (
    SELECT id FROM categories WHERE name = 'Golf Courses & Practice Ranges'
);

-- Restaurants & Izakaya → Dining & Izakaya
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Dining & Izakaya')
WHERE category_id IN (
    SELECT id FROM categories WHERE name = 'Restaurants & Izakaya'
);

-- Izakaya & Bar → Create/Update to just "Izakaya" (remove Bar)
INSERT INTO categories (name, description)
VALUES ('Izakaya', 'Japanese casual dining and drinking establishments')
ON CONFLICT (name) DO NOTHING;

-- Update shops from "Izakaya & Bar" to "Izakaya"
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Izakaya')
WHERE category_id IN (
    SELECT id FROM categories WHERE name = 'Izakaya & Bar'
);

-- ============================================================================
-- STEP 3: Delete Old Subcategory Entries (Keep Karaoke and Izakaya)
-- ============================================================================

DELETE FROM categories
WHERE name IN (
    'Private Karaoke Rooms',
    'Hotels & Ryokan',
    'Spas, Onsen & Day-use Bathhouses',
    'Golf Courses & Practice Ranges',
    'Restaurants & Izakaya',
    'Izakaya & Bar'
)
AND name NOT IN (
    -- Keep the 6 main categories + subcategories we want to keep
    'Beauty Services',
    'Spa, Onsen & Relaxation',
    'Hotels & Stays',
    'Dining & Izakaya',
    'Clinics & Medical Care',
    'Activities & Sports',
    'Karaoke',
    'Izakaya',
    'Unknown'
);

-- ============================================================================
-- STEP 4: Final Report
-- ============================================================================

-- Show final category distribution (main categories + subcategories)
SELECT 
    c.name AS category_name,
    COUNT(s.id) AS shop_count,
    ROUND(COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM shops), 2) AS percentage
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
WHERE c.name IN (
    'Beauty Services',
    'Spa, Onsen & Relaxation',
    'Hotels & Stays',
    'Dining & Izakaya',
    'Clinics & Medical Care',
    'Activities & Sports',
    'Karaoke',
    'Izakaya',
    'Restaurant',
    'Hotel',
    'Spa & Massage',
    'Onsen & Ryokan',
    'Hair Salon',
    'Nail Salon',
    'Barber Shop',
    'Eyelash & Eyebrow',
    'Aesthetic Clinic',
    'Dental Clinic',
    'Golf',
    'Unknown'
)
OR c.name LIKE '%Women%'
GROUP BY c.id, c.name
ORDER BY shop_count DESC;

-- Show total shop count
SELECT 
    COUNT(*) AS total_shops,
    COUNT(category_id) AS shops_with_category,
    COUNT(*) - COUNT(category_id) AS shops_without_category
FROM shops;

