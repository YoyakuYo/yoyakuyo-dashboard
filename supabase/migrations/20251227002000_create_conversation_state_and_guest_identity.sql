-- Migration: Create conversation_state + guest_identity tables for strict AI step flow

CREATE TABLE IF NOT EXISTS conversation_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NULL,
  channel text NOT NULL, -- 'guest' | 'web' | 'line'
  step text NOT NULL, -- GREETING | SERVICE_SELECT | LOCATION_SELECT | SHOP_LIST | END
  selected_service text NULL,
  selected_location text NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_state_customer
ON conversation_state(customer_id);

CREATE TABLE IF NOT EXISTS guest_identity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NULL,
  created_at timestamptz DEFAULT now()
);


