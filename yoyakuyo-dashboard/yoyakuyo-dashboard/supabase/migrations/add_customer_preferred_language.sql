-- Migration: Add preferred_language to customers table
-- This allows storing each customer's preferred language permanently

-- Add preferred_language column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS customers_preferred_language_idx ON customers(preferred_language) WHERE preferred_language IS NOT NULL;

-- Add comment
COMMENT ON COLUMN customers.preferred_language IS 'ISO 639-1 language code (e.g., ja, en, zh, es, etc.) - auto-detected from first message';

