-- Verify customer booking flow (guest / web / LINE) against canonical identity rules
-- Safe to run in Supabase SQL editor (read-only).
--
-- Expected model:
-- - bookings.customer_id is the canonical customer UUID (customers.id)
-- - bookings.source is one of: 'guest' | 'web' | 'line'
-- - LINE users are mapped via public.line_accounts(customer_id, line_user_id)
-- - WEB customers/owners should have matching auth.users rows
-- - Guest customers may exist without auth.users rows

-- ============================================================
-- IMPORTANT NOTE (schema-safe script)
-- ============================================================
-- Some environments may be missing `bookings.customer_id` (or other columns).
-- This script intentionally avoids direct column references by using:
--   to_jsonb(b)->>'customer_id'
-- so it can still run and tell you what's missing.

-- ============================================================
-- 0) Schema snapshot (what columns exist right now?)
-- ============================================================
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
ORDER BY ordinal_position;

SELECT
  -- Canonical columns expected by current API
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'customer_id'
  ) AS has_bookings_customer_id,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'source'
  ) AS has_bookings_source,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'line_user_id'
  ) AS has_bookings_line_user_id,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'user_id'
  ) AS has_bookings_user_id,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'guest_id'
  ) AS has_bookings_guest_id;

-- ============================================================
-- 0b) Derived booking fields (TEMP VIEW)
-- ============================================================
-- NOTE: A CTE only exists for ONE statement. This script runs multiple statements,
-- so we materialize a TEMP VIEW that later queries can reuse.
DROP VIEW IF EXISTS pg_temp.verify_customer_booking_flow_b;
CREATE TEMP VIEW verify_customer_booking_flow_b AS
SELECT
  bb.*,
  to_jsonb(bb) AS jb,
  -- Safe UUID casts (avoid runtime errors on invalid UUID strings)
  CASE
    WHEN (to_jsonb(bb)->>'customer_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (to_jsonb(bb)->>'customer_id')::uuid
    ELSE NULL
  END AS customer_id_uuid,
  CASE
    WHEN (to_jsonb(bb)->>'user_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (to_jsonb(bb)->>'user_id')::uuid
    ELSE NULL
  END AS user_id_uuid,
  CASE
    WHEN (to_jsonb(bb)->>'guest_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (to_jsonb(bb)->>'guest_id')::uuid
    ELSE NULL
  END AS guest_id_uuid,
  COALESCE(
    NULLIF(to_jsonb(bb)->>'source', ''),
    NULLIF(to_jsonb(bb)->>'channel', ''),
    NULLIF(to_jsonb(bb)->>'booking_type', '')
  ) AS derived_source,
  NULLIF(to_jsonb(bb)->>'line_user_id', '') AS derived_line_user_id
FROM public.bookings bb;

-- ============================================================
-- 0c) Optional legacy linkage sources (schema-safe TEMP VIEWS)
-- ============================================================
DO $$
BEGIN
  -- conversations (internal messaging): booking_id + customer_type + customer_ref
  EXECUTE 'DROP VIEW IF EXISTS pg_temp.verify_customer_booking_flow_conv';
  IF to_regclass('public.conversations') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='booking_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='customer_type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='customer_ref')
  THEN
    EXECUTE '
      CREATE TEMP VIEW verify_customer_booking_flow_conv AS
      SELECT booking_id, customer_type::text AS customer_type, customer_ref
      FROM public.conversations
      WHERE booking_id IS NOT NULL
    ';
  ELSE
    EXECUTE '
      CREATE TEMP VIEW verify_customer_booking_flow_conv AS
      SELECT NULL::uuid AS booking_id, NULL::text AS customer_type, NULL::text AS customer_ref
      WHERE false
    ';
  END IF;

  -- shop_threads: booking_id + line_user_id + customer_id
  EXECUTE 'DROP VIEW IF EXISTS pg_temp.verify_customer_booking_flow_threads';
  IF to_regclass('public.shop_threads') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shop_threads' AND column_name='booking_id')
  THEN
    EXECUTE '
      CREATE TEMP VIEW verify_customer_booking_flow_threads AS
      SELECT
        booking_id,
        line_user_id::text AS thread_line_user_id,
        customer_id AS thread_customer_id
      FROM public.shop_threads
      WHERE booking_id IS NOT NULL
    ';
  ELSE
    EXECUTE '
      CREATE TEMP VIEW verify_customer_booking_flow_threads AS
      SELECT NULL::uuid AS booking_id, NULL::text AS thread_line_user_id, NULL::uuid AS thread_customer_id
      WHERE false
    ';
  END IF;

  -- line_bookings: booking_id + line_user_id
  EXECUTE 'DROP VIEW IF EXISTS pg_temp.verify_customer_booking_flow_line_bookings';
  IF to_regclass('public.line_bookings') IS NOT NULL THEN
    EXECUTE '
      CREATE TEMP VIEW verify_customer_booking_flow_line_bookings AS
      SELECT booking_id, line_user_id::text AS line_user_id
      FROM public.line_bookings
      WHERE booking_id IS NOT NULL
    ';
  ELSE
    EXECUTE '
      CREATE TEMP VIEW verify_customer_booking_flow_line_bookings AS
      SELECT NULL::uuid AS booking_id, NULL::text AS line_user_id
      WHERE false
    ';
  END IF;
END $$;

-- ============================================================
-- 1) Quick distribution snapshots
-- ============================================================
SELECT derived_source AS source, status, COUNT(*) AS booking_count
FROM verify_customer_booking_flow_b
GROUP BY derived_source, status
ORDER BY derived_source, status;

SELECT c.role, COUNT(*) AS customers
FROM public.customers c
GROUP BY c.role
ORDER BY c.role;

-- ============================================================
-- 2) Hard integrity checks (should be 0 rows)
-- ============================================================
-- 2a) Bookings missing canonical customer reference
-- NOTE: If your schema does not have bookings.customer_id, this will likely be > 0 and indicates
-- your DB is out-of-sync with the API code.
SELECT
  id,
  created_at,
  derived_source AS source,
  (jb->>'customer_id') AS customer_id_text,
  (jb->>'user_id') AS user_id_text,
  (jb->>'guest_id') AS guest_id_text
FROM verify_customer_booking_flow_b
WHERE customer_id_uuid IS NULL;

-- 2b) Bookings whose (derived) customer_id is not present in customers table (FK broken/out-of-sync)
SELECT
  b.id,
  b.created_at,
  b.derived_source AS source,
  b.customer_id_uuid AS customer_id
FROM verify_customer_booking_flow_b b
LEFT JOIN public.customers c ON c.id = b.customer_id_uuid
WHERE b.customer_id_uuid IS NOT NULL
  AND c.id IS NULL;

-- ============================================================
-- 3) Identity consistency checks (review + fix offenders)
-- ============================================================
-- 3a) Web/Owner customers without auth.users row (should be 0)
SELECT c.id AS customer_id, c.role, c.created_at
FROM public.customers c
LEFT JOIN auth.users u ON u.id = c.id
WHERE c.role IN ('customer', 'owner')
  AND u.id IS NULL
ORDER BY c.created_at DESC
LIMIT 200;

-- 3b) Guest customers that DO have auth.users rows (not necessarily wrong, but usually unexpected)
SELECT c.id AS customer_id, c.created_at
FROM public.customers c
JOIN auth.users u ON u.id = c.id
WHERE c.role = 'guest'
ORDER BY c.created_at DESC
LIMIT 200;

-- ============================================================
-- 4) Booking-source vs identity checks
-- ============================================================
-- 4a) LINE bookings that have no line_accounts mapping for their customer_id (should be 0)
SELECT
  b.id AS booking_id,
  b.created_at,
  b.customer_id_uuid AS customer_id,
  b.derived_line_user_id AS line_user_id
FROM verify_customer_booking_flow_b b
LEFT JOIN public.line_accounts la ON la.customer_id = b.customer_id_uuid
WHERE b.derived_source = 'line'
  AND b.customer_id_uuid IS NOT NULL
  AND la.customer_id IS NULL
ORDER BY b.created_at DESC
LIMIT 200;

-- 4b) LINE bookings where bookings.line_user_id (if present) doesn't match the mapped line_accounts.line_user_id
-- (This flags schema drift where line_user_id was stored inconsistently.)
SELECT
  b.id AS booking_id,
  b.created_at,
  b.customer_id_uuid AS customer_id,
  b.derived_line_user_id AS booking_line_user_id,
  la.line_user_id AS mapped_line_user_id
FROM verify_customer_booking_flow_b b
JOIN public.line_accounts la ON la.customer_id = b.customer_id_uuid
WHERE b.derived_source = 'line'
  AND b.derived_line_user_id IS NOT NULL
  AND b.derived_line_user_id <> la.line_user_id
ORDER BY b.created_at DESC
LIMIT 200;

-- 4c) Web bookings whose customer_id has no auth.users row (should be 0)
SELECT
  b.id AS booking_id,
  b.created_at,
  b.customer_id_uuid AS customer_id
FROM verify_customer_booking_flow_b b
LEFT JOIN auth.users u ON u.id = b.customer_id_uuid
WHERE b.derived_source = 'web'
  AND b.customer_id_uuid IS NOT NULL
  AND u.id IS NULL
ORDER BY b.created_at DESC
LIMIT 200;

-- 4d) Guest bookings whose customer_id DOES have auth.users row (not necessarily wrong, but often indicates mis-classification)
SELECT
  b.id AS booking_id,
  b.created_at,
  b.customer_id_uuid AS customer_id
FROM verify_customer_booking_flow_b b
JOIN auth.users u ON u.id = b.customer_id_uuid
WHERE b.derived_source = 'guest'
  AND b.customer_id_uuid IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 200;

-- ============================================================
-- 5) Recent booking drilldown (sanity)
-- ============================================================
SELECT
  b.id,
  b.created_at,
  b.derived_source AS source,
  b.status,
  b.customer_id_uuid AS customer_id,
  c.role AS customer_role,
  -- booking-side identity (may exist even if no mapping table exists)
  b.derived_line_user_id AS booking_line_user_id,
  (b.jb->>'user_id') AS booking_user_id_text,
  (b.jb->>'guest_id') AS booking_guest_id_text,
  (b.jb->>'customer_profile_id') AS booking_customer_profile_id_text,
  -- mapping-side identity (requires line_accounts populated)
  la.line_user_id AS mapped_line_user_id,
  -- legacy linkage sources (if present in DB)
  lb.line_user_id AS line_user_id_from_line_bookings,
  conv.customer_ref AS line_user_id_from_conversations,
  th.thread_line_user_id AS line_user_id_from_shop_threads,
  th.thread_customer_id AS customer_id_from_shop_threads,
  s.name AS shop_name
FROM verify_customer_booking_flow_b b
LEFT JOIN public.customers c ON c.id = b.customer_id_uuid
LEFT JOIN public.line_accounts la ON la.customer_id = b.customer_id_uuid
LEFT JOIN verify_customer_booking_flow_line_bookings lb ON lb.booking_id = b.id
LEFT JOIN verify_customer_booking_flow_conv conv ON conv.booking_id = b.id AND conv.customer_type = 'line'
LEFT JOIN verify_customer_booking_flow_threads th ON th.booking_id = b.id
LEFT JOIN public.shops s ON s.id = b.shop_id
ORDER BY b.created_at DESC
LIMIT 50;

-- ============================================================
-- 6) LINE legacy linkage diagnostics (only if line_bookings exists)
-- ============================================================
DO $$
BEGIN
  IF to_regclass('public.line_bookings') IS NOT NULL THEN
    RAISE NOTICE 'Running diagnostics using public.line_bookings...';
    EXECUTE $q$
      SELECT
        b.id AS booking_id,
        b.created_at,
        COALESCE(to_jsonb(b)->>'source', to_jsonb(b)->>'channel', to_jsonb(b)->>'booking_type') AS source,
        (to_jsonb(b)->>'customer_id') AS customer_id_text,
        lb.line_user_id AS line_user_id_from_line_bookings
      FROM public.bookings b
      JOIN public.line_bookings lb ON lb.booking_id = b.id
      WHERE (to_jsonb(b)->>'customer_id') IS NULL
      ORDER BY b.created_at DESC
      LIMIT 50
    $q$;
  ELSE
    RAISE NOTICE 'public.line_bookings does not exist; skipping LINE legacy diagnostics';
  END IF;
END $$;


