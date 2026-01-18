-- ============================================================================
-- ASSIGN SHOPS TO SUBCATEGORIES - MANUAL SQL
-- ============================================================================
-- This script reassigns shops from main categories to their specific
-- subcategories based on the shops.subcategory field
-- ============================================================================

-- ============================================================================
-- BEAUTY SERVICES SUBCATEGORIES
-- ============================================================================

-- Hair Salon
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Hair Salon')
WHERE subcategory = 'Hair Salon'
AND category_id != (SELECT id FROM categories WHERE name = 'Hair Salon')
AND (SELECT id FROM categories WHERE name = 'Hair Salon') IS NOT NULL;

-- Nail Salon
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Nail Salon')
WHERE subcategory = 'Nail Salon'
AND category_id != (SELECT id FROM categories WHERE name = 'Nail Salon')
AND (SELECT id FROM categories WHERE name = 'Nail Salon') IS NOT NULL;

-- Eyelash / Eyebrow
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Eyelash / Eyebrow')
WHERE subcategory IN ('Eyelash / Eyebrow', 'Eyelash & Eyebrow', 'Eyelash', 'Eyebrow')
AND category_id != (SELECT id FROM categories WHERE name = 'Eyelash / Eyebrow')
AND (SELECT id FROM categories WHERE name = 'Eyelash / Eyebrow') IS NOT NULL;

-- Beauty Salon
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Beauty Salon')
WHERE subcategory = 'Beauty Salon'
AND category_id != (SELECT id FROM categories WHERE name = 'Beauty Salon')
AND (SELECT id FROM categories WHERE name = 'Beauty Salon') IS NOT NULL;

-- General Salon
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'General Salon')
WHERE subcategory = 'General Salon'
AND category_id != (SELECT id FROM categories WHERE name = 'General Salon')
AND (SELECT id FROM categories WHERE name = 'General Salon') IS NOT NULL;

-- Barbershop
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Barbershop')
WHERE subcategory IN ('Barbershop', 'Barber Shop')
AND category_id != (SELECT id FROM categories WHERE name = 'Barbershop')
AND (SELECT id FROM categories WHERE name = 'Barbershop') IS NOT NULL;

-- Waxing
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Waxing')
WHERE subcategory IN ('Waxing', 'Waxing Shop')
AND category_id != (SELECT id FROM categories WHERE name = 'Waxing')
AND (SELECT id FROM categories WHERE name = 'Waxing') IS NOT NULL;

-- ============================================================================
-- SPA, ONSEN & RELAXATION SUBCATEGORIES
-- ============================================================================

-- Spa
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Spa')
WHERE subcategory IN ('Spa', 'Spa & Massage')
AND category_id != (SELECT id FROM categories WHERE name = 'Spa')
AND (SELECT id FROM categories WHERE name = 'Spa') IS NOT NULL;

-- Massages
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Massages')
WHERE subcategory IN ('Massages', 'Massage')
AND category_id != (SELECT id FROM categories WHERE name = 'Massages')
AND (SELECT id FROM categories WHERE name = 'Massages') IS NOT NULL;

-- Onsen
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Onsen')
WHERE subcategory = 'Onsen'
AND category_id != (SELECT id FROM categories WHERE name = 'Onsen')
AND (SELECT id FROM categories WHERE name = 'Onsen') IS NOT NULL;

-- Ryokan Onsen
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Ryokan Onsen')
WHERE subcategory IN ('Ryokan Onsen', 'Onsen & Ryokan')
AND category_id != (SELECT id FROM categories WHERE name = 'Ryokan Onsen')
AND (SELECT id FROM categories WHERE name = 'Ryokan Onsen') IS NOT NULL;

-- ============================================================================
-- HOTELS & STAYS SUBCATEGORIES
-- ============================================================================

-- Hotel
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Hotel')
WHERE subcategory = 'Hotel'
AND category_id != (SELECT id FROM categories WHERE name = 'Hotel')
AND (SELECT id FROM categories WHERE name = 'Hotel') IS NOT NULL;

-- Boutique Hotel
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Boutique Hotel')
WHERE subcategory = 'Boutique Hotel'
AND category_id != (SELECT id FROM categories WHERE name = 'Boutique Hotel')
AND (SELECT id FROM categories WHERE name = 'Boutique Hotel') IS NOT NULL;

-- Guest House
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Guest House')
WHERE subcategory IN ('Guest House', 'Guesthouse')
AND category_id != (SELECT id FROM categories WHERE name = 'Guest House')
AND (SELECT id FROM categories WHERE name = 'Guest House') IS NOT NULL;

-- Ryokan Stay
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Ryokan Stay')
WHERE subcategory = 'Ryokan Stay'
AND category_id != (SELECT id FROM categories WHERE name = 'Ryokan Stay')
AND (SELECT id FROM categories WHERE name = 'Ryokan Stay') IS NOT NULL;

-- ============================================================================
-- DINING & IZAKAYA SUBCATEGORIES
-- ============================================================================

-- Restaurant
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Restaurant')
WHERE subcategory IN ('Restaurant', 'Restaurants & Izakaya')
AND category_id != (SELECT id FROM categories WHERE name = 'Restaurant')
AND (SELECT id FROM categories WHERE name = 'Restaurant') IS NOT NULL;

-- Izakaya
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Izakaya')
WHERE subcategory IN ('Izakaya', 'Izakaya & Bar')
AND category_id != (SELECT id FROM categories WHERE name = 'Izakaya')
AND (SELECT id FROM categories WHERE name = 'Izakaya') IS NOT NULL;

-- Karaoke
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Karaoke')
WHERE subcategory IN ('Karaoke', 'Private Karaoke Rooms')
AND category_id != (SELECT id FROM categories WHERE name = 'Karaoke')
AND (SELECT id FROM categories WHERE name = 'Karaoke') IS NOT NULL;

-- ============================================================================
-- CLINICS & MEDICAL CARE SUBCATEGORIES
-- ============================================================================

-- Dental Clinic
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Dental Clinic')
WHERE subcategory = 'Dental Clinic'
AND category_id != (SELECT id FROM categories WHERE name = 'Dental Clinic')
AND (SELECT id FROM categories WHERE name = 'Dental Clinic') IS NOT NULL;

-- Eye Clinic
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Eye Clinic')
WHERE subcategory IN ('Eye Clinic', 'Ophthalmology')
AND category_id != (SELECT id FROM categories WHERE name = 'Eye Clinic')
AND (SELECT id FROM categories WHERE name = 'Eye Clinic') IS NOT NULL;

-- Women's Clinic
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Women''s Clinic')
WHERE subcategory IN ('Women''s Clinic', 'Womens Clinic')
AND category_id != (SELECT id FROM categories WHERE name = 'Women''s Clinic')
AND (SELECT id FROM categories WHERE name = 'Women''s Clinic') IS NOT NULL;

-- Wellness Clinic
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Wellness Clinic')
WHERE subcategory = 'Wellness Clinic'
AND category_id != (SELECT id FROM categories WHERE name = 'Wellness Clinic')
AND (SELECT id FROM categories WHERE name = 'Wellness Clinic') IS NOT NULL;

-- ============================================================================
-- ACTIVITIES & SPORTS SUBCATEGORIES
-- ============================================================================

-- Golf
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Golf')
WHERE subcategory IN ('Golf', 'Golf Course', 'Golf Courses & Practice Ranges')
AND category_id != (SELECT id FROM categories WHERE name = 'Golf')
AND (SELECT id FROM categories WHERE name = 'Golf') IS NOT NULL;

-- Golf Practice Range
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Golf Practice Range')
WHERE subcategory IN ('Golf Practice Range', 'Golf Practice')
AND category_id != (SELECT id FROM categories WHERE name = 'Golf Practice Range')
AND (SELECT id FROM categories WHERE name = 'Golf Practice Range') IS NOT NULL;

-- Pilates
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Pilates')
WHERE subcategory = 'Pilates'
AND category_id != (SELECT id FROM categories WHERE name = 'Pilates')
AND (SELECT id FROM categories WHERE name = 'Pilates') IS NOT NULL;

-- Yoga
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Yoga')
WHERE subcategory = 'Yoga'
AND category_id != (SELECT id FROM categories WHERE name = 'Yoga')
AND (SELECT id FROM categories WHERE name = 'Yoga') IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show subcategory distribution (should now have shops)
SELECT 
    c.name AS category_name,
    COUNT(DISTINCT s.id) AS shop_count
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
WHERE c.name IN (
    -- Subcategories
    'Hair Salon', 'Nail Salon', 'Eyelash / Eyebrow', 'Beauty Salon', 'General Salon', 'Barbershop', 'Waxing',
    'Spa', 'Massages', 'Onsen', 'Ryokan Onsen',
    'Hotel', 'Boutique Hotel', 'Guest House', 'Ryokan Stay',
    'Restaurant', 'Izakaya', 'Karaoke',
    'Dental Clinic', 'Eye Clinic', 'Women''s Clinic', 'Wellness Clinic',
    'Golf', 'Golf Practice Range', 'Pilates', 'Yoga'
)
GROUP BY c.id, c.name
ORDER BY shop_count DESC;

-- Show shops still assigned to main categories (should be minimal - only Unknown or shops without subcategory)
SELECT 
    c.name AS category_name,
    COUNT(DISTINCT s.id) AS shop_count
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

