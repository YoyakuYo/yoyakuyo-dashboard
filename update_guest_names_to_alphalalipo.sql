-- Update guest customer names to "Alphalalipo"

UPDATE customers 
SET name = 'Alphalalipo'
WHERE id = '55a0b4bb-1a8c-41df-a41c-9f8c7699ed6d';

UPDATE customers 
SET name = 'Alphalalipo'
WHERE id = '457a3ad8-e207-4e2c-b66a-606138ed977c';

-- Verify the updates
SELECT 
  id as customer_id,
  role,
  email,
  name as updated_name,
  '✅ Updated' as status
FROM customers
WHERE id IN ('55a0b4bb-1a8c-41df-a41c-9f8c7699ed6d', '457a3ad8-e207-4e2c-b66a-606138ed977c');

