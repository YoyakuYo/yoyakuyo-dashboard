-- ============================================================================
-- FIX UNKNOWN SHOPS (Visible in LINE App)
-- ============================================================================
-- This script categorizes the 914 "Unknown" shops that are visible in LINE app
-- ============================================================================

DO $$
DECLARE
    shops_updated INTEGER := 0;
BEGIN
    -- ============================================================================
    -- STEP 1: Use subcategory field if available (most accurate)
    -- Skip shops where subcategory = 'Unknown' (handle in Step 2)
    -- ============================================================================
    
    -- Beauty Services subcategories
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Hair Salon')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Hair Salon'
    AND s.subcategory != 'Unknown'
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Hair Salon (from subcategory)', shops_updated;

    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Nail Salon')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Nail Salon'
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Nail Salon (from subcategory)', shops_updated;

    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Eyelash / Eyebrow')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IN ('Eyelash / Eyebrow', 'Eyelash & Eyebrow', 'Eyelash', 'Eyebrow')
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Eyelash / Eyebrow (from subcategory)', shops_updated;

    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Beauty Salon')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Beauty Salon'
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Beauty Salon (from subcategory)', shops_updated;

    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Barbershop')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IN ('Barbershop', 'Barber Shop')
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Barbershop (from subcategory)', shops_updated;

    -- Spa subcategories
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Spa')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IN ('Spa', 'Spa & Massage')
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Spa (from subcategory)', shops_updated;

    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Massages')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IN ('Massages', 'Massage')
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Massages (from subcategory)', shops_updated;

    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Onsen')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Onsen'
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Onsen (from subcategory)', shops_updated;

    -- Hotels subcategories
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Hotel')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Hotel'
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Hotel (from subcategory)', shops_updated;

    -- Dining subcategories
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Restaurant')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IN ('Restaurant', 'Restaurants & Izakaya')
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Restaurant (from subcategory)', shops_updated;

    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Izakaya')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IN ('Izakaya', 'Izakaya & Bar')
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Izakaya (from subcategory)', shops_updated;

    -- Clinics subcategories
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Dental Clinic')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Dental Clinic'
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Dental Clinic (from subcategory)', shops_updated;

    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Eye Clinic')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IN ('Eye Clinic', 'Ophthalmology')
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Eye Clinic (from subcategory)', shops_updated;

    -- Activities subcategories
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Golf')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IN ('Golf', 'Golf Course', 'Golf Courses & Practice Ranges')
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Golf (from subcategory)', shops_updated;

    -- ============================================================================
    -- STEP 2: Handle shops with subcategory = "Unknown" (need name-based categorization)
    -- ============================================================================
    
    -- These shops have subcategory = "Unknown" - categorize by name/address
    -- Restaurants
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Restaurant')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Unknown'
    AND (
        LOWER(s.name) LIKE '%restaurant%' 
        OR LOWER(s.name) LIKE '%dining%' 
        OR LOWER(s.name) LIKE '%cafe%'
        OR LOWER(s.name) LIKE '%レストラン%'
        OR LOWER(s.name) LIKE '%カフェ%'
        OR LOWER(s.name) LIKE '%食堂%'
        OR LOWER(s.name) LIKE '%居酒屋%'
        OR LOWER(s.name) LIKE '%izakaya%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops (subcategory=Unknown) as Restaurant (from name)', shops_updated;

    -- Clinics (京都予防医学センター付属診療所)
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Dental Clinic')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Unknown'
    AND (
        LOWER(s.name) LIKE '%clinic%' 
        OR LOWER(s.name) LIKE '%診療所%'
        OR LOWER(s.name) LIKE '%クリニック%'
        OR LOWER(s.name) LIKE '%医院%'
        OR LOWER(s.name) LIKE '%病院%'
        OR LOWER(s.name) LIKE '%dental%' 
        OR LOWER(s.name) LIKE '%歯科%' 
        OR LOWER(s.name) LIKE '%歯医者%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops (subcategory=Unknown) as Dental Clinic (from name)', shops_updated;

    -- Beauty/Salon shops (Joule 銀座, PREVIA, PEEK-A-BOO - these are in Ginza, likely beauty)
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Beauty Salon')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Unknown'
    AND (
        LOWER(s.address) LIKE '%ginza%' 
        OR LOWER(s.address) LIKE '%銀座%'
        OR LOWER(s.name) LIKE '%salon%'
        OR LOWER(s.name) LIKE '%サロン%'
        OR LOWER(s.name) LIKE '%beauty%'
        OR LOWER(s.name) LIKE '%美容%'
    )
    AND NOT (
        LOWER(s.name) LIKE '%restaurant%' 
        OR LOWER(s.name) LIKE '%cafe%'
        OR LOWER(s.name) LIKE '%clinic%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops (subcategory=Unknown) as Beauty Salon (from name/address)', shops_updated;

    -- Real Estate (由利開発不動産) - these might not be bookable shops, but categorize anyway
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Unknown') -- Keep as Unknown for now
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Unknown'
    AND (
        LOWER(s.name) LIKE '%不動産%'
        OR LOWER(s.name) LIKE '%real estate%'
        OR LOWER(s.name) LIKE '%estate%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Kept % real estate shops as Unknown (not bookable)', shops_updated;

    -- Bone-setting clinics (整骨院) - These ARE bookable!
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Dental Clinic') -- Use Dental Clinic as closest match, or create new category
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Unknown'
    AND (
        LOWER(s.name) LIKE '%整骨院%'
        OR LOWER(s.name) LIKE '%接骨院%'
        OR LOWER(s.name) LIKE '%seikotsuin%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % bone-setting clinics (整骨院) as Dental Clinic (from name)', shops_updated;

    -- Streets/Bus stops/Train stations - these are NOT shops, hide them from LINE app
    -- (元伊勢町通, 烏丸通, 今出川通, 等持院駅, JR上野駅公園口, 外苑前駅, 動物園前駅)
    UPDATE shops s
    SET claim_status = 'hidden' -- Hide from LINE app
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Unknown'
    AND (
        LOWER(s.name) LIKE '%通%' -- Street names ending with 通
        OR LOWER(s.name) LIKE '%駅%' -- Train stations
        OR LOWER(s.name) LIKE '%station%'
        OR LOWER(s.name) LIKE '%bus stop%'
        OR LOWER(s.name) LIKE '%バス停%'
        OR LOWER(s.name) LIKE '%ホーム%' -- Platform
        OR LOWER(s.name) LIKE '%parking%' -- Parking lots
        OR LOWER(s.name) LIKE '%駐車場%' -- Parking lots
        OR LOWER(s.address) = s.name -- If address equals name, it's likely a street/landmark
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Hidden % streets/stations/parking from LINE app (not bookable)', shops_updated;

    -- Parks - NOT bookable shops
    UPDATE shops s
    SET claim_status = 'hidden' -- Hide from LINE app
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Unknown'
    AND (
        LOWER(s.name) LIKE '%公園%' -- Parks
        OR LOWER(s.name) LIKE '%park%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Hidden % parks from LINE app (not bookable)', shops_updated;

    -- Real Estate - NOT bookable shops
    UPDATE shops s
    SET claim_status = 'hidden' -- Hide from LINE app
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Unknown'
    AND (
        LOWER(s.name) LIKE '%不動産%'
        OR LOWER(s.name) LIKE '%real estate%'
        OR LOWER(s.name) LIKE '%estate%'
        OR LOWER(s.name) LIKE '%fudosan%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Hidden % real estate companies from LINE app (not bookable)', shops_updated;

    -- Schools/Universities - NOT bookable shops
    UPDATE shops s
    SET claim_status = 'hidden' -- Hide from LINE app
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Unknown'
    AND (
        LOWER(s.name) LIKE '%大学%' -- Universities
        OR LOWER(s.name) LIKE '%university%'
        OR LOWER(s.name) LIKE '%school%'
        OR LOWER(s.name) LIKE '%学校%'
        OR LOWER(s.name) LIKE '%サテライト%' -- Satellite campus
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Hidden % schools/universities from LINE app (not bookable)', shops_updated;

    -- Daycare/Nursery - NOT bookable shops (unless you want to add daycare booking)
    UPDATE shops s
    SET claim_status = 'hidden' -- Hide from LINE app
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory = 'Unknown'
    AND (
        LOWER(s.name) LIKE '%保育園%' -- Daycare
        OR LOWER(s.name) LIKE '%nursery%'
        OR LOWER(s.name) LIKE '%hoikuen%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Hidden % daycare/nursery from LINE app (not bookable)', shops_updated;

    -- ============================================================================
    -- STEP 3: Infer from shop name (if subcategory is NULL)
    -- ============================================================================
    
    -- Restaurants (most common)
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Restaurant')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (
        LOWER(s.name) LIKE '%restaurant%' 
        OR LOWER(s.name) LIKE '%dining%' 
        OR LOWER(s.name) LIKE '%cafe%'
        OR LOWER(s.name) LIKE '%レストラン%'
        OR LOWER(s.name) LIKE '%カフェ%'
        OR LOWER(s.name) LIKE '%食堂%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Restaurant (from name)', shops_updated;

    -- Dental Clinics
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Dental Clinic')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (
        LOWER(s.name) LIKE '%dental%' 
        OR LOWER(s.name) LIKE '%歯科%' 
        OR LOWER(s.name) LIKE '%歯医者%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Dental Clinic (from name)', shops_updated;

    -- Hotels
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Hotel')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (
        LOWER(s.name) LIKE '%hotel%' 
        OR LOWER(s.name) LIKE '%ホテル%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Hotel (from name)', shops_updated;

    -- Hair Salons
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Hair Salon')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (
        (LOWER(s.name) LIKE '%hair%' OR LOWER(s.name) LIKE '%salon%' OR LOWER(s.name) LIKE '%ヘア%' OR LOWER(s.name) LIKE '%サロン%')
        AND NOT (LOWER(s.name) LIKE '%nail%' OR LOWER(s.name) LIKE '%barber%')
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Hair Salon (from name)', shops_updated;

    -- Nail Salons
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Nail Salon')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (
        LOWER(s.name) LIKE '%nail%' 
        OR LOWER(s.name) LIKE '%manicure%' 
        OR LOWER(s.name) LIKE '%ネイル%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Nail Salon (from name)', shops_updated;

    -- Barbershops
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Barbershop')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (
        LOWER(s.name) LIKE '%barber%' 
        OR LOWER(s.name) LIKE '%理容%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Barbershop (from name)', shops_updated;

    -- Spas
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Spa')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (
        LOWER(s.name) LIKE '%spa%' 
        OR LOWER(s.name) LIKE '%スパ%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Spa (from name)', shops_updated;

    -- Onsen
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Onsen')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (
        LOWER(s.name) LIKE '%onsen%' 
        OR LOWER(s.name) LIKE '%温泉%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Onsen (from name)', shops_updated;

    -- Izakaya
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Izakaya')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (
        LOWER(s.name) LIKE '%izakaya%' 
        OR LOWER(s.name) LIKE '%居酒屋%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Izakaya (from name)', shops_updated;

    -- Eye Clinics
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Eye Clinic')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (
        LOWER(s.name) LIKE '%eye%' 
        OR LOWER(s.name) LIKE '%眼科%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Eye Clinic (from name)', shops_updated;

    -- Golf
    UPDATE shops s
    SET category_id = (SELECT id FROM categories WHERE name = 'Golf')
    WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
    AND s.subcategory IS NULL
    AND (
        LOWER(s.name) LIKE '%golf%' 
        OR LOWER(s.name) LIKE '%ゴルフ%'
    )
    AND s.address IS NOT NULL AND s.address != ''
    AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
    AND s.claim_status != 'hidden';
    GET DIAGNOSTICS shops_updated = ROW_COUNT;
    RAISE NOTICE 'Categorized % Unknown shops as Golf (from name)', shops_updated;

    RAISE NOTICE '=== COMPLETE: Unknown shops categorization finished ===';
END $$;

-- ============================================================================
-- VERIFICATION: Check remaining Unknown shops
-- ============================================================================
SELECT 
  'Remaining Unknown Shops (Visible in LINE App)' as check_type,
  COUNT(*) as remaining_count
FROM shops s
WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
  AND s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
  AND s.claim_status != 'hidden';

-- Breakdown of remaining Unknown shops
SELECT 
  'Remaining Unknown Shops Breakdown' as check_type,
  CASE 
    WHEN s.subcategory = 'Unknown' THEN 'Has subcategory=Unknown'
    WHEN s.subcategory IS NULL THEN 'No subcategory'
    ELSE 'Other subcategory'
  END as subcategory_status,
  COUNT(*) as count
FROM shops s
WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
  AND s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
  AND s.claim_status != 'hidden'
GROUP BY 
  CASE 
    WHEN s.subcategory = 'Unknown' THEN 'Has subcategory=Unknown'
    WHEN s.subcategory IS NULL THEN 'No subcategory'
    ELSE 'Other subcategory'
  END;

-- Sample remaining Unknown shops
SELECT 
  'Sample Remaining Unknown Shops' as check_type,
  s.name,
  s.subcategory,
  s.address
FROM shops s
WHERE s.category_id = (SELECT id FROM categories WHERE name = 'Unknown')
  AND s.address IS NOT NULL 
  AND s.address != ''
  AND (s.claim_status IS NULL OR s.claim_status = 'approved' OR s.claim_status = 'unclaimed' OR s.claim_status = 'pending')
  AND s.claim_status != 'hidden'
LIMIT 20;

