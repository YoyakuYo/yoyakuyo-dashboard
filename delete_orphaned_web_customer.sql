-- Delete the orphaned WEB customer
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5
-- This customer has:
-- - No bookings
-- - NULL email/full_name in auth.users
-- - LINE email pattern (misclassified)
-- - Appears to be a duplicate/orphaned record

-- Verify it has no bookings first
SELECT 
  'VERIFICATION' as step,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5') as booking_count,
  (SELECT COUNT(*) FROM customers WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5') as customer_exists,
  (SELECT COUNT(*) FROM users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5') as user_exists;

-- Delete from users table
DELETE FROM users 
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Delete from customers table
DELETE FROM customers 
WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Verify deletion
SELECT 
  'AFTER DELETION' as step,
  (SELECT COUNT(*) FROM customers WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5') as customer_exists,
  (SELECT COUNT(*) FROM users WHERE id = '78fea290-ef9a-43c8-96d6-90460c04efe5') as user_exists,
  '✅ Deleted' as status;

