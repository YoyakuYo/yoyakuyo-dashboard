-- Migration: Complete LINE Booking System
-- Adds LINE user tracking to customer_profiles and creates LINE conversation/booking tables

-- Add LINE fields to customer_profiles table
ALTER TABLE customer_profiles 
ADD COLUMN IF NOT EXISTS line_user_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS line_display_name TEXT,
ADD COLUMN IF NOT EXISTS line_picture_url TEXT;

-- Create index for LINE user lookups
CREATE INDEX IF NOT EXISTS customer_profiles_line_user_id_idx ON customer_profiles(line_user_id) WHERE line_user_id IS NOT NULL;

-- Create LINE conversations table for bot state management
CREATE TABLE IF NOT EXISTS line_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL,
  customer_profile_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  conversation_state TEXT, -- 'searching', 'booking', 'viewing_bookings', 'completed', 'idle'
  context JSONB DEFAULT '{}', -- Store booking context, search filters, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for LINE user lookups
CREATE INDEX IF NOT EXISTS line_conversations_line_user_id_idx ON line_conversations(line_user_id);
CREATE INDEX IF NOT EXISTS line_conversations_customer_profile_id_idx ON line_conversations(customer_profile_id);

-- Create LINE bookings table (link LINE bookings to regular bookings)
CREATE TABLE IF NOT EXISTS line_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL,
  line_message_id TEXT, -- For sending updates via LINE
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS line_bookings_booking_id_idx ON line_bookings(booking_id);
CREATE INDEX IF NOT EXISTS line_bookings_line_user_id_idx ON line_bookings(line_user_id);

-- Enable RLS
ALTER TABLE line_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for line_conversations
CREATE POLICY "Users can read their own LINE conversations"
  ON line_conversations
  FOR SELECT
  USING (
    customer_profile_id IN (
      SELECT id FROM customer_profiles 
      WHERE customer_auth_id = auth.uid() OR id = auth.uid()
    )
    OR line_user_id IN (
      SELECT line_user_id FROM customer_profiles 
      WHERE customer_auth_id = auth.uid() OR id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage LINE conversations"
  ON line_conversations
  FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for line_bookings
CREATE POLICY "Users can read their own LINE bookings"
  ON line_bookings
  FOR SELECT
  USING (
    line_user_id IN (
      SELECT line_user_id FROM customer_profiles 
      WHERE customer_auth_id = auth.uid() OR id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage LINE bookings"
  ON line_bookings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add trigger for updated_at on line_conversations
CREATE OR REPLACE FUNCTION update_line_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_line_conversations_updated_at ON line_conversations;
CREATE TRIGGER update_line_conversations_updated_at
  BEFORE UPDATE ON line_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_line_conversations_updated_at();

-- Comments
COMMENT ON TABLE line_conversations IS 'Tracks LINE bot conversation state for each user';
COMMENT ON TABLE line_bookings IS 'Links LINE bookings to regular bookings table';
COMMENT ON COLUMN customer_profiles.line_user_id IS 'LINE user ID for LINE Login and Messaging API';

