-- Backfill LINE bookings: ensure line_user_id is TEXT and populate bookings.customer_id
-- Safe/idempotent: uses IF EXISTS checks and avoids breaking if tables/columns differ.
--
-- Why:
-- - Older environments may have:
--   - bookings.customer_id missing or NULL for historical LINE bookings
--   - bookings.line_user_id typed as UUID (incorrect for LINE IDs)
--   - line_user_id stored in public.line_bookings (booking_id -> line_user_id)
--
-- Goal:
-- - bookings.line_user_id (TEXT) contains the LINE user id string
-- - bookings.customer_id (UUID) is set using line_accounts mapping (or RPC if available)

DO $$
DECLARE
  bookings_line_user_id_type TEXT;
  line_accounts_line_user_id_type TEXT;
  line_user_mappings_line_user_id_type TEXT;
  r RECORD;
  v_customer_id UUID;
  v_rows BIGINT;
BEGIN
  IF to_regclass('public.bookings') IS NULL THEN
    RAISE NOTICE 'public.bookings does not exist, skipping';
    RETURN;
  END IF;

  -- 1) Ensure bookings.line_user_id exists and is TEXT
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'line_user_id'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN line_user_id TEXT NULL;
    CREATE INDEX IF NOT EXISTS bookings_line_user_id_idx ON public.bookings(line_user_id) WHERE line_user_id IS NOT NULL;
    RAISE NOTICE 'Added public.bookings.line_user_id (TEXT)';
  END IF;

  SELECT data_type
  INTO bookings_line_user_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'line_user_id';

  IF bookings_line_user_id_type = 'uuid' THEN
    -- Convert UUID -> TEXT so we can store real LINE user IDs (e.g. "Uxxxx...")
    ALTER TABLE public.bookings
      ALTER COLUMN line_user_id TYPE TEXT
      USING line_user_id::text;
    RAISE NOTICE 'Converted public.bookings.line_user_id from UUID -> TEXT';
  END IF;

  -- 2) Ensure bookings.customer_id exists (some DBs were missing it)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN customer_id UUID NULL;
    CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id) WHERE customer_id IS NOT NULL;
    RAISE NOTICE 'Added public.bookings.customer_id';
  END IF;

  -- 3) If line_bookings exists, copy its line_user_id onto bookings where missing
  IF to_regclass('public.line_bookings') IS NOT NULL THEN
    EXECUTE $q$
      UPDATE public.bookings b
      SET line_user_id = lb.line_user_id
      FROM public.line_bookings lb
      WHERE lb.booking_id = b.id
        AND (b.line_user_id IS NULL OR b.line_user_id = '')
        AND lb.line_user_id IS NOT NULL
        AND lb.line_user_id <> ''
    $q$;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RAISE NOTICE 'Backfilled bookings.line_user_id from line_bookings: % rows', v_rows;
  ELSE
    RAISE NOTICE 'public.line_bookings not found; cannot backfill bookings.line_user_id from it';
  END IF;

  -- 3b) If customer_profiles has line_user_id, backfill bookings.line_user_id via customer_profile_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'customer_profile_id'
  ) AND to_regclass('public.customer_profiles') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'customer_profiles' AND column_name = 'line_user_id'
    )
  THEN
    EXECUTE $q$
      UPDATE public.bookings b
      SET line_user_id = cp.line_user_id
      FROM public.customer_profiles cp
      WHERE b.customer_profile_id = cp.id
        AND (b.line_user_id IS NULL OR b.line_user_id = '')
        AND cp.line_user_id IS NOT NULL
        AND cp.line_user_id <> ''
    $q$;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RAISE NOTICE 'Backfilled bookings.line_user_id from customer_profiles: % rows', v_rows;
  END IF;

  -- 3c) Backfill bookings.line_user_id from internal messaging conversations (customer_ref) if available
  IF to_regclass('public.conversations') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='booking_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='customer_type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='customer_ref')
  THEN
    EXECUTE $q$
      UPDATE public.bookings b
      SET line_user_id = c.customer_ref
      FROM public.conversations c
      WHERE c.booking_id = b.id
        AND (b.line_user_id IS NULL OR b.line_user_id = '')
        AND c.customer_type::text = 'line'
        AND c.customer_ref IS NOT NULL
        AND c.customer_ref <> ''
    $q$;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RAISE NOTICE 'Backfilled bookings.line_user_id from conversations.customer_ref: % rows', v_rows;
  END IF;

  -- 3d) Backfill bookings.line_user_id from shop_threads if available
  IF to_regclass('public.shop_threads') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shop_threads' AND column_name='booking_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shop_threads' AND column_name='line_user_id')
  THEN
    EXECUTE $q$
      UPDATE public.bookings b
      SET line_user_id = st.line_user_id
      FROM public.shop_threads st
      WHERE st.booking_id = b.id
        AND (b.line_user_id IS NULL OR b.line_user_id = '')
        AND st.line_user_id IS NOT NULL
        AND st.line_user_id <> ''
    $q$;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RAISE NOTICE 'Backfilled bookings.line_user_id from shop_threads.line_user_id: % rows', v_rows;
  END IF;

  -- 4) Ensure line_accounts.line_user_id is TEXT if table exists (some DBs had UUID)
  IF to_regclass('public.line_accounts') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'line_accounts' AND column_name = 'line_user_id'
    ) THEN
      SELECT data_type
      INTO line_accounts_line_user_id_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'line_accounts' AND column_name = 'line_user_id';

      IF line_accounts_line_user_id_type = 'uuid' THEN
        ALTER TABLE public.line_accounts
          ALTER COLUMN line_user_id TYPE TEXT
          USING line_user_id::text;
        RAISE NOTICE 'Converted public.line_accounts.line_user_id from UUID -> TEXT';
      END IF;
    END IF;
  END IF;

  -- 4b) Ensure line_user_mappings.line_user_id is TEXT if table exists (legacy mapping table)
  IF to_regclass('public.line_user_mappings') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'line_user_mappings' AND column_name = 'line_user_id'
    ) THEN
      SELECT data_type
      INTO line_user_mappings_line_user_id_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'line_user_mappings' AND column_name = 'line_user_id';

      IF line_user_mappings_line_user_id_type = 'uuid' THEN
        ALTER TABLE public.line_user_mappings
          ALTER COLUMN line_user_id TYPE TEXT
          USING line_user_id::text;
        RAISE NOTICE 'Converted public.line_user_mappings.line_user_id from UUID -> TEXT';
      END IF;
    END IF;
  END IF;

  -- 4c) If we have legacy line_user_mappings, seed line_accounts from it (align with current API)
  IF to_regclass('public.line_accounts') IS NOT NULL AND to_regclass('public.line_user_mappings') IS NOT NULL THEN
    EXECUTE $q$
      INSERT INTO public.line_accounts (customer_id, line_user_id)
      SELECT lum.customer_id, lum.line_user_id::text
      FROM public.line_user_mappings lum
      WHERE lum.customer_id IS NOT NULL
        AND lum.line_user_id IS NOT NULL
      ON CONFLICT (line_user_id) DO UPDATE
        SET customer_id = EXCLUDED.customer_id
    $q$;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RAISE NOTICE 'Seeded/updated line_accounts from line_user_mappings: % rows', v_rows;
  END IF;

  -- 5) Backfill bookings.customer_id from line_accounts mapping
  IF to_regclass('public.line_accounts') IS NOT NULL THEN
    EXECUTE $q$
      UPDATE public.bookings b
      SET customer_id = la.customer_id
      FROM public.line_accounts la
      WHERE b.customer_id IS NULL
        AND b.line_user_id IS NOT NULL
        AND b.line_user_id <> ''
        AND la.customer_id IS NOT NULL
        -- Schema-safe comparison
        AND la.line_user_id::text = b.line_user_id::text
    $q$;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RAISE NOTICE 'Backfilled bookings.customer_id from line_accounts: % rows', v_rows;
  ELSE
    RAISE NOTICE 'public.line_accounts not found; cannot map LINE bookings to customers';
  END IF;

  -- 5a) Backfill bookings.customer_id from shop_threads.customer_id if available (direct canonical id)
  IF to_regclass('public.shop_threads') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shop_threads' AND column_name='booking_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shop_threads' AND column_name='customer_id')
  THEN
    EXECUTE $q$
      UPDATE public.bookings b
      SET customer_id = st.customer_id
      FROM public.shop_threads st
      WHERE st.booking_id = b.id
        AND b.customer_id IS NULL
        AND st.customer_id IS NOT NULL
    $q$;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RAISE NOTICE 'Backfilled bookings.customer_id from shop_threads.customer_id: % rows', v_rows;
  END IF;

  -- 5b) Backfill bookings.customer_id from legacy line_user_mappings (fallback)
  IF to_regclass('public.line_user_mappings') IS NOT NULL THEN
    EXECUTE $q$
      UPDATE public.bookings b
      SET customer_id = lum.customer_id
      FROM public.line_user_mappings lum
      WHERE b.customer_id IS NULL
        AND b.line_user_id IS NOT NULL
        AND b.line_user_id <> ''
        AND lum.customer_id IS NOT NULL
        AND lum.line_user_id::text = b.line_user_id::text
    $q$;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RAISE NOTICE 'Backfilled bookings.customer_id from line_user_mappings: % rows', v_rows;
  END IF;

  -- 5c) If we have line_bookings, backfill bookings.customer_id directly via line_bookings -> mapping tables
  IF to_regclass('public.line_bookings') IS NOT NULL THEN
    IF to_regclass('public.line_accounts') IS NOT NULL THEN
      EXECUTE $q$
        UPDATE public.bookings b
        SET customer_id = la.customer_id
        FROM public.line_bookings lb
        JOIN public.line_accounts la ON la.line_user_id::text = lb.line_user_id::text
        WHERE b.customer_id IS NULL
          AND lb.booking_id = b.id
          AND la.customer_id IS NOT NULL
      $q$;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      RAISE NOTICE 'Backfilled bookings.customer_id via line_bookings -> line_accounts: % rows', v_rows;
    END IF;

    IF to_regclass('public.line_user_mappings') IS NOT NULL THEN
      EXECUTE $q$
        UPDATE public.bookings b
        SET customer_id = lum.customer_id
        FROM public.line_bookings lb
        JOIN public.line_user_mappings lum ON lum.line_user_id::text = lb.line_user_id::text
        WHERE b.customer_id IS NULL
          AND lb.booking_id = b.id
          AND lum.customer_id IS NOT NULL
      $q$;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      RAISE NOTICE 'Backfilled bookings.customer_id via line_bookings -> line_user_mappings: % rows', v_rows;
    END IF;
  END IF;

  -- 6) Optional: if RPC exists, create missing mappings and backfill remaining bookings
  IF to_regprocedure('public.get_or_create_customer_from_line(text)') IS NOT NULL THEN
    -- Build a set of candidate line_user_id values to process:
    -- - From bookings.line_user_id
    -- - From line_bookings.line_user_id (if present)
    CREATE TEMP TABLE IF NOT EXISTS pg_temp._line_ids_to_fix(line_user_id TEXT PRIMARY KEY);
    TRUNCATE TABLE pg_temp._line_ids_to_fix;

    INSERT INTO pg_temp._line_ids_to_fix(line_user_id)
    SELECT DISTINCT b.line_user_id::text
    FROM public.bookings b
    WHERE b.customer_id IS NULL
      AND b.line_user_id IS NOT NULL
      AND b.line_user_id <> ''
    ON CONFLICT DO NOTHING;

    IF to_regclass('public.line_bookings') IS NOT NULL THEN
      EXECUTE $q$
        INSERT INTO pg_temp._line_ids_to_fix(line_user_id)
        SELECT DISTINCT lb.line_user_id::text
        FROM public.line_bookings lb
        JOIN public.bookings b ON b.id = lb.booking_id
        WHERE b.customer_id IS NULL
          AND lb.line_user_id IS NOT NULL
          AND lb.line_user_id <> ''
        ON CONFLICT DO NOTHING
      $q$;
    END IF;

    -- Also include LINE refs from conversations (if present)
    IF to_regclass('public.conversations') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='booking_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='customer_type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='customer_ref')
    THEN
      EXECUTE $q$
        INSERT INTO pg_temp._line_ids_to_fix(line_user_id)
        SELECT DISTINCT c.customer_ref::text
        FROM public.conversations c
        JOIN public.bookings b ON b.id = c.booking_id
        WHERE b.customer_id IS NULL
          AND c.customer_type::text = 'line'
          AND c.customer_ref IS NOT NULL
          AND c.customer_ref <> ''
        ON CONFLICT DO NOTHING
      $q$;
    END IF;

    FOR r IN SELECT line_user_id FROM pg_temp._line_ids_to_fix LOOP
      BEGIN
        EXECUTE 'SELECT public.get_or_create_customer_from_line($1)'
          INTO v_customer_id
          USING r.line_user_id;
      EXCEPTION WHEN OTHERS THEN
        v_customer_id := NULL;
      END;

      IF v_customer_id IS NOT NULL THEN
        UPDATE public.bookings b2
        SET customer_id = v_customer_id
        WHERE b2.customer_id IS NULL
          AND b2.line_user_id::text = r.line_user_id::text;
      END IF;
    END LOOP;

    RAISE NOTICE 'Attempted RPC-based backfill for remaining LINE bookings';
  ELSE
    RAISE NOTICE 'RPC public.get_or_create_customer_from_line(text) not found; skipping RPC-based backfill';
  END IF;
END $$;


