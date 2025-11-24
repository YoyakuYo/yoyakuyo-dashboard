-- Migration: Add customer ID system (Mario X44 format) and magic code
-- This enables permanent customer identification without email

-- Add customer_id_display (e.g., "Mario X44") to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS customer_id_display VARCHAR(50) UNIQUE;

-- Add magic_code (8-char secret code for chat URLs)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS magic_code VARCHAR(8) UNIQUE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS customers_customer_id_display_idx ON customers(customer_id_display) WHERE customer_id_display IS NOT NULL;
CREATE INDEX IF NOT EXISTS customers_magic_code_idx ON customers(magic_code) WHERE magic_code IS NOT NULL;

-- Add comment
COMMENT ON COLUMN customers.customer_id_display IS 'Permanent display ID in format: Name LetterNumber (e.g., Mario X44, Yuki K9)';
COMMENT ON COLUMN customers.magic_code IS '8-character secret code for chat URL: /c/[magic_code]';

