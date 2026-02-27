-- Fix function search_path mutable security issues
-- Add SET search_path = public to all affected functions to prevent search path attacks

-- ============================================
-- FIX 1: update_booking_revenue_cache
-- ============================================
CREATE OR REPLACE FUNCTION update_booking_revenue_cache()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  -- Update total_revenue for the booking when payment status changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE bookings
    SET total_revenue = (
      SELECT COALESCE(SUM(amount), 0)
      FROM payments
      WHERE booking_id = NEW.booking_id
      AND status = 'completed'
    )
    WHERE id = NEW.booking_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 2: update_users_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 3: update_disputes_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 4: safe_booking_insert
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 5: update_cities_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_cities_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 6: seed_shop_ai_knowledge
-- ============================================
CREATE OR REPLACE FUNCTION seed_shop_ai_knowledge(p_shop_id UUID)
RETURNS void
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_shop shops%ROWTYPE;
    v_service services%ROWTYPE;
    v_opening_hours JSONB;
    v_day TEXT;
    v_day_data JSONB;
    v_open_time TEXT;
    v_close_time TEXT;
    v_hours_text TEXT := '';
BEGIN
    -- Get shop profile (only needed columns to reduce memory)
    SELECT id, name, description, address, phone, email, opening_hours
    INTO v_shop.id, v_shop.name, v_shop.description, v_shop.address, v_shop.phone, v_shop.email, v_shop.opening_hours
    FROM shops
    WHERE id = p_shop_id;

    IF v_shop.id IS NULL THEN
        RAISE EXCEPTION 'Shop not found: %', p_shop_id;
    END IF;

    -- Delete existing knowledge for this shop (more efficient than checking)
    DELETE FROM shop_ai_knowledge WHERE shop_id = p_shop_id;

    -- Insert shop profile knowledge
    INSERT INTO shop_ai_knowledge (shop_id, knowledge_type, content, metadata)
    VALUES (
        p_shop_id,
        'profile',
        COALESCE(v_shop.name || E'\n', '') ||
        COALESCE(v_shop.description || '', '') ||
        COALESCE('Address: ' || v_shop.address || E'\n', '') ||
        COALESCE('Phone: ' || v_shop.phone || E'\n', '') ||
        COALESCE('Email: ' || v_shop.email || '', ''),
        jsonb_build_object(
            'name', v_shop.name,
            'address', v_shop.address,
            'phone', v_shop.phone,
            'email', v_shop.email
        )
    );

    -- Insert services knowledge
    FOR v_service IN SELECT * FROM services WHERE shop_id = p_shop_id
    LOOP
        INSERT INTO shop_ai_knowledge (shop_id, knowledge_type, content, metadata)
        VALUES (
            p_shop_id,
            'service',
            COALESCE(v_service.name || E'\n', '') ||
            COALESCE(v_service.description || '', '') ||
            COALESCE('Duration: ' || v_service.duration_minutes::text || ' minutes' || E'\n', '') ||
            COALESCE('Price: ' || v_service.price::text || ' yen', ''),
            jsonb_build_object(
                'service_id', v_service.id,
                'name', v_service.name,
                'duration_minutes', v_service.duration_minutes,
                'price', v_service.price
            )
        );
    END LOOP;

    -- Insert opening hours knowledge (from shops.opening_hours JSONB)
    v_opening_hours := v_shop.opening_hours;

    IF v_opening_hours IS NOT NULL THEN
        -- Parse JSONB opening_hours structure: {"monday": {"open": "10:00", "close": "19:00"}, ...}
        FOR v_day IN SELECT unnest(ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
        LOOP
            v_day_data := v_opening_hours->v_day;

            IF v_day_data IS NOT NULL AND jsonb_typeof(v_day_data) = 'object' THEN
                v_open_time := v_day_data->>'open';
                v_close_time := v_day_data->>'close';

                IF v_open_time IS NOT NULL AND v_close_time IS NOT NULL THEN
                    v_hours_text := v_hours_text || initcap(v_day) || ': ' || v_open_time || ' - ' || v_close_time || E'\n';
                ELSIF v_open_time IS NULL AND v_close_time IS NULL THEN
                    v_hours_text := v_hours_text || initcap(v_day) || ': Closed' || E'\n';
                END IF;
            END IF;
        END LOOP;

        -- Insert opening hours knowledge
        IF length(v_hours_text) > 0 THEN
            INSERT INTO shop_ai_knowledge (shop_id, knowledge_type, content, metadata)
            VALUES (
                p_shop_id,
                'hours',
                trim(v_hours_text),
                jsonb_build_object('opening_hours', v_opening_hours)
            );
        END IF;
    ELSE
        -- No opening hours data, insert default message
        INSERT INTO shop_ai_knowledge (shop_id, knowledge_type, content, metadata)
        VALUES (
            p_shop_id,
            'hours',
            'Opening hours: Please contact the shop for hours.',
            jsonb_build_object('opening_hours', 'null'::jsonb)
        );
    END IF;

    -- Insert booking rules knowledge
    INSERT INTO shop_ai_knowledge (shop_id, knowledge_type, content, metadata)
    VALUES (
        p_shop_id,
        'booking_rules',
        'Booking rules: Customers can book services through the app. Bookings must be confirmed by the shop.',
        jsonb_build_object('rules', 'standard')
    );

    RAISE NOTICE 'Seeded AI knowledge for shop %', p_shop_id;
END;
$$;

-- ============================================
-- FIX 7: should_handoff_to_human
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 8: count_ai_replies_in_conversation
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 9: enforce_customer_identity
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 10: prevent_line_account_relink
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 11: get_shop_performance_metrics
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 12: update_updated_at_column
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 13: update_shop_rating_stats
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 14: update_shop_thread_on_message
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 15: get_or_create_customer_from_line
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 16: update_shops_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_shops_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 17: update_landing_hero_sections_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_landing_hero_sections_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 18: update_payments_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 19: resolve_sender
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 20: get_shop_revenue_analytics
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 21: get_booking_analytics_by_date
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 22: enforce_booking_integrity
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 23: update_line_user_mappings_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_line_user_mappings_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 24: update_reviews_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 25: get_participant_source
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 26: extract_city_from_address
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 27: handle_ai_auto_reply
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 28: split_availability_on_booking
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 29: clean_old_visitor_data
-- ============================================
-- Already has SECURITY DEFINER, but still needs search_path fix
CREATE OR REPLACE FUNCTION clean_old_visitor_data()
RETURNS void
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM visitor_sessions
  WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
END;
$$;

-- ============================================
-- FIX 30: create_conversation_for_booking
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 31: resolve_customer_identity
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 32: extract_city_from_address_improved
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 33: get_online_owners
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 34: extract_city_from_address_advanced
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 35: auto_create_line_booking
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 36: generate_availability_from_weekly
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 37: check_availability_overlap
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 38: normalize_conversation_customer_id
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 39: extract_city_from_postal_code
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 40: extract_city_ultimate
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 41: extract_city_from_postal_code_complete
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 42: extract_city_from_incomplete_address
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 43: ensure_conversation_participants
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 44: get_or_create_user_from_line_sub
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 45: get_region_from_prefecture
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 46: extract_postal_code
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 47: confirm_pending_booking_transaction
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 48: update_conversation_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 49: update_owner_verification_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_owner_verification_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 50: on_shop_claim
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 51: get_or_create_conversation
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 52: create_shop_notification_on_booking
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 53: update_line_conversations_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_line_conversations_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 54: update_conversation_last_ai_reply
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 55: shops_location_hash
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 56: get_customer_id_from_line
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 57: normalize_prefecture_name
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 58: update_verification_requests_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_verification_requests_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 59: update_services_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 60: update_conversation_last_message_at
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 61: update_subscriptions_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 62: sync_shop_on_verification_approval
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 63: get_category_shop_counts
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 64: get_booking_owner_info
-- ============================================
-- Note: Need to find and update this function

-- ============================================
-- FIX 65: update_bookings_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_booking_revenue_cache() IS 'Updates booking revenue cache when payments change (search_path secured)';
COMMENT ON FUNCTION public.update_users_updated_at() IS 'Updates users updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION update_disputes_updated_at() IS 'Updates disputes updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION update_cities_updated_at() IS 'Updates cities updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION update_updated_at_column() IS 'Generic updated_at column updater (search_path secured)';
COMMENT ON FUNCTION update_shops_updated_at() IS 'Updates shops updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION update_landing_hero_sections_updated_at() IS 'Updates landing_hero_sections updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION update_payments_updated_at() IS 'Updates payments updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION update_line_user_mappings_updated_at() IS 'Updates line_user_mappings updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION update_reviews_updated_at() IS 'Updates reviews updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION clean_old_visitor_data() IS 'Clean visitor data older than 90 days to manage storage (search_path secured)';
COMMENT ON FUNCTION update_conversation_updated_at() IS 'Updates conversation updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION update_owner_verification_updated_at() IS 'Updates owner_verification updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION update_line_conversations_updated_at() IS 'Updates line_conversations updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION update_verification_requests_updated_at() IS 'Updates verification_requests updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION update_services_updated_at() IS 'Updates services updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION update_subscriptions_updated_at() IS 'Updates subscriptions updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION update_bookings_updated_at() IS 'Updates bookings updated_at timestamp (search_path secured)';
COMMENT ON FUNCTION seed_shop_ai_knowledge(UUID) IS 'Seed AI knowledge from shop data (profile, services, hours) (search_path secured)';

-- =================================================================================
-- REMAINING FUNCTIONS TO FIX
-- =================================================================================
-- The following functions still need their search_path fixed. They were not found
-- in the current migration files and may need to be located and updated manually:
--
-- - safe_booking_insert
-- - should_handoff_to_human
-- - count_ai_replies_in_conversation
-- - enforce_customer_identity
-- - prevent_line_account_relink
-- - update_shop_rating_stats
-- - update_shop_thread_on_message
-- - get_or_create_customer_from_line
-- - resolve_sender
-- - get_shop_revenue_analytics
-- - get_booking_analytics_by_date
-- - enforce_booking_integrity
-- - get_participant_source
-- - extract_city_from_address
-- - handle_ai_auto_reply
-- - split_availability_on_booking
-- - create_conversation_for_booking
-- - resolve_customer_identity
-- - extract_city_from_address_improved
-- - get_online_owners
-- - extract_city_from_address_advanced
-- - auto_create_line_booking
-- - generate_availability_from_weekly
-- - check_availability_overlap
-- - normalize_conversation_customer_id
-- - extract_city_from_postal_code
-- - extract_city_ultimate
-- - extract_city_from_postal_code_complete
-- - extract_city_from_incomplete_address
-- - ensure_conversation_participants
-- - get_or_create_user_from_line_sub
-- - get_region_from_prefecture
-- - extract_postal_code
-- - confirm_pending_booking_transaction
-- - on_shop_claim
-- - get_or_create_conversation
-- - create_shop_notification_on_booking
-- - update_conversation_last_ai_reply
-- - shops_location_hash
-- - get_customer_id_from_line
-- - normalize_prefecture_name
-- - update_conversation_last_message_at
-- - sync_shop_on_verification_approval
-- - get_category_shop_counts
-- - get_booking_owner_info
--
-- To fix these remaining functions:
-- 1. Search for each function in the migrations directory
-- 2. Add "SET search_path = public" after the function declaration
-- 3. Test the migration
--
-- Example pattern to fix remaining functions:
-- CREATE OR REPLACE FUNCTION function_name(...)
-- RETURNS ...
-- SET search_path = public  -- Add this line
-- AS $$ ... $$ LANGUAGE plpgsql;