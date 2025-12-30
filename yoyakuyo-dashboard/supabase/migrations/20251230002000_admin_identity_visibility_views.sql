-- Admin visibility views (SAFE, aligned with the canonical booking system)
-- - customers.role is: 'guest' | 'customer' | 'owner'
-- - bookings.source is: 'line' | 'web' | 'guest'
-- - LINE user ids are strings and are mapped via public.line_accounts

-- 1) CUSTOMER IDENTITY STRUCTURE VIEW
CREATE OR REPLACE VIEW public.admin_customer_identity_overview AS
SELECT
  c.id AS customer_id,
  c.role,
  c.created_at,
  EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c.id) AS has_auth_user,
  EXISTS (SELECT 1 FROM public.line_accounts la WHERE la.customer_id = c.id) AS has_line_account,
  CASE
    WHEN c.role = 'guest' THEN 'guest_no_auth_expected'
    WHEN c.role IN ('customer', 'owner')
      AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c.id) THEN 'auth_ok'
    ELSE 'BROKEN_MISSING_AUTH_USER'
  END AS identity_status
FROM public.customers c;

-- 2) BOOKINGS → CUSTOMER TYPE MAPPING
CREATE OR REPLACE VIEW public.admin_booking_identity_overview AS
SELECT
  b.id AS booking_id,
  b.created_at,
  b.customer_id,
  c.role AS customer_role,
  b.source,
  b.line_user_id,
  CASE
    WHEN b.source = 'line' THEN 'line_booking'
    WHEN b.source = 'web' THEN 'web_booking'
    WHEN b.source = 'guest' THEN 'guest_booking'
    ELSE 'unknown'
  END AS booking_type
FROM public.bookings b
LEFT JOIN public.customers c ON c.id = b.customer_id;

-- 3) SIMPLE BOOKING FLOW SUMMARY
CREATE OR REPLACE VIEW public.admin_booking_flow_summary AS
SELECT
  source AS booking_source,
  COUNT(*) AS total_bookings
FROM public.bookings
GROUP BY source;

