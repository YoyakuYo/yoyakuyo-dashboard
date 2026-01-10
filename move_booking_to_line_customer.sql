-- Move ALL bookings from guest customer to LINE customer
-- Current bookings customer_id: 9bc12391-4116-4e4e-941b-e4606d8dfb16 (guest/placeholder)
-- Target LINE customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5

-- Check the current booking state (before update) - ALL bookings
SELECT 
    'CURRENT BOOKING STATE' as check_type,
    b.id as booking_id,
    b.customer_id as current_customer_id,
    b.date,
    b.start_time,
    b.status,
    b.source,
    b.channel,
    c_current.role as current_customer_role,
    c_current.email as current_customer_email,
    cp_current.line_display_name as current_display_name
FROM bookings b
JOIN customers c_current ON c_current.id = b.customer_id
LEFT JOIN customer_profiles cp_current ON cp_current.id = c_current.id
WHERE b.customer_id = '9bc12391-4116-4e4e-941b-e4606d8dfb16'
ORDER BY b.date DESC, b.start_time DESC;

-- Count how many bookings will be moved
SELECT 
    'BOOKINGS TO MOVE' as check_type,
    COUNT(*) as total_bookings_to_move
FROM bookings
WHERE customer_id = '9bc12391-4116-4e4e-941b-e4606d8dfb16';

-- Verify the target LINE customer exists and has correct data
SELECT 
    'TARGET LINE CUSTOMER' as check_type,
    c.id as line_customer_id,
    c.role,
    c.line_user_id,
    cp.line_display_name,
    cp.full_name,
    cp.email
FROM customers c
LEFT JOIN customer_profiles cp ON cp.id = c.id
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Update ALL bookings to use LINE customer ID
-- This will make all bookings appear as LINE bookings with the LINE customer's actual name
UPDATE bookings
SET 
    customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5',  -- LINE customer ID
    source = 'line',  -- Ensure source is 'line'
    channel = 'line'   -- Ensure channel matches source (required constraint)
WHERE customer_id = '9bc12391-4116-4e4e-941b-e4606d8dfb16';  -- Old guest customer ID - ALL bookings

-- Verify the update (after) - ALL moved bookings
SELECT 
    'UPDATED BOOKING STATE' as check_type,
    b.id as booking_id,
    b.customer_id as new_customer_id,
    b.date,
    b.start_time,
    b.status,
    b.source,
    b.channel,
    c_new.role as new_customer_role,
    c_new.line_user_id,
    cp_new.line_display_name as new_display_name,
    cp_new.full_name as new_full_name,
    cp_new.email as new_email
FROM bookings b
JOIN customers c_new ON c_new.id = b.customer_id
LEFT JOIN customer_profiles cp_new ON cp_new.id = c_new.id
WHERE b.customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  AND b.id IN (
    '610b2d40-2813-46cb-beea-6ade2f7fdcc2',
    '5810f19f-44c6-4707-a973-95d543d53642',
    '2b2960c6-acff-4962-a10b-255a820dcccc',
    'c886444e-475d-4f5c-9b95-c56389f071ca',
    'bca07608-bb95-43e2-b3aa-3a1c4fdbaabd',
    '2445af07-03fa-4539-844d-44d9a2aa411b',
    'c540f4b1-93f5-436a-8595-6ff29147fba8',
    '85207679-424c-42b4-bb20-a757b325acc0',
    '03f44fc2-5d05-4062-a8cc-4a2d7cc69926',
    '0bc2985b-1db3-4466-8f2f-a023ea48c739'
  )
ORDER BY b.date DESC, b.start_time DESC;

