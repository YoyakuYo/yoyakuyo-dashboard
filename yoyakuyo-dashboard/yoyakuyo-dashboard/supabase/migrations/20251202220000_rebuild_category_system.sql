-- ============================================================================
-- COMPLETE CATEGORY SYSTEM REBUILD
-- ============================================================================
-- This migration:
--   1. Backs up shops table
--   2. Creates/renames categories to final structure (preserving UUIDs)
--   3. Reassigns all shops to correct new categories
--   4. Deletes old categories
--   5. Provides verification queries
-- ============================================================================

-- ============================================================================
-- STEP 1: Backup Shops Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS shops_backup AS 
SELECT * FROM shops;

-- ============================================================================
-- STEP 2: Create/Rename Categories to Final Structure
-- ============================================================================
-- Strategy: RENAME existing categories when possible to preserve UUIDs
-- Only INSERT new categories if they don't exist

-- 1. BEAUTY SERVICES (Main Category)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    -- Check if "Beauty Services" exists
    SELECT id INTO existing_id FROM categories WHERE name = 'Beauty Services';
    
    IF existing_id IS NULL THEN
        -- Check for old names and rename them
        SELECT id INTO existing_id FROM categories WHERE name IN ('Beauty Salon', 'General Salon');
        
        IF existing_id IS NOT NULL THEN
            UPDATE categories SET name = 'Beauty Services', description = 'Hair salons, nail salons, barbershops, eyelash salons, beauty services' WHERE id = existing_id;
        ELSE
            -- Create new
            INSERT INTO categories (name, description) 
            VALUES ('Beauty Services', 'Hair salons, nail salons, barbershops, eyelash salons, beauty services')
            RETURNING id INTO existing_id;
        END IF;
    END IF;
END $$;

-- 1.1 Hair Salon (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Hair Salon';
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Hair Salon', 'Hair styling and coloring services')
        RETURNING id INTO existing_id;
    END IF;
END $$;

-- 1.2 Nail Salon (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Nail Salon';
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Nail Salon', 'Nail care and manicure services')
        RETURNING id INTO existing_id;
    END IF;
END $$;

-- 1.3 Eyelash / Eyebrow (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name IN ('Eyelash & Eyebrow', 'Eyelash', 'Eyebrow');
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Eyelash / Eyebrow', 'Eyelash extensions and eyebrow treatments')
        RETURNING id INTO existing_id;
    ELSE
        -- Rename if exists with different name
        UPDATE categories SET name = 'Eyelash / Eyebrow', description = 'Eyelash extensions and eyebrow treatments' WHERE id = existing_id;
    END IF;
END $$;

-- 1.4 Beauty Salon (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Beauty Salon';
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Beauty Salon', 'General beauty and cosmetic services')
        RETURNING id INTO existing_id;
    END IF;
END $$;

-- 1.5 General Salon (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'General Salon';
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('General Salon', 'Multi-service salon')
        RETURNING id INTO existing_id;
    END IF;
END $$;

-- 1.6 Barbershop (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name IN ('Barbershop', 'Barber Shop');
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Barbershop', 'Men''s haircuts and grooming')
        RETURNING id INTO existing_id;
    ELSE
        -- Rename if exists with different name
        UPDATE categories SET name = 'Barbershop', description = 'Men''s haircuts and grooming' WHERE id = existing_id;
    END IF;
END $$;

-- 1.7 Waxing (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name IN ('Waxing', 'Waxing Shop');
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Waxing', 'Waxing and hair removal services')
        RETURNING id INTO existing_id;
    ELSE
        UPDATE categories SET name = 'Waxing', description = 'Waxing and hair removal services' WHERE id = existing_id;
    END IF;
END $$;

-- 2. SPA, ONSEN & RELAXATION (Main Category)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Spa, Onsen & Relaxation';
    IF existing_id IS NULL THEN
        SELECT id INTO existing_id FROM categories WHERE name IN ('Spa & Massage', 'Spa', 'Onsen');
        IF existing_id IS NOT NULL THEN
            UPDATE categories SET name = 'Spa, Onsen & Relaxation', description = 'Spas, onsen (hot springs), massage, relaxation services, ryokan baths' WHERE id = existing_id;
        ELSE
            INSERT INTO categories (name, description) 
            VALUES ('Spa, Onsen & Relaxation', 'Spas, onsen (hot springs), massage, relaxation services, ryokan baths')
            RETURNING id INTO existing_id;
        END IF;
    END IF;
END $$;

-- 2.1 Spa (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Spa';
    IF existing_id IS NULL THEN
        SELECT id INTO existing_id FROM categories WHERE name = 'Spa & Massage';
        IF existing_id IS NOT NULL THEN
            UPDATE categories SET name = 'Spa', description = 'Spa treatments and wellness services' WHERE id = existing_id;
        ELSE
            INSERT INTO categories (name, description) 
            VALUES ('Spa', 'Spa treatments and wellness services')
            RETURNING id INTO existing_id;
        END IF;
    END IF;
END $$;

-- 2.2 Massages (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name IN ('Massages', 'Massage');
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Massages', 'Massage therapy and relaxation')
        RETURNING id INTO existing_id;
    ELSE
        UPDATE categories SET name = 'Massages', description = 'Massage therapy and relaxation' WHERE id = existing_id;
    END IF;
END $$;

-- 2.3 Onsen (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Onsen';
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Onsen', 'Traditional Japanese hot springs')
        RETURNING id INTO existing_id;
    END IF;
END $$;

-- 2.4 Ryokan Onsen (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name IN ('Ryokan Onsen', 'Onsen & Ryokan', 'Ryokan');
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Ryokan Onsen', 'Traditional Japanese inns with onsen')
        RETURNING id INTO existing_id;
    ELSE
        UPDATE categories SET name = 'Ryokan Onsen', description = 'Traditional Japanese inns with onsen' WHERE id = existing_id;
    END IF;
END $$;

-- 3. HOTELS & STAYS (Main Category)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Hotels & Stays';
    IF existing_id IS NULL THEN
        SELECT id INTO existing_id FROM categories WHERE name IN ('Hotel', 'Hotels');
        IF existing_id IS NOT NULL THEN
            UPDATE categories SET name = 'Hotels & Stays', description = 'Hotels, ryokan (traditional inns), guesthouses, accommodations' WHERE id = existing_id;
        ELSE
            INSERT INTO categories (name, description) 
            VALUES ('Hotels & Stays', 'Hotels, ryokan (traditional inns), guesthouses, accommodations')
            RETURNING id INTO existing_id;
        END IF;
    END IF;
END $$;

-- 3.1 Hotel (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Hotel';
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Hotel', 'Hotels and accommodations')
        RETURNING id INTO existing_id;
    END IF;
END $$;

-- 3.2 Boutique Hotel (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Boutique Hotel';
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Boutique Hotel', 'Boutique and design hotels')
        RETURNING id INTO existing_id;
    END IF;
END $$;

-- 3.3 Guest House (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name IN ('Guest House', 'Guesthouse');
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Guest House', 'Guesthouses and budget accommodations')
        RETURNING id INTO existing_id;
    ELSE
        UPDATE categories SET name = 'Guest House', description = 'Guesthouses and budget accommodations' WHERE id = existing_id;
    END IF;
END $$;

-- 3.4 Ryokan Stay (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name IN ('Ryokan Stay', 'Ryokan');
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Ryokan Stay', 'Traditional Japanese inn accommodations')
        RETURNING id INTO existing_id;
    ELSE
        -- Only update if it's not already "Ryokan Onsen"
        IF (SELECT name FROM categories WHERE id = existing_id) != 'Ryokan Onsen' THEN
            UPDATE categories SET name = 'Ryokan Stay', description = 'Traditional Japanese inn accommodations' WHERE id = existing_id;
        END IF;
    END IF;
END $$;

-- 4. DINING & IZAKAYA (Main Category)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Dining & Izakaya';
    IF existing_id IS NULL THEN
        SELECT id INTO existing_id FROM categories WHERE name IN ('Restaurant', 'Restaurants & Izakaya');
        IF existing_id IS NOT NULL THEN
            UPDATE categories SET name = 'Dining & Izakaya', description = 'Restaurants, izakaya (Japanese pubs), cafes, bars, dining establishments' WHERE id = existing_id;
        ELSE
            INSERT INTO categories (name, description) 
            VALUES ('Dining & Izakaya', 'Restaurants, izakaya (Japanese pubs), cafes, bars, dining establishments')
            RETURNING id INTO existing_id;
        END IF;
    END IF;
END $$;

-- 4.1 Restaurant (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Restaurant';
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Restaurant', 'Restaurants and dining establishments')
        RETURNING id INTO existing_id;
    END IF;
END $$;

-- 4.2 Izakaya (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name IN ('Izakaya', 'Izakaya & Bar');
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Izakaya', 'Japanese casual dining and drinking establishments')
        RETURNING id INTO existing_id;
    ELSE
        UPDATE categories SET name = 'Izakaya', description = 'Japanese casual dining and drinking establishments' WHERE id = existing_id;
    END IF;
END $$;

-- 4.3 Karaoke (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name IN ('Karaoke', 'Private Karaoke Rooms');
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Karaoke', 'Private karaoke rooms and karaoke establishments')
        RETURNING id INTO existing_id;
    ELSE
        UPDATE categories SET name = 'Karaoke', description = 'Private karaoke rooms and karaoke establishments' WHERE id = existing_id;
    END IF;
END $$;

-- 5. CLINICS & MEDICAL CARE (Main Category)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Clinics & Medical Care';
    IF existing_id IS NULL THEN
        SELECT id INTO existing_id FROM categories WHERE name IN ('Medical Clinic', 'Clinic');
        IF existing_id IS NOT NULL THEN
            UPDATE categories SET name = 'Clinics & Medical Care', description = 'Dental clinics, medical clinics, aesthetic clinics, women''s clinics, wellness clinics' WHERE id = existing_id;
        ELSE
            INSERT INTO categories (name, description) 
            VALUES ('Clinics & Medical Care', 'Dental clinics, medical clinics, aesthetic clinics, women''s clinics, wellness clinics')
            RETURNING id INTO existing_id;
        END IF;
    END IF;
END $$;

-- 5.1 Dental Clinic (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Dental Clinic';
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Dental Clinic', 'Dental care and dental clinics')
        RETURNING id INTO existing_id;
    END IF;
END $$;

-- 5.2 Eye Clinic (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name IN ('Eye Clinic', 'Ophthalmology', '眼科');
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Eye Clinic', 'Eye care and ophthalmology clinics')
        RETURNING id INTO existing_id;
    ELSE
        UPDATE categories SET name = 'Eye Clinic', description = 'Eye care and ophthalmology clinics' WHERE id = existing_id;
    END IF;
END $$;

-- 5.3 Women's Clinic (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name IN ('Women''s Clinic', 'Womens Clinic');
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Women''s Clinic', 'Women''s health and care clinics')
        RETURNING id INTO existing_id;
    ELSE
        UPDATE categories SET name = 'Women''s Clinic', description = 'Women''s health and care clinics' WHERE id = existing_id;
    END IF;
END $$;

-- 5.4 Wellness Clinic (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Wellness Clinic';
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Wellness Clinic', 'Wellness and preventive care clinics')
        RETURNING id INTO existing_id;
    END IF;
END $$;

-- 6. ACTIVITIES & SPORTS (Main Category)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Activities & Sports';
    IF existing_id IS NULL THEN
        SELECT id INTO existing_id FROM categories WHERE name IN ('Sports', 'Golf');
        IF existing_id IS NOT NULL THEN
            UPDATE categories SET name = 'Activities & Sports', description = 'Golf courses, gyms, sports facilities, activity centers, recreational activities' WHERE id = existing_id;
        ELSE
            INSERT INTO categories (name, description) 
            VALUES ('Activities & Sports', 'Golf courses, gyms, sports facilities, activity centers, recreational activities')
            RETURNING id INTO existing_id;
        END IF;
    END IF;
END $$;

-- 6.1 Golf (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Golf';
    IF existing_id IS NULL THEN
        SELECT id INTO existing_id FROM categories WHERE name IN ('Golf Course', 'Golf Courses & Practice Ranges');
        IF existing_id IS NOT NULL THEN
            UPDATE categories SET name = 'Golf', description = 'Golf courses' WHERE id = existing_id;
        ELSE
            INSERT INTO categories (name, description) 
            VALUES ('Golf', 'Golf courses')
            RETURNING id INTO existing_id;
        END IF;
    END IF;
END $$;

-- 6.2 Golf Practice Range (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name IN ('Golf Practice Range', 'Golf Practice');
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Golf Practice Range', 'Golf practice ranges and driving ranges')
        RETURNING id INTO existing_id;
    ELSE
        UPDATE categories SET name = 'Golf Practice Range', description = 'Golf practice ranges and driving ranges' WHERE id = existing_id;
    END IF;
END $$;

-- 6.3 Pilates (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Pilates';
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Pilates', 'Pilates studios and classes')
        RETURNING id INTO existing_id;
    END IF;
END $$;

-- 6.4 Yoga (Subcategory)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Yoga';
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Yoga', 'Yoga studios and classes')
        RETURNING id INTO existing_id;
    END IF;
END $$;

-- 7. UNKNOWN (Main Category)
DO $$
DECLARE
    existing_id UUID;
BEGIN
    SELECT id INTO existing_id FROM categories WHERE name = 'Unknown';
    IF existing_id IS NULL THEN
        INSERT INTO categories (name, description) 
        VALUES ('Unknown', 'Uncategorized shops')
        RETURNING id INTO existing_id;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Reassign All Shops to Correct New Categories
-- ============================================================================

-- 3.1 BEAUTY SERVICES (Main Category)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Beauty Services')
WHERE category_id IN (
    SELECT id FROM categories WHERE name IN (
        'Hair Salon',
        'Nail Salon',
        'Eyelash',
        'Eyelash & Eyebrow',
        'Eyebrow',
        'Beauty Salon',
        'General Salon',
        'Barbershop',
        'Barber Shop',
        'Waxing',
        'Waxing Shop'
    )
)
AND category_id IS NOT NULL;

-- 3.2 SPA, ONSEN & RELAXATION (Main Category)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Spa, Onsen & Relaxation')
WHERE category_id IN (
    SELECT id FROM categories WHERE name IN (
        'Spa',
        'Spa & Massage',
        'Massages',
        'Massage',
        'Onsen',
        'Ryokan Onsen',
        'Onsen & Ryokan',
        'Ryokan'
    )
)
AND category_id IS NOT NULL;

-- 3.3 HOTELS & STAYS (Main Category)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Hotels & Stays')
WHERE category_id IN (
    SELECT id FROM categories WHERE name IN (
        'Hotel',
        'Boutique Hotel',
        'Guest House',
        'Guesthouse',
        'Ryokan Stay',
        'Hotels & Ryokan'
    )
)
AND category_id IS NOT NULL;

-- 3.4 DINING & IZAKAYA (Main Category)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Dining & Izakaya')
WHERE category_id IN (
    SELECT id FROM categories WHERE name IN (
        'Restaurant',
        'Restaurants & Izakaya',
        'Izakaya',
        'Izakaya & Bar',
        'Karaoke',
        'Private Karaoke Rooms'
    )
)
AND category_id IS NOT NULL;

-- 3.5 CLINICS & MEDICAL CARE (Main Category)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Clinics & Medical Care')
WHERE category_id IN (
    SELECT id FROM categories WHERE name IN (
        'Dental Clinic',
        'Eye Clinic',
        'Ophthalmology',
        'Women''s Clinic',
        'Womens Clinic',
        'Wellness Clinic',
        'Medical Clinic',
        'Aesthetic Clinic'
    )
)
AND category_id IS NOT NULL;

-- 3.6 ACTIVITIES & SPORTS (Main Category)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Activities & Sports')
WHERE category_id IN (
    SELECT id FROM categories WHERE name IN (
        'Golf',
        'Golf Course',
        'Golf Practice Range',
        'Golf Practice',
        'Golf Courses & Practice Ranges',
        'Pilates',
        'Yoga',
        'Sports',
        'Sports Facility'
    )
)
AND category_id IS NOT NULL;

-- 3.7 UNKNOWN (Fallback)
UPDATE shops
SET category_id = (SELECT id FROM categories WHERE name = 'Unknown')
WHERE category_id IS NULL
   OR category_id NOT IN (
       SELECT id FROM categories WHERE name IN (
           'Beauty Services',
           'Spa, Onsen & Relaxation',
           'Hotels & Stays',
           'Dining & Izakaya',
           'Clinics & Medical Care',
           'Activities & Sports',
           'Unknown',
           -- Subcategories
           'Hair Salon',
           'Nail Salon',
           'Eyelash / Eyebrow',
           'Beauty Salon',
           'General Salon',
           'Barbershop',
           'Waxing',
           'Spa',
           'Massages',
           'Onsen',
           'Ryokan Onsen',
           'Hotel',
           'Boutique Hotel',
           'Guest House',
           'Ryokan Stay',
           'Restaurant',
           'Izakaya',
           'Karaoke',
           'Dental Clinic',
           'Eye Clinic',
           'Women''s Clinic',
           'Wellness Clinic',
           'Golf',
           'Golf Practice Range',
           'Pilates',
           'Yoga'
       )
   );

-- ============================================================================
-- STEP 4: Delete Old Categories That Are Not in Final Structure
-- ============================================================================

DELETE FROM categories
WHERE name NOT IN (
    -- Main Categories
    'Beauty Services',
    'Spa, Onsen & Relaxation',
    'Hotels & Stays',
    'Dining & Izakaya',
    'Clinics & Medical Care',
    'Activities & Sports',
    'Unknown',
    -- Subcategories
    'Hair Salon',
    'Nail Salon',
    'Eyelash / Eyebrow',
    'Beauty Salon',
    'General Salon',
    'Barbershop',
    'Waxing',
    'Spa',
    'Massages',
    'Onsen',
    'Ryokan Onsen',
    'Hotel',
    'Boutique Hotel',
    'Guest House',
    'Ryokan Stay',
    'Restaurant',
    'Izakaya',
    'Karaoke',
    'Dental Clinic',
    'Eye Clinic',
    'Women''s Clinic',
    'Wellness Clinic',
    'Golf',
    'Golf Practice Range',
    'Pilates',
    'Yoga'
)
AND id NOT IN (
    -- Keep categories that have shops assigned (safety check)
    SELECT DISTINCT category_id FROM shops WHERE category_id IS NOT NULL
);

-- ============================================================================
-- STEP 5: Verification Queries
-- ============================================================================

-- Show category distribution
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

-- Show subcategory distribution
SELECT 
    c.name AS category_name,
    COUNT(s.id) AS shop_count
FROM categories c
LEFT JOIN shops s ON s.category_id = c.id
WHERE c.name IN (
    'Hair Salon', 'Nail Salon', 'Eyelash / Eyebrow', 'Beauty Salon', 'General Salon', 'Barbershop', 'Waxing',
    'Spa', 'Massages', 'Onsen', 'Ryokan Onsen',
    'Hotel', 'Boutique Hotel', 'Guest House', 'Ryokan Stay',
    'Restaurant', 'Izakaya', 'Karaoke',
    'Dental Clinic', 'Eye Clinic', 'Women''s Clinic', 'Wellness Clinic',
    'Golf', 'Golf Practice Range', 'Pilates', 'Yoga'
)
GROUP BY c.id, c.name
ORDER BY shop_count DESC;

-- Show total shop count
SELECT 
    COUNT(*) AS total_shops,
    COUNT(category_id) AS shops_with_category,
    COUNT(*) - COUNT(category_id) AS shops_without_category
FROM shops;

