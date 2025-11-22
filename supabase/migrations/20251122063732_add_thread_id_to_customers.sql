-- Add thread_id column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS thread_id TEXT;
CREATE INDEX IF NOT EXISTS idx_customers_thread_id ON customers(thread_id) WHERE thread_id IS NOT NULL;
