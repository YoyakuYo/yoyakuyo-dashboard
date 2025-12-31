-- ============================================
-- 0. ENSURE REQUIRED COLUMNS ARE PRESENT
-- ============================================
ALTER TABLE IF EXISTS public.customers
  ADD COLUMN IF NOT EXISTS auth_user_id UUID,
  ADD COLUMN IF NOT EXISTS line_user_id TEXT;

-- ============================================
-- 1. FIX BROKEN ROWS (SAFE AUTO-REPAIR)
-- ============================================
-- In the canonical model used by the API, non-guest customers MUST map to an auth.users row.
-- Guest customers are allowed to exist without auth.users (FK was intentionally removed).
UPDATE public.customers c
SET role = 'guest'
WHERE c.role IN ('customer', 'owner')
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c.id);

-- ============================================
-- 2. PREVENT FUTURE BREAKAGE (TRIGGER: GUARDRAIL)
-- ============================================
CREATE OR REPLACE FUNCTION public.enforce_customer_identity()
RETURNS trigger AS $$
BEGIN
  -- Guardrail:
  -- If a row claims to be a real authenticated customer/owner, it must have an auth.users row.
  -- (We intentionally allow guests without auth.users.)
  IF NEW.role IN ('customer', 'owner') THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = NEW.id) THEN
      RAISE EXCEPTION 'role % requires matching auth.users row (customer id=%)', NEW.role, NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_identity_guard ON public.customers;

CREATE TRIGGER customer_identity_guard
BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.enforce_customer_identity();

-- ============================================
-- 3. VISIBILITY QUERIES TO VERIFY STATE (DO NOT INCLUDE IN MIGRATION, JUST FOR YOUR REFERENCE)
-- ============================================
-- SELECT role, COUNT(*) AS total_customers, COUNT(auth_user_id) AS web_authenticated, COUNT(line_user_id) AS line_authenticated FROM customers GROUP BY role ORDER BY role;
-- SELECT c.role, COUNT(b.id) AS total_bookings FROM bookings b LEFT JOIN customers c ON c.id = b.customer_id GROUP BY c.role ORDER BY total_bookings DESC;

