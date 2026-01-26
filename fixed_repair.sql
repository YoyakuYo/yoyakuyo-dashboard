-- ============================================================================
-- FIXED REPAIR: Backfill missing conversations for existing bookings
-- ============================================================================
-- Fixed to properly cast enum values
-- ============================================================================

DO $$
DECLARE
  v_has_type boolean;
  v_has_shop_id boolean;
  v_has_customer_id boolean;
  v_has_booking_id boolean;
  v_has_customer_type boolean;
  v_has_customer_ref boolean;
  v_has_conversation_type boolean;
  v_has_target_type boolean;
  v_has_target_id boolean;
  v_has_ai_mode boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='type')
    INTO v_has_type;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='shop_id')
    INTO v_has_shop_id;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='customer_id')
    INTO v_has_customer_id;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='booking_id')
    INTO v_has_booking_id;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='customer_type')
    INTO v_has_customer_type;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='customer_ref')
    INTO v_has_customer_ref;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='conversation_type')
    INTO v_has_conversation_type;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='target_type')
    INTO v_has_target_type;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='target_id')
    INTO v_has_target_id;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='conversation_ai_mode')
    INTO v_has_ai_mode;

  IF v_has_shop_id AND v_has_customer_id AND v_has_booking_id THEN
    IF v_has_type AND v_has_customer_type AND v_has_customer_ref AND v_has_conversation_type AND v_has_target_type AND v_has_target_id AND v_has_ai_mode THEN
      -- Full schema: insert complete conversation records with proper enum casting
      EXECUTE $sql$
        INSERT INTO conversations (type, shop_id, customer_id, booking_id, customer_type, customer_ref, conversation_ai_mode, conversation_type, target_type, target_id)
        SELECT
          'customer_owner'::conversation_type,
          b.shop_id,
          b.customer_id,
          b.id,
          CASE COALESCE(c.role, 'guest')
            WHEN 'line' THEN 'line'::customer_type_enum
            WHEN 'web' THEN 'web'::customer_type_enum
            WHEN 'guest' THEN 'guest'::customer_type_enum
            ELSE 'guest'::customer_type_enum
          END,
          COALESCE(c.line_user_id, c.auth_user_id::text, c.id::text),
          'owner_staff_ai',
          'booking_owner'::conversation_type,
          'shop'::target_type_enum,
          b.shop_id
        FROM bookings b
        LEFT JOIN conversations cx ON cx.booking_id = b.id
        LEFT JOIN customers c ON c.id = b.customer_id
        WHERE cx.id IS NULL
          AND b.customer_id IS NOT NULL
      $sql$;
    END IF;
  END IF;
END $$;

-- 2) Back-link bookings to conversations
UPDATE bookings b
SET conversation_id = c.id
FROM conversations c
WHERE b.conversation_id IS NULL
  AND c.booking_id = b.id;