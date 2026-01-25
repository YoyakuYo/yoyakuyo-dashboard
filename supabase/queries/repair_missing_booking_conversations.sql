-- ============================================================================
-- ONE-TIME REPAIR: Backfill missing conversations for existing bookings
-- ============================================================================
-- Fixes bookings where bookings.conversation_id is NULL by:
-- 1) Inserting a conversation row for bookings that do not already have one
-- 2) Updating bookings.conversation_id to the matching conversations.id
--
-- Safe to re-run: the INSERT only creates rows when no conversation exists for the booking.
-- ============================================================================

-- IMPORTANT:
-- If you get `column b.conversation_id does not exist`, first apply:
-- `supabase/migrations/20260125014000_add_bookings_conversation_id.sql`

-- 1) Create missing conversations (only where none exists yet)
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
  v_has_shop_customer_ref_unique boolean;
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
  SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_shop_id_customer_ref_key')
    INTO v_has_shop_customer_ref_unique;

  IF v_has_shop_id AND v_has_customer_id AND v_has_booking_id THEN
    -- Insert only for bookings that don't already have a conversation row.
    -- We adapt to whichever columns exist in this environment.
    IF v_has_type AND v_has_customer_type AND v_has_customer_ref AND v_has_conversation_type AND v_has_target_type AND v_has_target_id AND v_has_ai_mode THEN
      IF v_has_shop_customer_ref_unique THEN
        EXECUTE $sql$
        INSERT INTO conversations (
          type, shop_id, customer_id, booking_id,
          customer_type, customer_ref,
          conversation_ai_mode, conversation_type, target_type, target_id
        )
        SELECT
          'customer_owner'::conversation_type,
          b.shop_id,
          u.id,
          b.id,
          CASE (cu.role::text)
            WHEN 'line' THEN 'line'::customer_type_enum
            WHEN 'web' THEN 'web'::customer_type_enum
            WHEN 'guest' THEN 'guest'::customer_type_enum
            ELSE 'guest'::customer_type_enum
          END,
          COALESCE(
            NULLIF(cu.line_user_id, ''),
            NULLIF(('U' || cu.auth_user_id::text), ''),
            NULLIF(cu.auth_user_id::text, ''),
            cu.id::text
          ),
          'owner_staff_ai',
          'booking_owner'::conversation_type_enum,
          'shop'::target_type_enum,
          b.shop_id::text
        FROM bookings b
        JOIN customers cu ON cu.id = b.customer_id
        LEFT JOIN public.users u ON u.id = cu.auth_user_id
        LEFT JOIN conversations cx ON cx.booking_id = b.id
        LEFT JOIN conversations cy
          ON cy.shop_id = b.shop_id
         AND cy.customer_ref = COALESCE(
           NULLIF(cu.line_user_id, ''),
           NULLIF(('U' || cu.auth_user_id::text), ''),
           NULLIF(cu.auth_user_id::text, ''),
           cu.id::text
         )
        WHERE cx.id IS NULL
          AND cy.id IS NULL
        ON CONFLICT ON CONSTRAINT conversations_shop_id_customer_ref_key DO NOTHING
      $sql$;
      ELSE
        EXECUTE $sql$
        INSERT INTO conversations (
          type, shop_id, customer_id, booking_id,
          customer_type, customer_ref,
          conversation_ai_mode, conversation_type, target_type, target_id
        )
        SELECT
          'customer_owner'::conversation_type,
          b.shop_id,
          u.id,
          b.id,
          CASE (cu.role::text)
            WHEN 'line' THEN 'line'::customer_type_enum
            WHEN 'web' THEN 'web'::customer_type_enum
            WHEN 'guest' THEN 'guest'::customer_type_enum
            ELSE 'guest'::customer_type_enum
          END,
          COALESCE(
            NULLIF(cu.line_user_id, ''),
            NULLIF(('U' || cu.auth_user_id::text), ''),
            NULLIF(cu.auth_user_id::text, ''),
            cu.id::text
          ),
          'owner_staff_ai',
          'booking_owner'::conversation_type_enum,
          'shop'::target_type_enum,
          b.shop_id::text
        FROM bookings b
        JOIN customers cu ON cu.id = b.customer_id
        LEFT JOIN public.users u ON u.id = cu.auth_user_id
        LEFT JOIN conversations cx ON cx.booking_id = b.id
        LEFT JOIN conversations cy
          ON cy.shop_id = b.shop_id
         AND cy.customer_ref = COALESCE(
           NULLIF(cu.line_user_id, ''),
           NULLIF(('U' || cu.auth_user_id::text), ''),
           NULLIF(cu.auth_user_id::text, ''),
           cu.id::text
         )
        WHERE cx.id IS NULL
          AND cy.id IS NULL
      $sql$;
      END IF;
    ELSIF v_has_type THEN
      -- Minimal viable insert for legacy schema: satisfy NOT NULL conversations.type
      EXECUTE $sql$
        INSERT INTO conversations (type, shop_id, customer_id, booking_id)
        SELECT
          'customer_owner'::conversation_type,
          b.shop_id,
          b.customer_id,
          b.id
        FROM bookings b
        LEFT JOIN conversations cx ON cx.booking_id = b.id
        WHERE cx.id IS NULL
      $sql$;
    ELSE
      -- Minimal insert when conversations.type does not exist
      EXECUTE $sql$
        INSERT INTO conversations (shop_id, customer_id, booking_id)
        SELECT
          b.shop_id,
          b.customer_id,
          b.id
        FROM bookings b
        LEFT JOIN conversations cx ON cx.booking_id = b.id
        WHERE cx.id IS NULL
      $sql$;
    END IF;
  ELSE
    RAISE NOTICE 'Skipping repair insert: conversations does not have required columns (shop_id, customer_id, booking_id).';
  END IF;
END $$;

-- 2) Back-link bookings to conversations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'conversation_id'
  ) THEN
    -- Prefer exact match by booking_id; fallback to shop_id+customer_ref when available/unique.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='conversations' AND column_name='customer_ref'
    ) THEN
      UPDATE bookings b
      SET conversation_id = conv.id
      FROM customers cu
      CROSS JOIN LATERAL (
        SELECT c.id
        FROM conversations c
        WHERE (c.booking_id = b.id)
           OR (
             c.shop_id = b.shop_id
             AND c.customer_ref = COALESCE(
               NULLIF(cu.line_user_id, ''),
               NULLIF(cu.auth_user_id::text, ''),
               cu.id::text
             )
           )
        ORDER BY (c.booking_id = b.id) DESC, c.id ASC
        LIMIT 1
      ) conv
      WHERE b.customer_id = cu.id
        AND b.conversation_id IS NULL
        AND conv.id IS NOT NULL;
    ELSE
      UPDATE bookings b
      SET conversation_id = c.id
      FROM conversations c
      WHERE b.id = c.booking_id
        AND b.conversation_id IS NULL;
    END IF;
  ELSE
    RAISE NOTICE 'Skipping bookings back-link: bookings.conversation_id does not exist yet.';
  END IF;
END $$;

