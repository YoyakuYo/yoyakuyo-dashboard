-- RPC for yoyakuyo-api LINE/web booking path. Columns already defined in add_customer_id_system.sql.

CREATE OR REPLACE FUNCTION ensure_customer_display_id(
  p_customer_id UUID,
  p_display_name TEXT DEFAULT 'Customer'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display VARCHAR(50);
  v_magic VARCHAR(8);
  v_first_name TEXT;
  v_letter CHAR(1);
  v_num TEXT;
  v_attempt INT := 0;
  v_exists BOOLEAN;
  v_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_i INT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM customers
    WHERE id = p_customer_id
      AND customer_id_display IS NOT NULL
      AND magic_code IS NOT NULL
  ) THEN
    RETURN;
  END IF;

  v_first_name := COALESCE(trim(split_part(COALESCE(p_display_name, 'Customer'), ' ', 1)), 'Customer');
  IF length(v_first_name) > 20 THEN
    v_first_name := left(v_first_name, 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM customers WHERE id = p_customer_id AND customer_id_display IS NOT NULL) THEN
    LOOP
      v_letter := chr(65 + floor(random() * 26)::int);
      v_num := lpad(floor(random() * 100)::int::text, 2, '0');
      v_display := v_first_name || ' ' || v_letter || v_num;
      SELECT EXISTS (SELECT 1 FROM customers WHERE customer_id_display = v_display) INTO v_exists;
      EXIT WHEN NOT v_exists OR v_attempt > 15;
      v_attempt := v_attempt + 1;
    END LOOP;
    IF v_attempt > 15 THEN
      v_display := v_first_name || ' ' || v_letter || v_num || right(floor(extract(epoch from now())::bigint)::text, 2);
    END IF;
    UPDATE customers SET customer_id_display = v_display WHERE id = p_customer_id AND customer_id_display IS NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM customers WHERE id = p_customer_id AND magic_code IS NOT NULL) THEN
    v_attempt := 0;
    LOOP
      v_magic := '';
      FOR v_i IN 1..8 LOOP
        v_magic := v_magic || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
      END LOOP;
      SELECT EXISTS (SELECT 1 FROM customers WHERE magic_code = v_magic) INTO v_exists;
      EXIT WHEN NOT v_exists OR v_attempt > 15;
      v_attempt := v_attempt + 1;
    END LOOP;
    UPDATE customers SET magic_code = v_magic WHERE id = p_customer_id AND magic_code IS NULL;
  END IF;
END;
$$;

COMMENT ON FUNCTION ensure_customer_display_id(UUID, TEXT) IS 'Fills customer_id_display/magic_code if null; columns from add_customer_id_system.sql.';
