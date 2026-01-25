-- ============================================================================
-- SAFETY NET: Ensure every booking has a linked conversation_id
-- ============================================================================
-- Why:
-- - Guest bookings were being created without a corresponding conversation.
-- - We need a DB-level backstop so bookings and conversations are always linked.
--
-- Behavior:
-- - After a booking is inserted, if bookings.conversation_id is NULL:
--   - Reuse an existing conversations row for that booking_id if present
--   - Otherwise create a new conversations row:
--     - always includes (shop_id, customer_id, booking_id)
--     - includes legacy required columns like conversations.type when present (set to 'customer_owner')
--     - includes internal-messaging columns (customer_type/customer_ref/target_*/conversation_*) when present
--   - Update bookings.conversation_id to the conversation id
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'conversation_id'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'customer_id'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'booking_id'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'shop_id'
  )
  THEN
    -- Function: create or reuse a conversation for the inserted booking, then back-link booking.conversation_id
    CREATE OR REPLACE FUNCTION create_conversation_for_booking()
    RETURNS trigger AS $fn$
    DECLARE
      v_conversation_id uuid;
      v_has_status boolean;
      v_has_type boolean;
      v_has_customer_type boolean;
      v_has_customer_ref boolean;
      v_has_conversation_type boolean;
      v_has_target_type boolean;
      v_has_target_id boolean;
      v_has_ai_mode boolean;
      v_customer_role text;
      v_customer_ref text;
      v_user_id uuid;
    BEGIN
      IF NEW.conversation_id IS NULL THEN
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'status'
        ) INTO v_has_status;

        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'type'
        ) INTO v_has_type;

        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'customer_type'
        ) INTO v_has_customer_type;

        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'customer_ref'
        ) INTO v_has_customer_ref;

        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'conversation_type'
        ) INTO v_has_conversation_type;

        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'target_type'
        ) INTO v_has_target_type;

        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'target_id'
        ) INTO v_has_target_id;

        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'conversation_ai_mode'
        ) INTO v_has_ai_mode;

        -- Prefer reusing an existing conversation for this booking if it already exists
        SELECT id INTO v_conversation_id
        FROM conversations
        WHERE booking_id = NEW.id
        LIMIT 1;

        IF v_conversation_id IS NULL THEN
          -- Attempt to enrich with customer role/ref when internal-messaging columns exist
          IF v_has_customer_type OR v_has_customer_ref THEN
            SELECT
              role::text,
              COALESCE(NULLIF(line_user_id, ''), NULLIF(('U' || auth_user_id::text), ''), NULLIF(auth_user_id::text, ''), id::text)
            INTO v_customer_role, v_customer_ref
            FROM customers
            WHERE id = NEW.customer_id;
          END IF;

          -- conversations.customer_id in this project may FK to public.users, not public.customers.
          -- Only set it when we can resolve a real users.id (web customers).
          SELECT auth_user_id INTO v_user_id
          FROM customers
          WHERE id = NEW.customer_id;
          IF v_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = v_user_id) THEN
            v_user_id := NULL;
          END IF;

          -- If the schema enforces UNIQUE(shop_id, customer_ref), reuse that conversation instead of inserting.
          IF v_conversation_id IS NULL
             AND v_has_customer_ref
             AND EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_shop_id_customer_ref_key')
          THEN
            SELECT id INTO v_conversation_id
            FROM conversations
            WHERE shop_id = NEW.shop_id
              AND customer_ref = COALESCE(v_customer_ref, NEW.customer_id::text)
            LIMIT 1;
          END IF;

          -- Build inserts based on which columns exist.
          IF v_has_type AND v_has_customer_type AND v_has_customer_ref AND v_has_conversation_type AND v_has_target_type AND v_has_target_id AND v_has_ai_mode THEN
            BEGIN
              EXECUTE
                'INSERT INTO conversations (type, shop_id, customer_id, booking_id, customer_type, customer_ref, conversation_ai_mode, conversation_type, target_type, target_id) ' ||
                'VALUES ($1, $2, $3, $4, $5::customer_type_enum, $6, $7, $8::conversation_type_enum, $9::target_type_enum, $10) RETURNING id'
              INTO v_conversation_id
              USING
                'customer_owner'::conversation_type,
                NEW.shop_id,
                v_user_id,
                NEW.id,
                CASE COALESCE(v_customer_role, 'guest')
                  WHEN 'line' THEN 'line'
                  WHEN 'web' THEN 'web'
                  WHEN 'guest' THEN 'guest'
                  ELSE 'guest'
                END,
                COALESCE(v_customer_ref, NEW.customer_id::text),
                'owner_staff_ai',
                'booking_owner',
                'shop',
                NEW.shop_id::text;
            EXCEPTION
              WHEN unique_violation THEN
                -- Reuse existing conversation under UNIQUE(shop_id, customer_ref) if present.
                IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_shop_id_customer_ref_key') THEN
                  SELECT id INTO v_conversation_id
                  FROM conversations
                  WHERE shop_id = NEW.shop_id
                    AND customer_ref = COALESCE(v_customer_ref, NEW.customer_id::text)
                  LIMIT 1;
                END IF;
            END;
          ELSIF v_has_type AND v_has_status THEN
            EXECUTE
              'INSERT INTO conversations (type, customer_id, booking_id, shop_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING id'
            INTO v_conversation_id
            USING 'customer_owner'::conversation_type, v_user_id, NEW.id, NEW.shop_id, 'open';
          ELSIF v_has_type THEN
            EXECUTE
              'INSERT INTO conversations (type, customer_id, booking_id, shop_id) VALUES ($1, $2, $3, $4) RETURNING id'
            INTO v_conversation_id
            USING 'customer_owner'::conversation_type, v_user_id, NEW.id, NEW.shop_id;
          ELSIF v_has_status THEN
            EXECUTE
              'INSERT INTO conversations (customer_id, booking_id, shop_id, status) VALUES ($1, $2, $3, $4) RETURNING id'
            INTO v_conversation_id
            USING v_user_id, NEW.id, NEW.shop_id, 'open';
          ELSE
            EXECUTE
              'INSERT INTO conversations (customer_id, booking_id, shop_id) VALUES ($1, $2, $3) RETURNING id'
            INTO v_conversation_id
            USING v_user_id, NEW.id, NEW.shop_id;
          END IF;
        END IF;

        UPDATE bookings
        SET conversation_id = v_conversation_id
        WHERE id = NEW.id
          AND conversation_id IS NULL;
      END IF;

      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_create_conversation ON bookings;

    CREATE TRIGGER trg_create_conversation
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_conversation_for_booking();
  ELSE
    RAISE NOTICE 'Skipping trg_create_conversation: required columns not present (bookings.conversation_id and conversations.{customer_id,booking_id,shop_id})';
  END IF;
END $$;

