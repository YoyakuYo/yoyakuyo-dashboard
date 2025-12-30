-- ============================================================================
-- Add Stripe subscription persistence fields to public.users
-- ============================================================================
-- Purpose:
-- - Persist Stripe customer/subscription identifiers and the owner's current plan/status
-- - Keep `subscriptions` as the primary source of truth (per-shop / per-owner),
--   while `public.users` stores a convenient "current subscription" summary.
--
-- Notes:
-- - This migration is idempotent (uses IF NOT EXISTS / safe drops).
-- - `created_at` / `updated_at` already exist on public.users; we add an updated_at trigger.
-- ============================================================================

-- 1) Add columns (only if missing)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan TEXT CHECK (plan IN ('basic', 'premium')),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- 2) Helpful indexes (unique per Stripe object when present)
CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_unique
  ON public.users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_subscription_id_unique
  ON public.users (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_subscription_status_idx
  ON public.users (subscription_status);

CREATE INDEX IF NOT EXISTS users_plan_idx
  ON public.users (plan);

-- 3) Keep updated_at current on UPDATE
CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_users_updated_at();

-- 4) Comments
COMMENT ON COLUMN public.users.stripe_customer_id IS 'Stripe customer ID for this owner (if created)';
COMMENT ON COLUMN public.users.stripe_subscription_id IS 'Primary Stripe subscription ID for this owner (if any)';
COMMENT ON COLUMN public.users.plan IS 'Current subscription plan for this owner (basic/premium)';
COMMENT ON COLUMN public.users.subscription_status IS 'Current Stripe subscription status for this owner';


