-- Migration: Add categories system to shops
-- This migration creates the categories table and adds category support to shops

-- Step 1: Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Insert default categories
INSERT INTO categories (name, description) VALUES
    ('Nail Salon', 'Nail care and manicure services'),
    ('Barbershop', 'Men''s haircuts and grooming'),
    ('Hair Salon', 'Hair styling and coloring services'),
    ('Spa & Massage', 'Spa treatments and massage therapy'),
    ('Eyelash', 'Eyelash extensions and treatments'),
    ('Beauty Salon', 'General beauty and cosmetic services'),
    ('General Salon', 'Multi-service salon'),
    ('Unknown', 'Uncategorized shops')
ON CONFLICT (name) DO NOTHING;

-- Step 3: Add category_id to shops table
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Step 4: Create index for faster lookups
CREATE INDEX IF NOT EXISTS shops_category_id_idx ON shops(category_id);

-- Step 5: Auto-assign existing shops to categories based on name analysis
-- This uses pattern matching to categorize shops
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Nail Salon'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%nail%' OR
    LOWER(name) LIKE '%manicure%' OR
    LOWER(name) LIKE '%pedicure%'
  );

UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Barbershop'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%barber%' OR
    LOWER(name) LIKE '%barbershop%' OR
    LOWER(name) LIKE '%men''s hair%' OR
    LOWER(name) LIKE '%mens hair%'
  );

UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Hair Salon'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%hair%' OR
    LOWER(name) LIKE '%salon%' OR
    LOWER(name) LIKE '%haircut%' OR
    LOWER(name) LIKE '%hair color%' OR
    LOWER(name) LIKE '%haircolor%'
  );

UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Spa & Massage'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%spa%' OR
    LOWER(name) LIKE '%massage%' OR
    LOWER(name) LIKE '%therapy%' OR
    LOWER(name) LIKE '%relaxation%'
  );

UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Eyelash'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%eyelash%' OR
    LOWER(name) LIKE '%lash%' OR
    LOWER(name) LIKE '%extension%'
  );

UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Beauty Salon'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%beauty%' OR
    LOWER(name) LIKE '%cosmetic%' OR
    LOWER(name) LIKE '%makeup%' OR
    LOWER(name) LIKE '%make-up%'
  );

UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'General Salon'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%salon%' OR
    LOWER(name) LIKE '%beauty%'
  );

-- Step 6: Assign remaining shops to 'Unknown' category
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Unknown'
)
WHERE category_id IS NULL;

-- Step 7: Add comment for documentation
COMMENT ON COLUMN shops.category_id IS 'Foreign key reference to categories table';

