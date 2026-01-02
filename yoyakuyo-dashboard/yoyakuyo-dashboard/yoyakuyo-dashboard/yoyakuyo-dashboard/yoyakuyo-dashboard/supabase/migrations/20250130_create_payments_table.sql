-- Migration: Create payments table for payment processing
-- Supports Stripe, LINE Pay, and PayPay payment methods

-- ============================================
-- 1. payments table
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'linepay', 'paypay')),
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'JPY',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    transaction_id TEXT,
    payment_intent_id TEXT, -- For Stripe
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS payments_booking_id_idx ON payments(booking_id);
CREATE INDEX IF NOT EXISTS payments_transaction_id_idx ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS payments_payment_intent_id_idx ON payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE INDEX IF NOT EXISTS payments_payment_method_idx ON payments(payment_method);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON payments;

CREATE POLICY "Users can read own payments"
ON payments
FOR SELECT
USING (
    -- Owners can see payments for their shop bookings
    EXISTS (
        SELECT 1 FROM bookings b
        JOIN shops s ON s.id = b.shop_id
        WHERE b.id = payments.booking_id
        AND s.owner_user_id = auth.uid()
    )
    OR
    -- Customers can see their own payments
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = payments.booking_id
        AND b.customer_profile_id = auth.uid()
    )
);

CREATE POLICY "Service role can manage payments"
ON payments
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 2. Add payment_status to bookings table
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'failed'));
        
        CREATE INDEX IF NOT EXISTS bookings_payment_status_idx ON bookings(payment_status);
    END IF;
END $$;

-- ============================================
-- 3. Create trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Add comments
COMMENT ON TABLE payments IS 'Payment records for bookings - supports Stripe, LINE Pay, and PayPay';
COMMENT ON COLUMN payments.payment_method IS 'Payment method: stripe, linepay, or paypay';
COMMENT ON COLUMN payments.status IS 'Payment status: pending, completed, failed, refunded, cancelled';
COMMENT ON COLUMN payments.transaction_id IS 'Transaction ID from payment provider';
COMMENT ON COLUMN payments.payment_intent_id IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN payments.metadata IS 'Additional payment data (client_secret, qr_code_url, etc.)';

