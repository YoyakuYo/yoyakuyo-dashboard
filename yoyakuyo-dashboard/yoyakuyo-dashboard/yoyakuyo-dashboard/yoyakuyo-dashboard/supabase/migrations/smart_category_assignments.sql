-- Smart Category Assignment Migration
-- Uses the actual search keywords from the import script and flexible matching
-- This should properly categorize all 2800+ shops

-- Step 1: Reset all category assignments
UPDATE shops
SET category_id = NULL;

-- Step 2: Assign categories using smart pattern matching
-- Order matters: most specific first, general last

-- 2.1: Eyelash (very specific - keep as is since it works)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Eyelash'
)
WHERE category_id IS NULL
  AND (
    -- English keywords from import script
    name ILIKE '%eyelash%' OR
    name ILIKE '%lash%' OR
    name ILIKE '%extension%' OR
    -- Japanese variations
    name ILIKE '%まつげ%' OR
    name ILIKE '%エクステ%' OR
    name ILIKE '%ラッシュ%'
  );

-- 2.2: Nail Salon (use keywords: "nail salon", "nails" from import script)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Nail Salon'
)
WHERE category_id IS NULL
  AND (
    -- Exact keywords from import script
    name ILIKE '%nail salon%' OR
    name ILIKE '%nails%' OR
    name ILIKE '%nail%' OR
    name ILIKE '%manicure%' OR
    name ILIKE '%pedicure%' OR
    -- Japanese variations
    name ILIKE '%ネイル%' OR
    name ILIKE '%マニキュア%' OR
    name ILIKE '%ネイルサロン%' OR
    name ILIKE '%ネイルアート%'
  );

-- 2.3: Barbershop (use keywords: "barber shop", "barbershop" from import script)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Barbershop'
)
WHERE category_id IS NULL
  AND (
    -- Exact keywords from import script
    name ILIKE '%barber shop%' OR
    name ILIKE '%barbershop%' OR
    name ILIKE '%barber%' OR
    name ILIKE '%men''s%' OR
    name ILIKE '%mens%' OR
    -- Japanese variations
    name ILIKE '%理髪%' OR
    name ILIKE '%理容%' OR
    name ILIKE '%理髪店%' OR
    name ILIKE '%理容室%' OR
    name ILIKE '%バーバー%'
  );

-- 2.4: Spa & Massage (use keywords: "spa", "day spa", "massage", "massage therapy" from import script)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Spa & Massage'
)
WHERE category_id IS NULL
  AND (
    -- Exact keywords from import script
    name ILIKE '%spa%' OR
    name ILIKE '%day spa%' OR
    name ILIKE '%massage%' OR
    name ILIKE '%massage therapy%' OR
    name ILIKE '%therapy%' OR
    name ILIKE '%relaxation%' OR
    -- Japanese variations
    name ILIKE '%スパ%' OR
    name ILIKE '%マッサージ%' OR
    name ILIKE '%整体%' OR
    name ILIKE '%リラクゼーション%' OR
    name ILIKE '%リフレ%'
  );

-- 2.5: Hair Salon (use keywords: "hair salon", "haircut" from import script)
-- Make this more specific - require "hair" keyword, not just "salon"
-- But also be flexible - many Tokyo salons might just be called "Salon" but are hair salons
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Hair Salon'
)
WHERE category_id IS NULL
  AND (
    -- Exact keywords from import script
    name ILIKE '%hair salon%' OR
    name ILIKE '%haircut%' OR
    name ILIKE '%hair cut%' OR
    name ILIKE '%hair%' OR
    name ILIKE '%hair color%' OR
    name ILIKE '%haircolor%' OR
    name ILIKE '%hair styling%' OR
    name ILIKE '%hair styling%' OR
    name ILIKE '%hair design%' OR
    name ILIKE '%hair studio%' OR
    -- Japanese variations
    name ILIKE '%ヘア%' OR
    name ILIKE '%カット%' OR
    name ILIKE '%ヘアサロン%' OR
    name ILIKE '%美容室%' OR
    name ILIKE '%ヘアカット%' OR
    name ILIKE '%ヘアスタイル%' OR
    name ILIKE '%ヘアカラー%' OR
    name ILIKE '%ヘアデザイン%' OR
    -- Common patterns: if it's just "Salon" or "サロン" and imported via "hair salon" keyword, it's likely a hair salon
    -- But we'll catch these in General Salon if they don't match other categories
    (name ILIKE '%salon%' AND name ILIKE '%cut%') OR
    (name ILIKE '%サロン%' AND name ILIKE '%カット%')
  );

-- 2.6: Beauty Salon (use keywords: "beauty salon", "beauty salon tokyo" from import script)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Beauty Salon'
)
WHERE category_id IS NULL
  AND (
    -- Exact keywords from import script
    name ILIKE '%beauty salon%' OR
    name ILIKE '%beauty%' OR
    name ILIKE '%cosmetic%' OR
    name ILIKE '%makeup%' OR
    name ILIKE '%make-up%' OR
    name ILIKE '%make up%' OR
    -- Japanese variations
    name ILIKE '%美容%' OR
    name ILIKE '%コスメ%' OR
    name ILIKE '%美容サロン%' OR
    name ILIKE '%エステ%' OR
    name ILIKE '%エステティック%' OR
    name ILIKE '%ビューティー%'
  );

-- 2.7: General Salon (catch-all for shops with "salon" that don't match above)
-- This should be last, as it's the most general
-- Many shops imported via "beauty salon" or "hair salon" keywords might just be called "Salon"
-- So we'll assign any shop with "salon" that doesn't match more specific categories
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'General Salon'
)
WHERE category_id IS NULL
  AND (
    name ILIKE '%salon%' OR
    name ILIKE '%サロン%'
  );

-- Step 3: Assign remaining shops to 'Unknown' category
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Unknown'
)
WHERE category_id IS NULL;

-- Step 4: Log detailed summary
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
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Smart Category Assignment Summary';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total shops: %', total_shops;
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Eyelash: %', eyelash_count;
    RAISE NOTICE 'Nail Salon: %', nail_count;
    RAISE NOTICE 'Barbershop: %', barber_count;
    RAISE NOTICE 'Spa & Massage: %', spa_count;
    RAISE NOTICE 'Beauty Salon: %', beauty_count;
    RAISE NOTICE 'Hair Salon: %', hair_count;
    RAISE NOTICE 'General Salon: %', general_count;
    RAISE NOTICE 'Unknown: %', unknown_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Categorized: %', (total_shops - unknown_count);
    RAISE NOTICE 'Uncategorized: %', unknown_count;
    RAISE NOTICE '========================================';
END $$;

