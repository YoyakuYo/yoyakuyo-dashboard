-- Fix existing conversations created with wrong field names
-- This migration fixes conversations that were created before the booking creation code was fixed

-- Update conversations that have 'type' field but missing conversation_type, target_type, target_id
UPDATE conversations
SET
  conversation_type = CASE
    WHEN type = 'customer_owner' THEN 'booking_owner'::conversation_type_enum
    WHEN type = 'owner_staff' THEN 'booking_owner'::conversation_type_enum
    WHEN type = 'staff_customer' THEN 'booking_owner'::conversation_type_enum
    ELSE 'booking_owner'::conversation_type_enum
  END,
  target_type = 'shop',
  target_id = shop_id::text
WHERE
  conversation_type IS NULL
  AND shop_id IS NOT NULL
  AND booking_id IS NOT NULL;

-- Log the number of conversations updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM conversations
  WHERE conversation_type = 'booking_owner'
  AND target_type = 'shop'
  AND target_id IS NOT NULL;

  RAISE NOTICE 'Fixed % existing conversations with proper conversation_type, target_type, and target_id fields', updated_count;
END $$;

-- Fix any conversations that still have null target_id (ongoing fix)
UPDATE conversations
SET target_id = shop_id::text
WHERE booking_id IS NOT NULL
  AND conversation_type = 'booking_owner'
  AND target_type = 'shop'
  AND target_id IS NULL;

-- Verify that all booking conversations now have the correct fields
DO $$
DECLARE
  missing_fields_count INTEGER;
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM conversations
  WHERE booking_id IS NOT NULL
    AND conversation_type = 'booking_owner'
    AND target_type = 'shop'
    AND target_id IS NOT NULL;

  SELECT COUNT(*) INTO missing_fields_count
  FROM conversations
  WHERE booking_id IS NOT NULL
  AND (conversation_type IS NULL OR target_type IS NULL OR target_id IS NULL);

  RAISE NOTICE 'Booking conversations with proper fields: %', fixed_count;

  IF missing_fields_count > 0 THEN
    RAISE WARNING 'Found % conversations with missing required fields after migration', missing_fields_count;
  ELSE
    RAISE NOTICE 'All booking conversations now have required conversation_type, target_type, and target_id fields';
  END IF;
END $$;