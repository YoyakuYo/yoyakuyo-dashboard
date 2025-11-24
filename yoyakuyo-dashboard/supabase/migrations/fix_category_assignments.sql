-- Migration: Fix category assignments with better logic
-- This migration re-assigns all shops to categories using improved patterns and ordering

-- Step 1: Reset all category assignments (set to NULL so we can re-assign)
UPDATE shops
SET category_id = NULL;

-- Step 2: Assign categories in order of specificity (most specific first, general last)
-- Using more flexible patterns that handle variations in shop names

-- 2.1: Eyelash (very specific keywords - keep as is since it works)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Eyelash'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%eyelash%' OR
    LOWER(name) LIKE '%lash%' OR
    LOWER(name) LIKE '%extension%' OR
    LOWER(name) LIKE '%まつげ%' OR
    LOWER(name) LIKE '%エクステ%'
  );

-- 2.2: Nail Salon (more flexible patterns)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Nail Salon'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%nail%' OR
    LOWER(name) LIKE '%nails%' OR
    LOWER(name) LIKE '%manicure%' OR
    LOWER(name) LIKE '%pedicure%' OR
    LOWER(name) LIKE '%ネイル%' OR
    LOWER(name) LIKE '%マニキュア%' OR
    LOWER(name) LIKE '%ネイルサロン%'
  );

-- 2.3: Barbershop (more flexible patterns)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Barbershop'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%barber%' OR
    LOWER(name) LIKE '%barbershop%' OR
    LOWER(name) LIKE '%men''s%' OR
    LOWER(name) LIKE '%mens%' OR
    LOWER(name) LIKE '%理髪%' OR
    LOWER(name) LIKE '%理容%' OR
    LOWER(name) LIKE '%理髪店%' OR
    LOWER(name) LIKE '%理容室%'
  );

-- 2.4: Spa & Massage (more flexible patterns)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Spa & Massage'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%spa%' OR
    LOWER(name) LIKE '%massage%' OR
    LOWER(name) LIKE '%therapy%' OR
    LOWER(name) LIKE '%relaxation%' OR
    LOWER(name) LIKE '%スパ%' OR
    LOWER(name) LIKE '%マッサージ%' OR
    LOWER(name) LIKE '%整体%' OR
    LOWER(name) LIKE '%リラクゼーション%'
  );

-- 2.5: Hair Salon (more flexible - check for "hair" keyword, but also common variations)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Hair Salon'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%hair%' OR
    LOWER(name) LIKE '%haircut%' OR
    LOWER(name) LIKE '%hair color%' OR
    LOWER(name) LIKE '%haircolor%' OR
    LOWER(name) LIKE '%hair salon%' OR
    LOWER(name) LIKE '%ヘア%' OR
    LOWER(name) LIKE '%カット%' OR
    LOWER(name) LIKE '%ヘアサロン%' OR
    LOWER(name) LIKE '%美容室%' OR
    LOWER(name) LIKE '%ヘアカット%'
  );

-- 2.6: Beauty Salon (more flexible - check for "beauty" but allow variations)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Beauty Salon'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%beauty%' OR
    LOWER(name) LIKE '%beauty salon%' OR
    LOWER(name) LIKE '%cosmetic%' OR
    LOWER(name) LIKE '%makeup%' OR
    LOWER(name) LIKE '%make-up%' OR
    LOWER(name) LIKE '%美容%' OR
    LOWER(name) LIKE '%コスメ%' OR
    LOWER(name) LIKE '%美容サロン%' OR
    LOWER(name) LIKE '%エステ%'
  );

-- 2.7: General Salon (catch-all for shops with "salon" that don't match above)
-- This should be last, as it's the most general
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'General Salon'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%salon%' OR
    LOWER(name) LIKE '%サロン%' OR
    LOWER(name) LIKE '%サロン%'
  );

-- Step 3: Assign remaining shops to 'Unknown' category
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Unknown'
)
WHERE category_id IS NULL;

-- Step 4: Log summary
DO $$
DECLARE
    total_shops INTEGER;
    eyelash_count INTEGER;
    nail_count INTEGER;
    barber_count INTEGER;
    spa_count INTEGER;
    beauty_count INTEGER;
    hair_count INTEGER;
    general_count INTEGER;
    unknown_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_shops FROM shops;
    SELECT COUNT(*) INTO eyelash_count FROM shops WHERE category_id = (SELECT id FROM categories WHERE name = 'Eyelash');
    SELECT COUNT(*) INTO nail_count FROM shops WHERE category_id = (SELECT id FROM categories WHERE name = 'Nail Salon');
    SELECT COUNT(*) INTO barber_count FROM shops WHERE category_id = (SELECT id FROM categories WHERE name = 'Barbershop');
    SELECT COUNT(*) INTO spa_count FROM shops WHERE category_id = (SELECT id FROM categories WHERE name = 'Spa & Massage');
    SELECT COUNT(*) INTO beauty_count FROM shops WHERE category_id = (SELECT id FROM categories WHERE name = 'Beauty Salon');
    SELECT COUNT(*) INTO hair_count FROM shops WHERE category_id = (SELECT id FROM categories WHERE name = 'Hair Salon');
    SELECT COUNT(*) INTO general_count FROM shops WHERE category_id = (SELECT id FROM categories WHERE name = 'General Salon');
    SELECT COUNT(*) INTO unknown_count FROM shops WHERE category_id = (SELECT id FROM categories WHERE name = 'Unknown');
    
    RAISE NOTICE 'Category Assignment Summary:';
    RAISE NOTICE 'Total shops: %', total_shops;
    RAISE NOTICE 'Eyelash: %', eyelash_count;
    RAISE NOTICE 'Nail Salon: %', nail_count;
    RAISE NOTICE 'Barbershop: %', barber_count;
    RAISE NOTICE 'Spa & Massage: %', spa_count;
    RAISE NOTICE 'Beauty Salon: %', beauty_count;
    RAISE NOTICE 'Hair Salon: %', hair_count;
    RAISE NOTICE 'General Salon: %', general_count;
    RAISE NOTICE 'Unknown: %', unknown_count;
END $$;

