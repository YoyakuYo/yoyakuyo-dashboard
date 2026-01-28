-- ====================================================================
-- FIX: Update triggers to use customer_id instead of customer_profile_id
-- ====================================================================
-- The bookings table uses customer_id (from unified customers table)
-- Guests don't have profiles, so customer_profile_id doesn't exist
-- ====================================================================

-- Fix auto_create_line_booking function
CREATE OR REPLACE FUNCTION auto_create_line_booking()
RETURNS TRIGGER AS $$
DECLARE
  line_user_id_value TEXT;
BEGIN
  -- Check if the booking has a customer_id
  IF NEW.customer_id IS NOT NULL THEN
    -- Look up the customer in the customers table to get line_user_id
    -- Only LINE customers have line_user_id (guests and web customers have NULL)
    SELECT c.line_user_id INTO line_user_id_value
    FROM customers c
    WHERE c.id = NEW.customer_id
      AND c.line_user_id IS NOT NULL
      AND c.role = 'line';
    
    -- If LINE user ID found, create line_bookings record
    IF line_user_id_value IS NOT NULL THEN
      -- Check if line_bookings record already exists (avoid duplicates)
      IF NOT EXISTS (
        SELECT 1 FROM line_bookings 
        WHERE booking_id = NEW.id 
          AND line_user_id = line_user_id_value
      ) THEN
        BEGIN
          INSERT INTO line_bookings (booking_id, line_user_id)
          VALUES (NEW.id, line_user_id_value);
          
          RAISE NOTICE 'Auto-created line_bookings record for booking % and LINE user %', NEW.id, line_user_id_value;
        EXCEPTION WHEN unique_violation THEN
          -- Ignore if already exists (race condition)
          RAISE NOTICE 'line_bookings record already exists for booking % and LINE user %', NEW.id, line_user_id_value;
        END;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix auto_create_booking_conversation function
CREATE OR REPLACE FUNCTION auto_create_booking_conversation()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_conversation_id UUID;
  v_customer_id UUID;
  v_normalized_email TEXT;
BEGIN
  SELECT owner_user_id INTO v_owner_id
  FROM shops
  WHERE id = NEW.shop_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Use customer_id directly (no customer_profile_id field exists)
  -- All customers (guest, line, web) use the unified customers table
  v_customer_id := NEW.customer_id;

  IF v_customer_id IS NULL AND NEW.customer_email IS NOT NULL THEN
    v_normalized_email := LOWER(TRIM(NEW.customer_email));
  END IF;

  IF v_customer_id IS NULL
     AND v_normalized_email IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'customers'
         AND column_name = 'email'
     )
  THEN
    SELECT id INTO v_customer_id
    FROM customers
    WHERE LOWER(email) = v_normalized_email
    LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT get_or_create_conversation(
    'customer_owner'::conversation_type,
    NEW.shop_id,
    v_customer_id,
    v_owner_id,
    NULL
  ) INTO v_conversation_id;

  RAISE NOTICE 'Auto-created conversation % for booking % (customer: %, owner: %)',
    v_conversation_id, NEW.id, v_customer_id, v_owner_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_create_line_booking() IS 'Automatically creates line_bookings record when a booking is created for a LINE user (uses customer_id from unified customers table)';
COMMENT ON FUNCTION auto_create_booking_conversation() IS 'Automatically creates customer_owner conversation when a booking is created (uses customer_id from unified customers table)';
