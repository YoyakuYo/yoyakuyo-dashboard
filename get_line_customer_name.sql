-- Get LINE customer name for specific customer_id
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5

-- First, check what columns exist in the bookings table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
ORDER BY ordinal_position;

-- Check customer details
SELECT
  c.id,
  c.role,
  c.created_at,
  la.line_user_id,
  la.created_at as line_account_created_at
FROM public.customers c
LEFT JOIN public.line_accounts la ON la.customer_id = c.id
WHERE c.id = '78fea290-ef9a-43c8-96d6-90460c04efe5';

-- Get customer name from recent bookings (check if customer_name column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'customer_name'
  ) THEN
    RAISE NOTICE 'customer_name column exists - getting customer name from bookings';

    -- Query to get customer name from bookings
    EXECUTE '
      SELECT DISTINCT
        b.customer_name,
        b.customer_email,
        b.customer_phone,
        b.created_at as booking_created_at
      FROM public.bookings b
      WHERE b.customer_id = ''78fea290-ef9a-43c8-96d6-90460c04efe5''
        AND b.customer_name IS NOT NULL
        AND b.customer_name != ''''
      ORDER BY b.created_at DESC
      LIMIT 5
    ';
  ELSE
    RAISE NOTICE 'customer_name column does not exist in bookings table';
  END IF;
END $$;

-- Check conversations/messages for this customer to get their name
SELECT
  conv.id as conversation_id,
  conv.customer_type,
  conv.customer_ref,
  conv.created_at,
  m.content as last_message,
  m.created_at as message_created_at
FROM public.conversations conv
LEFT JOIN public.messages m ON m.conversation_id = conv.id
WHERE conv.customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  AND m.content IS NOT NULL
ORDER BY m.created_at DESC
LIMIT 5;

-- Alternative: Check shop_threads for customer info (conditionally check columns)
DO $$
DECLARE
  has_customer_name BOOLEAN := FALSE;
  has_line_user_id BOOLEAN := FALSE;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shop_threads'
      AND column_name = 'customer_name'
  ) INTO has_customer_name;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shop_threads'
      AND column_name = 'line_user_id'
  ) INTO has_line_user_id;

  RAISE NOTICE 'shop_threads has_customer_name: %, has_line_user_id: %', has_customer_name, has_line_user_id;

  -- Build dynamic query based on available columns
  IF has_customer_name OR has_line_user_id THEN
    DECLARE
      select_columns TEXT := 'st.booking_id, st.customer_id, st.created_at';
    BEGIN
      IF has_line_user_id THEN
        select_columns := select_columns || ', st.line_user_id';
      END IF;

      IF has_customer_name THEN
        select_columns := select_columns || ', st.customer_name';
      END IF;

      EXECUTE '
        SELECT ' || select_columns || '
        FROM public.shop_threads st
        WHERE st.customer_id = ''78fea290-ef9a-43c8-96d6-90460c04efe5''
        ORDER BY st.created_at DESC
        LIMIT 5
      ';
    END;
  ELSE
    RAISE NOTICE 'shop_threads table exists but does not have customer_name or line_user_id columns';

    -- Show what columns do exist
    EXECUTE '
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = ''public''
        AND table_name = ''shop_threads''
      ORDER BY ordinal_position
    ';
  END IF;
END $$;