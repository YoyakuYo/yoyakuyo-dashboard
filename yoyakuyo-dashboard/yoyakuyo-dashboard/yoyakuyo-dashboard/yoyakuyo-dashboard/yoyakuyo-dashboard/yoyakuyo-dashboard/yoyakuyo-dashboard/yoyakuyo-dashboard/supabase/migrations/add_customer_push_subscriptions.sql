-- Migration: Add customer push subscriptions table
-- Stores Web Push subscription endpoints for customers

CREATE TABLE IF NOT EXISTS customer_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, endpoint) -- One subscription per customer/endpoint
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS customer_push_subscriptions_customer_id_idx ON customer_push_subscriptions(customer_id);

-- Add comment
COMMENT ON TABLE customer_push_subscriptions IS 'Stores Web Push subscription endpoints for customers to receive notifications';

