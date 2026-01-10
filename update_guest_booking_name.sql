-- Update LINE customer booking name from placeholder to "barberSOW"
-- Customer ID: 9bc12391-4116-4e4e-941b-e4606d8dfb16

-- First, check the current state
SELECT 
    'CURRENT STATE' as check_type,
    b.id as booking_id,
    b.date,
    b.start_time,
    b.status,
    c.id as customer_id,
    c.role as customer_role,
    c.line_user_id,
    cp.line_display_name,
    cp.full_name,
    cp.email as profile_email
FROM bookings b
JOIN customers c ON c.id = b.customer_id
LEFT JOIN customer_profiles cp ON cp.id = c.id
WHERE c.id = '9bc12391-4116-4e4e-941b-e4606d8dfb16'
   OR c.email = 'guest_9bc12391-4116-4e4e-941b-e4606d8dfb16@example.com'
ORDER BY b.created_at DESC;

-- Update LINE customer profile name to "barberSOW"
-- For LINE customers, name is stored in customer_profiles.line_display_name
UPDATE customer_profiles
SET 
    line_display_name = 'barberSOW',
    full_name = 'barberSOW',
    email = 'barberSOW@example.com',
    updated_at = NOW()
WHERE id = '9bc12391-4116-4e4e-941b-e4606d8dfb16';

-- If customer_profiles doesn't exist, create it
INSERT INTO customer_profiles (id, line_user_id, line_display_name, full_name, email, created_at, updated_at)
SELECT 
    c.id,
    c.line_user_id,
    'barberSOW',
    'barberSOW',
    'barberSOW@example.com',
    NOW(),
    NOW()
FROM customers c
WHERE c.id = '9bc12391-4116-4e4e-941b-e4606d8dfb16'
   OR c.email = 'guest_9bc12391-4116-4e4e-941b-e4606d8dfb16@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM customer_profiles cp WHERE cp.id = c.id
  );

-- Also update customers table email if it has the placeholder
UPDATE customers
SET 
    email = 'barberSOW@example.com'
WHERE (id = '9bc12391-4116-4e4e-941b-e4606d8dfb16'
   OR email = 'guest_9bc12391-4116-4e4e-941b-e4606d8dfb16@example.com')
  AND email LIKE 'guest_%@example.com';

-- Verify the update
SELECT 
    'UPDATED STATE' as check_type,
    b.id as booking_id,
    b.date,
    b.start_time,
    b.status,
    c.id as customer_id,
    c.role as customer_role,
    c.line_user_id,
    cp.line_display_name as display_name,
    cp.full_name,
    cp.email as profile_email
FROM bookings b
JOIN customers c ON c.id = b.customer_id
LEFT JOIN customer_profiles cp ON cp.id = c.id
WHERE c.id = '9bc12391-4116-4e4e-941b-e4606d8dfb16'
ORDER BY b.created_at DESC;

