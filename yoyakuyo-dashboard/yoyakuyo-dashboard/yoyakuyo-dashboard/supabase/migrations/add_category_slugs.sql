-- Migration: Add slug field to categories table for stable identifiers
-- This ensures category filtering uses stable slugs instead of display names

-- Add slug column to categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories(slug) WHERE slug IS NOT NULL;

-- Generate slugs for existing categories (lowercase, snake_case)
UPDATE categories
SET slug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', '_'), '&', 'and'), '/', '_'), '-', '_'), '__', '_'))
WHERE slug IS NULL;

-- Ensure all categories have slugs
UPDATE categories
SET slug = CONCAT('category_', id)
WHERE slug IS NULL OR slug = '';

-- Add comment for documentation
COMMENT ON COLUMN categories.slug IS 'Stable identifier for categories (lowercase, snake_case)';
