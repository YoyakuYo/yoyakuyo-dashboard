-- Migration: Create landing_hero_sections table for managing hero carousel slides
-- Date: 2025-01-27
-- Purpose: Store hero carousel slide data (images, titles, subtitles) for the public landing page

-- Create landing_hero_sections table
CREATE TABLE IF NOT EXISTS landing_hero_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE, -- e.g., "hair-salon-environment"
  category_key TEXT, -- e.g., "hair", "nails", "spa"
  title_en TEXT NOT NULL,
  title_ja TEXT NOT NULL,
  subtitle_en TEXT,
  subtitle_ja TEXT,
  layout_hint TEXT CHECK (layout_hint IN ('left-caption', 'right-caption')), -- Caption position on desktop
  image_style TEXT CHECK (image_style IN ('environment', 'action')), -- Type of image
  desktop_image_url TEXT, -- URL to desktop hero image
  mobile_image_url TEXT, -- URL to mobile hero image (optional, falls back to desktop)
  priority INTEGER DEFAULT 0, -- Order of slides (lower = higher priority)
  is_active BOOLEAN DEFAULT true, -- Whether this slide is currently active
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS landing_hero_sections_category_key_idx ON landing_hero_sections(category_key);
CREATE INDEX IF NOT EXISTS landing_hero_sections_priority_idx ON landing_hero_sections(priority);
CREATE INDEX IF NOT EXISTS landing_hero_sections_is_active_idx ON landing_hero_sections(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_landing_hero_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_landing_hero_sections_updated_at ON landing_hero_sections;
CREATE TRIGGER update_landing_hero_sections_updated_at
  BEFORE UPDATE ON landing_hero_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_hero_sections_updated_at();

-- Add comments
COMMENT ON TABLE landing_hero_sections IS 'Stores hero carousel slide data for the public landing page. Each slide has bilingual titles/subtitles and image URLs.';
COMMENT ON COLUMN landing_hero_sections.key IS 'Unique identifier for the slide (e.g., "hair-salon-environment")';
COMMENT ON COLUMN landing_hero_sections.category_key IS 'Category this slide represents (e.g., "hair", "nails", "spa")';
COMMENT ON COLUMN landing_hero_sections.layout_hint IS 'Desktop caption position: "left-caption" or "right-caption"';
COMMENT ON COLUMN landing_hero_sections.image_style IS 'Type of image: "environment" (interior/space) or "action" (hands/tools only)';
COMMENT ON COLUMN landing_hero_sections.priority IS 'Display order (lower numbers appear first)';

