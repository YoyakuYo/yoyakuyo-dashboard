-- Normalize bookings table identity columns (SAFE)
-- Adds optional helper columns without dropping canonical ownership keys.
--
-- IMPORTANT:
-- - `bookings.customer_id` is required by the API and many views/indexes.
-- - `bookings.user_id` is also used in some flows.
-- DO NOT drop them here.

ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS auth_user_id UUID NULL,
  -- LINE user id is a string like "Uxxxxxxxx" (NOT a UUID). Keep as TEXT.
  ADD COLUMN IF NOT EXISTS line_user_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS guest_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS guest_email TEXT NULL;

-- Ensure canonical ownership + source columns exist (some DBs are missing these)
DO $$
BEGIN
  IF to_regclass('public.bookings') IS NULL THEN
    RAISE NOTICE 'public.bookings does not exist, skipping canonical column normalization';
    RETURN;
  END IF;

  -- Canonical customer_id (UUID)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN customer_id UUID NULL;
    CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id) WHERE customer_id IS NOT NULL;
    RAISE NOTICE 'Added public.bookings.customer_id';
  END IF;

  -- Canonical source (text: line/web/guest)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'source'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN source TEXT NULL;
    CREATE INDEX IF NOT EXISTS idx_bookings_source ON public.bookings(source) WHERE source IS NOT NULL;
    RAISE NOTICE 'Added public.bookings.source';
  END IF;

  -- Backfill source from legacy columns (if present)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'channel'
  ) THEN
    EXECUTE $q$
      UPDATE public.bookings
      SET source = channel
      WHERE source IS NULL
        AND channel IS NOT NULL
    $q$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'booking_type'
  ) THEN
    EXECUTE $q$
      UPDATE public.bookings
      SET source = CASE
        WHEN booking_type::text IN ('line','web','guest') THEN booking_type::text
        WHEN booking_type::text = 'user' THEN 'web'
        ELSE source
      END
      WHERE source IS NULL
        AND booking_type IS NOT NULL
    $q$;
  END IF;

  -- Backfill customer_id from known legacy ownership columns (if present)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'user_id'
  ) THEN
    EXECUTE $q$
      UPDATE public.bookings
      SET customer_id = user_id
      WHERE customer_id IS NULL
        AND user_id IS NOT NULL
    $q$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'guest_id'
  ) THEN
    EXECUTE $q$
      UPDATE public.bookings
      SET customer_id = guest_id
      WHERE customer_id IS NULL
        AND guest_id IS NOT NULL
    $q$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'customer_profile_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_profiles' AND column_name = 'customer_auth_id'
  ) THEN
    EXECUTE $q$
      UPDATE public.bookings b
      SET customer_id = cp.customer_auth_id
      FROM public.customer_profiles cp
      WHERE b.customer_id IS NULL
        AND b.customer_profile_id IS NOT NULL
        AND cp.id = b.customer_profile_id
        AND cp.customer_auth_id IS NOT NULL
    $q$;
  END IF;

  -- If we have line_user_id stored on bookings, map via line_accounts
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'line_user_id'
  ) AND to_regclass('public.line_accounts') IS NOT NULL THEN
    EXECUTE $q$
      UPDATE public.bookings b
      SET customer_id = la.customer_id
      FROM public.line_accounts la
      WHERE b.customer_id IS NULL
        AND b.line_user_id IS NOT NULL
        -- Schema-safe: some DBs have line_user_id as UUID, others as TEXT.
        -- Compare as text to avoid "operator does not exist: text = uuid".
        AND la.line_user_id::text = b.line_user_id::text
        AND la.customer_id IS NOT NULL
    $q$;
  END IF;

  -- Optional FK (only add if it won't fail validation)
  IF to_regclass('public.customers') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'bookings_customer_id_fkey'
         AND conrelid = 'public.bookings'::regclass
     )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.bookings b
      LEFT JOIN public.customers c ON c.id = b.customer_id
      WHERE b.customer_id IS NOT NULL
        AND c.id IS NULL
      LIMIT 1
    ) THEN
      ALTER TABLE public.bookings
        ADD CONSTRAINT bookings_customer_id_fkey
        FOREIGN KEY (customer_id) REFERENCES public.customers(id)
        ON DELETE CASCADE;
      RAISE NOTICE 'Added FK bookings.customer_id -> customers.id';
    ELSE
      RAISE NOTICE 'Skipping FK bookings.customer_id -> customers.id (there are bookings.customer_id values missing in customers)';
    END IF;
  END IF;
END $$;


