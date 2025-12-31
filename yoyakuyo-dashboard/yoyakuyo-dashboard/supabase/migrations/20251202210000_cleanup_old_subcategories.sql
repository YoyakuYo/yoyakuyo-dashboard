-- ============================================================================
-- CLEANUP OLD SUBCATEGORIES - Reassign Shops to Main Categories
-- ============================================================================
-- This migration:
--   1. Reassigns all shops from old subcategories to their parent main categories
--   2. Deletes old subcategory entries from the categories table
--   3. Ensures NO shops are lost in the process
-- ============================================================================

-- ============================================================================
-- STEP 1: Map Old Subcategories to New Main Categories
-- ============================================================================

-- Beauty Services subcategories → Beauty Services
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
WHERE category_id IN (
    SELECT id FROM categories WHERE name IN (
        'Hair Salon',
        'Nail Salon',
        'Barber Shop',
        'Barbershop',
        'Eyelash & Eyebrow',
        'Eyelash',
        'Beauty Salon',
        'General Salon'
    )
)
AND category_id IS NOT NULL;

-- Spa, Onsen & Relaxation subcategories → Spa, Onsen & Relaxation
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Spa, Onsen & Relaxation')
WHERE category_id IN (
    SELECT id FROM categories WHERE name IN (
        'Spa & Massage',
        'Onsen & Ryokan',
        'Onsen',
        'Ryokan',
        'Relaxation'
    )
)
AND category_id IS NOT NULL;

-- Hotels & Stays subcategories → Hotels & Stays
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Hotels & Stays')
WHERE category_id IN (
    SELECT id FROM categories WHERE name IN (
        'Hotel',
        'Ryokan Stay',
        'Guesthouse',
        'Boutique Hotel'
    )
)
AND category_id IS NOT NULL;

-- Dining & Izakaya subcategories → Dining & Izakaya
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Dining & Izakaya')
WHERE category_id IN (
    SELECT id FROM categories WHERE name IN (
        'Restaurant',
        'Izakaya & Bar',
        'Izakaya',
        'Cafe',
        'Bar'
    )
)
AND category_id IS NOT NULL;

-- Clinics & Medical Care subcategories → Clinics & Medical Care
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Clinics & Medical Care')
WHERE category_id IN (
    SELECT id FROM categories WHERE name IN (
        'Aesthetic Clinic',
        'Dental Clinic',
        'Women''s Clinic',
        'Medical Clinic',
        'Wellness Clinic'
    )
)
AND category_id IS NOT NULL;

-- Activities & Sports subcategories → Activities & Sports
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Activities & Sports')
WHERE category_id IN (
    SELECT id FROM categories WHERE name IN (
        'Golf',
        'Golf Course',
        'Sports Facility',
        'Activity Center',
        'Indoor Sports',
        'Outdoor Sports'
    )
)
AND category_id IS NOT NULL;

-- ============================================================================
-- STEP 2: Verify All Shops Are Reassigned (Safety Check)
-- ============================================================================

-- Count shops that still have old subcategory IDs
DO $$
DECLARE
    orphaned_shops_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_shops_count
    FROM shops
    WHERE category_id IN (
        SELECT id FROM categories WHERE name IN (
            'Hair Salon', 'Nail Salon', 'Barber Shop', 'Barbershop',
            'Eyelash & Eyebrow', 'Eyelash', 'Beauty Salon', 'General Salon',
            'Spa & Massage', 'Onsen & Ryokan', 'Onsen', 'Ryokan', 'Relaxation',
            'Hotel', 'Ryokan Stay', 'Guesthouse', 'Boutique Hotel',
            'Restaurant', 'Izakaya & Bar', 'Izakaya', 'Cafe', 'Bar',
            'Aesthetic Clinic', 'Dental Clinic', 'Women''s Clinic',
            'Medical Clinic', 'Wellness Clinic',
            'Golf', 'Golf Course', 'Sports Facility', 'Activity Center',
            'Indoor Sports', 'Outdoor Sports'
        )
    );
    
    IF orphaned_shops_count > 0 THEN
        RAISE EXCEPTION 'Safety check failed: % shops still have old subcategory IDs. Aborting deletion.', orphaned_shops_count;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Delete Old Subcategory Entries (Only After All Shops Are Reassigned)
-- ============================================================================

-- Delete old subcategories (only if no shops reference them)
DELETE FROM categories
WHERE name IN (
    -- Beauty Services subcategories
    'Hair Salon',
    'Nail Salon',
    'Barber Shop',
    'Barbershop',
    'Eyelash & Eyebrow',
    'Eyelash',
    'Beauty Salon',
    'General Salon',
    
    -- Spa, Onsen & Relaxation subcategories
    'Spa & Massage',
    'Onsen & Ryokan',
    'Onsen',
    'Ryokan',
    'Relaxation',
    
    -- Hotels & Stays subcategories
    'Hotel',
    'Ryokan Stay',
    'Guesthouse',
    'Boutique Hotel',
    
    -- Dining & Izakaya subcategories
    'Restaurant',
    'Izakaya & Bar',
    'Izakaya',
    'Cafe',
    'Bar',
    
    -- Clinics & Medical Care subcategories
    'Aesthetic Clinic',
    'Dental Clinic',
    'Women''s Clinic',
    'Medical Clinic',
    'Wellness Clinic',
    
    -- Activities & Sports subcategories
    'Golf',
    'Golf Course',
    'Sports Facility',
    'Activity Center',
    'Indoor Sports',
    'Outdoor Sports'
)
AND name NOT IN (
    -- Keep the 6 main categories + Unknown
    'Beauty Services',
    'Spa, Onsen & Relaxation',
    'Hotels & Stays',
    'Dining & Izakaya',
    'Clinics & Medical Care',
    'Activities & Sports',
    'Unknown'
);

-- ============================================================================
-- STEP 4: Final Verification Report
-- ============================================================================

-- Show final category distribution
SELECT 
    c.name AS category_name,
    COUNT(s.id) AS shop_count,
    ROUND(COUNT(s.id) * 100.0 / (SELECT COUNT(*) FROM shops WHERE category_id IS NOT NULL), 2) AS percentage
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
WHERE c.name IN (
    'Beauty Services',
    'Spa, Onsen & Relaxation',
    'Hotels & Stays',
    'Dining & Izakaya',
    'Clinics & Medical Care',
    'Activities & Sports',
    'Unknown'
)
GROUP BY c.id, c.name
ORDER BY shop_count DESC;

-- Show total shop count to verify no shops were lost
SELECT 
    COUNT(*) AS total_shops,
    COUNT(category_id) AS shops_with_category,
    COUNT(*) - COUNT(category_id) AS shops_without_category
FROM shops;

