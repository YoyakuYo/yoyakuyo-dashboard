-- Fix categorization for "Take a leisurely walk" The Second store
-- This shop is incorrectly categorized as Restaurant but should be Beauty and Services

DO $$
DECLARE
    target_shop_id UUID;
    beauty_salon_subcategory_id UUID;
    shops_updated INTEGER := 0;
    cat_name TEXT;
BEGIN
    RAISE NOTICE 'Starting categorization fix for "Take a leisurely walk" The Second store...';

    -- Find the shop by name and address
    SELECT id INTO target_shop_id
    FROM shops
    WHERE (
        LOWER(name) LIKE '%take a leisurely walk%' 
        OR LOWER(name) LIKE '%second store%'
        OR LOWER(name) LIKE '%the second%'
    )
    AND (
        address LIKE '%Sendagi%' 
        OR address LIKE '%Bunkyo%'
        OR address LIKE '%佐久間ビル%'
        OR phone = '03-5834-8805'
    )
    LIMIT 1;

    IF target_shop_id IS NULL THEN
        RAISE NOTICE 'Shop not found. Trying broader search...';
        -- Try searching by phone number only
        SELECT id INTO target_shop_id
        FROM shops
        WHERE phone = '03-5834-8805'
        LIMIT 1;
    END IF;

    IF target_shop_id IS NULL THEN
        RAISE WARNING 'Shop "Take a leisurely walk" The Second store" not found in database.';
        RAISE NOTICE 'Please verify the shop name and address.';
        RETURN;
    END IF;

    RAISE NOTICE 'Found shop with ID: %', target_shop_id;

    -- Get Beauty Salon category directly (categories table doesn't have parent_id)
    -- Try to find "Beauty Salon" first, then fallback to other beauty categories
    SELECT id INTO beauty_salon_subcategory_id
    FROM categories
    WHERE LOWER(name) = 'beauty salon'
    LIMIT 1;

    -- If not found, try other beauty-related categories
    IF beauty_salon_subcategory_id IS NULL THEN
        SELECT id INTO beauty_salon_subcategory_id
        FROM categories
        WHERE (
            LOWER(name) LIKE '%beauty salon%'
            OR LOWER(name) = 'beauty services'
            OR LOWER(name) LIKE '%beauty and services%'
        )
        ORDER BY 
            CASE 
                WHEN LOWER(name) LIKE '%beauty salon%' THEN 1
                WHEN LOWER(name) = 'beauty services' THEN 2
                WHEN LOWER(name) LIKE '%beauty and services%' THEN 3
                ELSE 4
            END
        LIMIT 1;
    END IF;

    IF beauty_salon_subcategory_id IS NULL THEN
        RAISE WARNING 'Beauty Salon category not found. Please check category names in database.';
        RAISE NOTICE 'Available categories with "beauty" in name:';
        FOR cat_name IN 
            SELECT name FROM categories WHERE LOWER(name) LIKE '%beauty%' LIMIT 10
        LOOP
            RAISE NOTICE '  - %', cat_name;
        END LOOP;
        RETURN;
    END IF;

    RAISE NOTICE 'Found Beauty Salon category with ID: %', beauty_salon_subcategory_id;

    -- Update the shop
    UPDATE shops
    SET 
        category_id = beauty_salon_subcategory_id,
        subcategory = 'Beauty Salon',
        updated_at = NOW()
    WHERE id = target_shop_id
    AND (
        NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'shops' AND column_name = 'deleted_at'
        )
        OR deleted_at IS NULL
    );

    GET DIAGNOSTICS shops_updated = ROW_COUNT;

    IF shops_updated > 0 THEN
        RAISE NOTICE '✅ Successfully updated shop to Beauty Salon category!';
        RAISE NOTICE 'Shop ID: %', target_shop_id;
        RAISE NOTICE 'New Category ID: %', beauty_salon_subcategory_id;
        RAISE NOTICE 'New Subcategory: Beauty Salon';
    ELSE
        RAISE WARNING 'No shops were updated. Shop may be soft-deleted or already in correct category.';
    END IF;

    -- Verification query
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION ===';
    RAISE NOTICE 'Current shop details:';
    
    FOR cat_name IN 
        SELECT c.name 
        FROM shops s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.id = target_shop_id
    LOOP
        RAISE NOTICE '  Category: %', cat_name;
    END LOOP;

END $$;

-- Show the updated shop details
SELECT 
    s.id,
    s.name,
    s.address,
    s.phone,
    c.name as category_name,
    s.subcategory,
    s.category_id
FROM shops s
LEFT JOIN categories c ON s.category_id = c.id
WHERE (
    LOWER(s.name) LIKE '%take a leisurely walk%' 
    OR s.phone = '03-5834-8805'
)
LIMIT 5;

