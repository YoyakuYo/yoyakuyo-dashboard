-- ============================================================================
-- CREATE SUBSCRIPTIONS TABLE
-- ============================================================================
-- This migration creates the subscriptions table for shop subscription management
-- Used by: /owner/subscription page, subscription API routes
-- ============================================================================

-- Drop table if it exists with wrong structure (from previous failed migration)
DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions'
  ) THEN
    -- Check if user_id column exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'subscriptions' 
      AND column_name = 'user_id'
    ) THEN
      -- Table exists but missing user_id column - drop and recreate
      DROP TABLE IF EXISTS subscriptions CASCADE;
      RAISE NOTICE 'Dropped existing subscriptions table (missing user_id column)';
    END IF;
  END IF;
END $$;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'premium', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'unpaid', 'incomplete', 'incomplete_expired')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_shop_id ON subscriptions(shop_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_shop_id_status ON subscriptions(shop_id, status);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Owners can read subscriptions for their shops
DROP POLICY IF EXISTS "Owners can read their shop subscriptions" ON subscriptions;
CREATE POLICY "Owners can read their shop subscriptions"
  ON subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = subscriptions.shop_id
      AND shops.owner_user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Owners can insert subscriptions for their shops
DROP POLICY IF EXISTS "Owners can insert subscriptions" ON subscriptions;
CREATE POLICY "Owners can insert subscriptions"
  ON subscriptions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = subscriptions.shop_id
      AND shops.owner_user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Owners can update subscriptions for their shops
DROP POLICY IF EXISTS "Owners can update their subscriptions" ON subscriptions;
CREATE POLICY "Owners can update their subscriptions"
  ON subscriptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = subscriptions.shop_id
      AND shops.owner_user_id = auth.uid()
    )
    OR user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = subscriptions.shop_id
      AND shops.owner_user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Service role can manage all subscriptions
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;
CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Add comments
COMMENT ON TABLE subscriptions IS 'Shop subscription plans (basic, premium, enterprise)';
COMMENT ON COLUMN subscriptions.shop_id IS 'Foreign key to shops table';
COMMENT ON COLUMN subscriptions.user_id IS 'Foreign key to auth.users (shop owner)';
COMMENT ON COLUMN subscriptions.plan IS 'Subscription plan: basic, premium, or enterprise';
COMMENT ON COLUMN subscriptions.status IS 'Subscription status from Stripe';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID (unique)';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN subscriptions.current_period_start IS 'Start of current billing period';
COMMENT ON COLUMN subscriptions.current_period_end IS 'End of current billing period';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at period end';
COMMENT ON COLUMN subscriptions.canceled_at IS 'Timestamp when subscription was canceled';
COMMENT ON COLUMN subscriptions.metadata IS 'Additional subscription metadata (JSONB)';

