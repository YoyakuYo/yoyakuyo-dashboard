-- ============================================================================
-- AUTO-CREATE CUSTOMER ↔ OWNER CONVERSATION TRIGGER
-- ============================================================================
-- Automatically creates a conversation when a customer books with an owner
-- ============================================================================

-- Function to auto-create conversation when booking is created
CREATE OR REPLACE FUNCTION auto_create_booking_conversation()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_conversation_id UUID;
BEGIN
  -- Get owner_id from shop
  SELECT owner_user_id INTO v_owner_id
  FROM shops
  WHERE id = NEW.shop_id;
  
  -- Only create conversation if owner exists and customer exists
  IF v_owner_id IS NOT NULL AND (NEW.customer_id IS NOT NULL OR NEW.customer_profile_id IS NOT NULL) THEN
    -- Use customer_id from bookings (prefer customer_id, fallback to customer_profile_id)
    DECLARE
      v_customer_id UUID;
    BEGIN
      v_customer_id := COALESCE(NEW.customer_id, NEW.customer_profile_id);
      
      -- Use get_or_create_conversation function (from unified messaging migration)
      SELECT get_or_create_conversation(
        'customer_owner'::conversation_type,
        NEW.shop_id,
        v_customer_id,  -- customer_id
        v_owner_id,    -- owner_id
        NULL           -- staff_id is null for customer_owner
      ) INTO v_conversation_id;
      
      -- Log for debugging (optional)
      RAISE NOTICE 'Auto-created conversation % for booking % (customer: %, owner: %)', 
        v_conversation_id, NEW.id, v_customer_id, v_owner_id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_create_booking_conversation ON bookings;
CREATE TRIGGER trigger_auto_create_booking_conversation
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.customer_id IS NOT NULL OR NEW.customer_profile_id IS NOT NULL)
  EXECUTE FUNCTION auto_create_booking_conversation();

-- Add comment
COMMENT ON FUNCTION auto_create_booking_conversation() IS 'Automatically creates customer_owner conversation when a booking is created';

