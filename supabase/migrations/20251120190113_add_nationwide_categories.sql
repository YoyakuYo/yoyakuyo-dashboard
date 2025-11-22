-- Migration: Add 5 new nationwide categories for Japan
-- Hotels & Ryokan, Restaurants & Izakaya, Spas/Onsen/Day-use Bathhouses, Golf Courses & Ranges, Private Karaoke Rooms
-- This migration adds categories and assigns existing shops based on name patterns

-- Step 1: Insert new categories
INSERT INTO categories (name, description) VALUES
    ('Hotels & Ryokan', 'Hotels, ryokan, and traditional Japanese inns'),
    ('Restaurants & Izakaya', 'Restaurants, izakaya, and dining establishments'),
    ('Spas, Onsen & Day-use Bathhouses', 'Spas, hot springs, onsen, and day-use bathhouses'),
    ('Golf Courses & Practice Ranges', 'Golf courses and practice driving ranges'),
    ('Private Karaoke Rooms', 'Private karaoke rooms and karaoke boxes')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Update existing shops to new categories based on comprehensive name patterns
-- Order matters: most specific first, general last

-- 2.1: Hotels & Ryokan (hotels, ryokan, ホテル, 旅館, 民宿, etc.)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Hotels & Ryokan'
)
WHERE category_id IS NULL
  AND (
    -- English keywords
    LOWER(name) LIKE '%hotel%' OR
    LOWER(name) LIKE '%ryokan%' OR
    LOWER(name) LIKE '%inn%' OR
    LOWER(name) LIKE '%resort%' OR
    LOWER(name) LIKE '%lodge%' OR
    LOWER(name) LIKE '%guesthouse%' OR
    LOWER(name) LIKE '%minshuku%' OR
    -- Japanese keywords
    LOWER(name) LIKE '%ホテル%' OR
    LOWER(name) LIKE '%旅館%' OR
    LOWER(name) LIKE '%民宿%' OR
    LOWER(name) LIKE '%リゾート%' OR
    LOWER(name) LIKE '%旅宿%' OR
    LOWER(name) LIKE '%宿泊%' OR
    LOWER(name) LIKE '%旅亭%' OR
    LOWER(name) LIKE '%料亭%' OR
    LOWER(name) LIKE '%温泉旅館%' OR
    LOWER(name) LIKE '%ビジネスホテル%' OR
    LOWER(name) LIKE '%シティホテル%'
  );

-- 2.2: Restaurants & Izakaya (restaurants, izakaya, レストラン, 居酒屋, etc.)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Restaurants & Izakaya'
)
WHERE category_id IS NULL
  AND (
    -- English keywords
    LOWER(name) LIKE '%restaurant%' OR
    LOWER(name) LIKE '%izakaya%' OR
    LOWER(name) LIKE '%dining%' OR
    LOWER(name) LIKE '%bistro%' OR
    LOWER(name) LIKE '%cafe%' OR
    LOWER(name) LIKE '%café%' OR
    LOWER(name) LIKE '%bar%' OR
    LOWER(name) LIKE '%pub%' OR
    LOWER(name) LIKE '%tavern%' OR
    -- Japanese keywords
    LOWER(name) LIKE '%レストラン%' OR
    LOWER(name) LIKE '%居酒屋%' OR
    LOWER(name) LIKE '%食堂%' OR
    LOWER(name) LIKE '%飲食店%' OR
    LOWER(name) LIKE '%料理店%' OR
    LOWER(name) LIKE '%和食%' OR
    LOWER(name) LIKE '%洋食%' OR
    LOWER(name) LIKE '%中華%' OR
    LOWER(name) LIKE '%焼肉%' OR
    LOWER(name) LIKE '%寿司%' OR
    LOWER(name) LIKE '%ラーメン%' OR
    LOWER(name) LIKE '%うどん%' OR
    LOWER(name) LIKE '%そば%' OR
    LOWER(name) LIKE '%カフェ%' OR
    LOWER(name) LIKE '%バー%' OR
    LOWER(name) LIKE '%酒場%' OR
    LOWER(name) LIKE '%飲み屋%'
  );

-- 2.3: Spas, Onsen & Day-use Bathhouses (spas, onsen, スパ, 温泉, 銭湯, etc.)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Spas, Onsen & Day-use Bathhouses'
)
WHERE category_id IS NULL
  AND (
    -- English keywords
    LOWER(name) LIKE '%spa%' OR
    LOWER(name) LIKE '%onsen%' OR
    LOWER(name) LIKE '%hot spring%' OR
    LOWER(name) LIKE '%bathhouse%' OR
    LOWER(name) LIKE '%public bath%' OR
    LOWER(name) LIKE '%sentō%' OR
    LOWER(name) LIKE '%sento%' OR
    -- Japanese keywords
    LOWER(name) LIKE '%スパ%' OR
    LOWER(name) LIKE '%温泉%' OR
    LOWER(name) LIKE '%銭湯%' OR
    LOWER(name) LIKE '%サウナ%' OR
    LOWER(name) LIKE '%岩盤浴%' OR
    LOWER(name) LIKE '%日帰り温泉%' OR
    LOWER(name) LIKE '%天然温泉%' OR
    LOWER(name) LIKE '%健康ランド%' OR
    LOWER(name) LIKE '%スーパー銭湯%' OR
    LOWER(name) LIKE '%温浴施設%' OR
    LOWER(name) LIKE '%湯治場%' OR
    LOWER(name) LIKE '%共同浴場%'
  );

-- 2.4: Golf Courses & Practice Ranges (golf, ゴルフ, ゴルフ場, etc.)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Golf Courses & Practice Ranges'
)
WHERE category_id IS NULL
  AND (
    -- English keywords
    LOWER(name) LIKE '%golf%' OR
    LOWER(name) LIKE '%driving range%' OR
    LOWER(name) LIKE '%practice range%' OR
    LOWER(name) LIKE '%golf course%' OR
    LOWER(name) LIKE '%golf club%' OR
    -- Japanese keywords
    LOWER(name) LIKE '%ゴルフ%' OR
    LOWER(name) LIKE '%ゴルフ場%' OR
    LOWER(name) LIKE '%練習場%' OR
    LOWER(name) LIKE '%打ちっぱなし%' OR
    LOWER(name) LIKE '%ゴルフ練習場%' OR
    LOWER(name) LIKE '%ゴルフクラブ%'
  );

-- 2.5: Private Karaoke Rooms (karaoke, カラオケ, etc.)
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Private Karaoke Rooms'
)
WHERE category_id IS NULL
  AND (
    -- English keywords
    LOWER(name) LIKE '%karaoke%' OR
    LOWER(name) LIKE '%k-box%' OR
    LOWER(name) LIKE '%karaoke box%' OR
    -- Japanese keywords
    LOWER(name) LIKE '%カラオケ%' OR
    LOWER(name) LIKE '%カラオケボックス%' OR
    LOWER(name) LIKE '%カラオケルーム%' OR
    LOWER(name) LIKE '%ボーカル%'
  );

