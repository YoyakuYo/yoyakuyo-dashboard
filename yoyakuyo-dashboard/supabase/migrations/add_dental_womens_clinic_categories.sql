-- Migration: Add Dental Clinic and Women's Clinic categories
-- Run this migration to add new medical categories

-- Step 1: Insert new categories
INSERT INTO categories (name, description) VALUES
    ('Dental Clinic', 'Dental care and oral health services'),
    ('Women''s Clinic', 'Gynecology and women''s health services')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Update existing shops to new categories based on name patterns
-- Dental Clinic patterns
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Dental Clinic'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%dental%' OR
    LOWER(name) LIKE '%dentist%' OR
    LOWER(name) LIKE '%歯科%' OR
    LOWER(name) LIKE '%デンタル%' OR
    LOWER(name) LIKE '%歯医者%' OR
    LOWER(name) LIKE '%歯科医院%' OR
    LOWER(name) LIKE '%歯科クリニック%'
  );

-- Women's Clinic patterns
UPDATE shops
SET category_id = (
    SELECT id FROM categories WHERE name = 'Women''s Clinic'
)
WHERE category_id IS NULL
  AND (
    LOWER(name) LIKE '%gynecology%' OR
    LOWER(name) LIKE '%gynecologist%' OR
    LOWER(name) LIKE '%women''s clinic%' OR
    LOWER(name) LIKE '%womens clinic%' OR
    LOWER(name) LIKE '%婦人科%' OR
    LOWER(name) LIKE '%女性クリニック%' OR
    LOWER(name) LIKE '%産婦人科%' OR
    LOWER(name) LIKE '%レディースクリニック%' OR
    LOWER(name) LIKE '%女性診療%'
  );

