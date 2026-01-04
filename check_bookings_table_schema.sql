-- Check bookings table schema and structure
SELECT 
    'BOOKINGS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
ORDER BY ordinal_position;

-- Check if specific columns exist
SELECT 
    'COLUMN EXISTENCE CHECK' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'booked_for'
    ) THEN '✅ booked_for EXISTS' ELSE '❌ booked_for MISSING' END as booked_for,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'date'
    ) THEN '✅ date EXISTS' ELSE '❌ date MISSING' END as date,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'start_time'
    ) THEN '✅ start_time EXISTS' ELSE '❌ start_time MISSING' END as start_time,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'end_time'
    ) THEN '✅ end_time EXISTS' ELSE '❌ end_time MISSING' END as end_time,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'customer_name'
    ) THEN '✅ customer_name EXISTS' ELSE '❌ customer_name MISSING' END as customer_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'customer_email'
    ) THEN '✅ customer_email EXISTS' ELSE '❌ customer_email MISSING' END as customer_email,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'guest_name'
    ) THEN '✅ guest_name EXISTS' ELSE '❌ guest_name MISSING' END as guest_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'guest_email'
    ) THEN '✅ guest_email EXISTS' ELSE '❌ guest_email MISSING' END as guest_email,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'source'
    ) THEN '✅ source EXISTS' ELSE '❌ source MISSING' END as source,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'channel'
    ) THEN '✅ channel EXISTS' ELSE '❌ channel MISSING' END as channel;

