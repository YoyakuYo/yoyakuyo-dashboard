-- Check if web customer has any conversations
-- Run this in Supabase SQL Editor

-- Web customer ID: e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f

-- 1. Check all conversations for this web customer
SELECT 
  id,
  shop_id,
  customer_type,
  customer_ref,
  created_at,
  last_message_at,
  booking_id
FROM conversations
WHERE customer_type = 'web'
  AND customer_ref = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f'
ORDER BY created_at DESC;

-- 2. Check if customer exists in customers table
SELECT 
  id,
  role,
  created_at
FROM customers
WHERE id = 'e2c762b2-0e98-4bca-bff1-eab3ff6c1d7f';

-- 3. Check ALL web customer conversations (for debugging)
SELECT 
  id,
  shop_id,
  customer_type,
  customer_ref,
  created_at
FROM conversations
WHERE customer_type = 'web'
ORDER BY created_at DESC
LIMIT 20;

-- 4. Check recent conversations (all types) for this shop
SELECT 
  id,
  shop_id,
  customer_type,
  customer_ref,
  created_at
FROM conversations
WHERE shop_id = '0bfa803b-230e-4b80-872e-434c3cbfee7c'
ORDER BY created_at DESC;

