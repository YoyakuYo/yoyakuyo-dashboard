-- ============================================================================
-- FIX: Remove customer_email reference from booking trigger
-- ============================================================================
-- The auto_create_booking_conversation trigger was trying to access NEW.customer_email
-- but this column may not exist or may not be populated at trigger time.
-- We remove this logic since customer information should come from the customer_id FK.
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_booking_conversation()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_conversation_id UUID;
  v_customer_id UUID;
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

  -- If we don't have a customer_id, skip conversation creation
  -- (Customer information should be available through the customer_id foreign key)
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

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_auto_create_booking_conversation ON bookings;

CREATE TRIGGER trigger_auto_create_booking_conversation
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_booking_conversation();

COMMENT ON FUNCTION auto_create_booking_conversation() IS
  'Automatically creates customer_owner conversation when a booking is created. Fixed to avoid customer_email references.';