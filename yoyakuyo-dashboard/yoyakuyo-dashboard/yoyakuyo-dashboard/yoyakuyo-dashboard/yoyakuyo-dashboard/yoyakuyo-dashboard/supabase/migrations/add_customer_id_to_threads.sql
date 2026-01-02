-- Migration: Add customer_id to shop_threads for magic code lookup
-- This enables finding threads by customer_id (from magic code)

ALTER TABLE shop_threads
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS shop_threads_customer_id_idx ON shop_threads(customer_id) WHERE customer_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN shop_threads.customer_id IS 'Customer ID for magic code lookup - links to customers table';

