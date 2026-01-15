-- ============================================
-- CREATE PENDING BOOKINGS TABLE
-- ============================================
-- Separate table for pending booking requests before confirmation
-- This allows for better separation between pending and confirmed bookings

CREATE TABLE IF NOT EXISTS pending_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  source booking_source_enum NOT NULL,
  channel booking_channel_enum NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pending_channel_equals_source CHECK (channel = source)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_bookings_shop_id ON pending_bookings(shop_id);
CREATE INDEX IF NOT EXISTS idx_pending_bookings_customer_id ON pending_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_pending_bookings_source ON pending_bookings(source);
CREATE INDEX IF NOT EXISTS idx_pending_bookings_date ON pending_bookings(date);

-- Row Level Security
ALTER TABLE pending_bookings ENABLE ROW LEVEL SECURITY;

-- Owners can read pending bookings for their shops
CREATE POLICY "owners_read_pending_bookings"
ON pending_bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = pending_bookings.shop_id
      AND shops.owner_id = auth.uid()
  )
);

-- Customers can read their own pending bookings
CREATE POLICY "customers_read_own_pending_bookings"
ON pending_bookings
FOR SELECT
USING (customer_id = auth.uid());

-- Allow inserting pending bookings (for booking creation)
CREATE POLICY "customers_insert_pending_bookings"
ON pending_bookings
FOR INSERT
WITH CHECK (customer_id = auth.uid());

-- Service role can do everything
CREATE POLICY "service_role_manage_pending_bookings"
ON pending_bookings
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- TRANSACTION FUNCTION FOR CONFIRMING PENDING BOOKINGS
-- ============================================

CREATE OR REPLACE FUNCTION confirm_pending_booking_transaction(
  pending_booking_id UUID,
  shop_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_record RECORD;
  confirmed_booking_id UUID;
  result JSONB;
BEGIN
  -- Get the pending booking data
  SELECT * INTO pending_record
  FROM pending_bookings
  WHERE id = pending_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending booking not found';
  END IF;

  -- Insert into bookings table
  INSERT INTO bookings (
    shop_id,
    service_id,
    customer_id,
    source,
    channel,
    status,
    date,
    start_time,
    customer_name,
    customer_email,
    customer_phone,
    notes,
    created_at,
    updated_at
  )
  VALUES (
    pending_record.shop_id,
    pending_record.service_id,
    pending_record.customer_id,
    pending_record.source,
    pending_record.channel,
    'confirmed',
    pending_record.date,
    pending_record.start_time,
    pending_record.customer_name,
    pending_record.customer_email,
    pending_record.customer_phone,
    pending_record.notes,
    pending_record.created_at,
    now()
  )
  RETURNING id INTO confirmed_booking_id;

  -- Mark pending booking as confirmed (or delete it)
  UPDATE pending_bookings
  SET notes = COALESCE(notes, '') || ' [CONFIRMED:' || confirmed_booking_id || ']'
  WHERE id = pending_booking_id;

  -- Return the confirmed booking data
  SELECT jsonb_build_object(
    'id', b.id,
    'shop_id', b.shop_id,
    'service_id', b.service_id,
    'customer_id', b.customer_id,
    'source', b.source,
    'channel', b.channel,
    'status', b.status,
    'date', b.date,
    'start_time', b.start_time,
    'customer_name', b.customer_name,
    'customer_email', b.customer_email,
    'customer_phone', b.customer_phone,
    'notes', b.notes,
    'created_at', b.created_at,
    'updated_at', b.updated_at
  ) INTO result
  FROM bookings b
  WHERE b.id = confirmed_booking_id;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION confirm_pending_booking_transaction(UUID, UUID) IS 'Confirms a pending booking by inserting it into the bookings table and marking the pending booking as resolved';

COMMENT ON TABLE pending_bookings IS 'Temporary storage for booking requests before owner confirmation';