-- Test if conversations exist for web customer
-- Run this in Supabase SQL Editor

-- Check all conversations for this web customer
SELECT 
  id,
  shop_id,
  customer_type,
  customer_ref,
  created_at,
  last_message_at
FROM conversations
WHERE customer_type = 'web'
  AND customer_ref = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
ORDER BY created_at DESC;

-- Check if customer exists in customers table
SELECT 
  id,
  role,
  created_at
FROM customers
WHERE id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

-- Check all conversations (for debugging)
SELECT 
  id,
  shop_id,
  customer_type,
  customer_ref,
  created_at
FROM conversations
ORDER BY created_at DESC
LIMIT 10;

