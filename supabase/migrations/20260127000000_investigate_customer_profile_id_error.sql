-- ====================================================================
-- INVESTIGATE: customer_profile_id error when guests try to book
-- ====================================================================
-- This migration investigates and fixes the "record 'new' has no field 'customer_profile_id'"
-- error that occurs when guest customers try to book.
-- ====================================================================

DO $$
DECLARE
    v_trigger_exists BOOLEAN;
    v_function_definition TEXT;
    v_bookings_has_customer_profile_id BOOLEAN;
BEGIN
    RAISE NOTICE '=== INVESTIGATING CUSTOMER_PROFILE_ID ERROR ===';

    -- Check if customer_profile_id column exists in bookings table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bookings'
          AND column_name = 'customer_profile_id'
    ) INTO v_bookings_has_customer_profile_id;

    RAISE NOTICE 'Bookings table has customer_profile_id column: %', v_bookings_has_customer_profile_id;

    -- Check current trigger function definition
    SELECT pg_get_functiondef(p.oid) INTO v_function_definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'auto_create_booking_conversation';

    IF v_function_definition IS NOT NULL THEN
        RAISE NOTICE 'Current auto_create_booking_conversation function:';
        RAISE NOTICE '%', v_function_definition;

        -- Check if function still references customer_profile_id
        IF v_function_definition ILIKE '%customer_profile_id%' THEN
            RAISE NOTICE '⚠️  WARNING: Function still references customer_profile_id!';
        ELSE
            RAISE NOTICE '✅ Function does not reference customer_profile_id';
        END IF;
    ELSE
        RAISE NOTICE 'Function auto_create_booking_conversation does not exist';
    END IF;

    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND c.relname = 'bookings'
          AND t.tgname = 'trigger_auto_create_booking_conversation'
          AND NOT t.tgisinternal
    ) INTO v_trigger_exists;

    RAISE NOTICE 'Trigger trigger_auto_create_booking_conversation exists: %', v_trigger_exists;

    -- Check trigger definition if it exists
    IF v_trigger_exists THEN
        RAISE NOTICE 'Trigger definition:';
        RAISE NOTICE '%', (
            SELECT pg_get_triggerdef(t.oid)
            FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public'
              AND c.relname = 'bookings'
              AND t.tgname = 'trigger_auto_create_booking_conversation'
              AND NOT t.tgisinternal
        );
    END IF;

END $$;

-- ====================================================================
-- FIX: Ensure auto_create_booking_conversation function uses only customer_id
-- ====================================================================

CREATE OR REPLACE FUNCTION auto_create_booking_conversation()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_conversation_id UUID;
  v_customer_id UUID;
  v_normalized_email TEXT;
BEGIN
  -- Get owner_id from shop
  SELECT owner_user_id INTO v_owner_id
  FROM shops
  WHERE id = NEW.shop_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Use customer_id directly (no customer_profile_id field exists on NEW record)
  -- All customers (guest, line, web) use the unified customers table
  v_customer_id := NEW.customer_id;

  -- If no customer_id but we have customer_email, try to find customer by email
  IF v_customer_id IS NULL AND NEW.customer_email IS NOT NULL THEN
    v_normalized_email := LOWER(TRIM(NEW.customer_email));

    -- Try to find in customer_profiles first (for web customers)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'customer_profiles'
        AND column_name = 'email'
    ) THEN
      SELECT id INTO v_customer_id
      FROM customer_profiles
      WHERE LOWER(email) = v_normalized_email
      LIMIT 1;
    END IF;

    -- If still not found, try customers table
    IF v_customer_id IS NULL THEN
      SELECT id INTO v_customer_id
      FROM customers
      WHERE LOWER(email) = v_normalized_email
      LIMIT 1;
    END IF;
  END IF;

  -- If we still don't have a customer_id, skip conversation creation
  IF v_customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create or get conversation
  SELECT get_or_create_conversation(
    'customer_owner'::conversation_type,
    NEW.shop_id,
    v_customer_id,
    v_owner_id,
    NULL  -- staff_id is null for customer_owner
  ) INTO v_conversation_id;

  RAISE NOTICE 'Auto-created conversation % for booking % (customer: %, owner: %)',
    v_conversation_id, NEW.id, v_customer_id, v_owner_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger without WHEN clause that might reference customer_profile_id
DROP TRIGGER IF EXISTS trigger_auto_create_booking_conversation ON bookings;

CREATE TRIGGER trigger_auto_create_booking_conversation
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_booking_conversation();

COMMENT ON FUNCTION auto_create_booking_conversation() IS
  'Automatically creates customer_owner conversation when a booking is created. Fixed to avoid customer_profile_id references.';