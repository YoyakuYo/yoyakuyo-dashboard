-- Check if we can find the original guest names from booking requests
-- This helps identify what the correct names should be

-- Check current guest customers
SELECT 
  c.id as customer_id,
  c.role,
  c.email,
  c.name as current_name,
  c.created_at as customer_created_at,
  -- Find bookings for this guest
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as booking_count,
  -- Get most recent booking
  (SELECT MAX(created_at) FROM bookings WHERE customer_id = c.id) as last_booking_date
FROM customers c
WHERE c.role = 'guest'
ORDER BY c.created_at DESC;

-- If you know the correct names, you can update them manually:
-- UPDATE customers 
-- SET name = 'Correct Name Here'
-- WHERE id = 'customer-id-here';

