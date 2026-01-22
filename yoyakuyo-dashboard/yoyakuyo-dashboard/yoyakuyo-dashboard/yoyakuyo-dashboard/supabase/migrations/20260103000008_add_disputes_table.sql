-- Migration: Create disputes table for handling user disputes and complaints
-- This table tracks disputes/complaints from users (owners/customers) that require admin resolution

-- Step 1: Create dispute_type enum
DO $$ BEGIN
  CREATE TYPE dispute_type AS ENUM (
    'booking_issue',
    'payment_issue',
    'service_quality',
    'shop_claim',
    'account_issue',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create dispute_status enum
DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM (
    'open',
    'investigating',
    'resolved',
    'closed',
    'escalated'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References auth.users.id (can be owner or customer)
  user_type TEXT NOT NULL CHECK (user_type IN ('owner', 'customer', 'admin')), -- Type of user who created dispute
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL, -- Related booking if applicable
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL, -- Related conversation if applicable
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL, -- Related shop if applicable
  dispute_type dispute_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  resolution TEXT, -- Admin resolution notes
  resolved_at TIMESTAMPTZ, -- When dispute was resolved
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin who resolved it
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 4: Create indexes for disputes queries
CREATE INDEX IF NOT EXISTS idx_disputes_user_id ON disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_dispute_type ON disputes(dispute_type);
CREATE INDEX IF NOT EXISTS idx_disputes_booking_id ON disputes(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_disputes_shop_id ON disputes(shop_id) WHERE shop_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

-- Step 5: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_disputes_updated_at ON disputes;
CREATE TRIGGER trigger_update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_disputes_updated_at();

-- Step 6: Enable RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS Policies
-- Service role can access all disputes (for API)
DROP POLICY IF EXISTS "Service role can access all disputes" ON disputes;
CREATE POLICY "Service role can access all disputes" ON disputes
  FOR ALL USING (true);

-- Users can view their own disputes
DROP POLICY IF EXISTS "Users can view their own disputes" ON disputes;
CREATE POLICY "Users can view their own disputes" ON disputes
  FOR SELECT USING (auth.uid() = user_id);

-- Step 8: Add comments for documentation
COMMENT ON TABLE disputes IS 'Tracks user disputes and complaints requiring admin resolution';
COMMENT ON COLUMN disputes.user_type IS 'Type of user who created the dispute: owner, customer, or admin';
COMMENT ON COLUMN disputes.dispute_type IS 'Category of dispute: booking_issue, payment_issue, service_quality, shop_claim, account_issue, or other';
COMMENT ON COLUMN disputes.status IS 'Current status of dispute: open, investigating, resolved, closed, or escalated';

