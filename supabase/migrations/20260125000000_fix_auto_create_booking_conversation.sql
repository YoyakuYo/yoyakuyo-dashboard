-- ====================================================================
-- FIX: Auto-create booking conversations even when canonical IDs are missing
-- ====================================================================
-- This migration updates the auto-create trigger to infer a customer_id
-- from the available profile or email data before calling
-- get_or_create_conversation, and removes the strict WHEN clause so the
-- trigger can run for all inserts.
-- ====================================================================

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

  v_customer_id := COALESCE(NEW.customer_id, NEW.customer_profile_id);

  IF v_customer_id IS NULL AND NEW.customer_email IS NOT NULL THEN
    v_normalized_email := LOWER(TRIM(NEW.customer_email));
  END IF;

  IF v_customer_id IS NULL
     AND v_normalized_email IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'customer_profiles'
         AND column_name = 'email'
     )
  THEN
    SELECT id INTO v_customer_id
    FROM customer_profiles
    WHERE LOWER(email) = v_normalized_email
    LIMIT 1;
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

DROP TRIGGER IF EXISTS trigger_auto_create_booking_conversation ON bookings;
CREATE TRIGGER trigger_auto_create_booking_conversation
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_booking_conversation();

COMMENT ON FUNCTION auto_create_booking_conversation() IS
  'Automatically creates customer_owner conversation when a booking is created';
