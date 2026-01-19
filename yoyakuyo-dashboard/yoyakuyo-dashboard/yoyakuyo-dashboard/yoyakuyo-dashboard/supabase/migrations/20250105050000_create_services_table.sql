-- ============================================================================
-- CREATE SERVICES TABLE
-- ============================================================================
-- This migration creates the services table for shop service management
-- Used by: /shops page (Services tab), /bookings page, API routes
-- ============================================================================

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_services_shop_id ON services(shop_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_shop_id_active ON services(shop_id, is_active);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can read active services
DROP POLICY IF EXISTS "Public can read active services" ON services;
CREATE POLICY "Public can read active services"
  ON services
  FOR SELECT
  USING (is_active = TRUE);

-- Owners can read all services for their shops
DROP POLICY IF EXISTS "Owners can read their shop services" ON services;
CREATE POLICY "Owners can read their shop services"
  ON services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = services.shop_id
      AND shops.owner_user_id = auth.uid()
    )
  );

-- Owners can insert services for their shops
DROP POLICY IF EXISTS "Owners can insert services" ON services;
CREATE POLICY "Owners can insert services"
  ON services
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = services.shop_id
      AND shops.owner_user_id = auth.uid()
    )
  );

-- Owners can update services for their shops
DROP POLICY IF EXISTS "Owners can update their services" ON services;
CREATE POLICY "Owners can update their services"
  ON services
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = services.shop_id
      AND shops.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = services.shop_id
      AND shops.owner_user_id = auth.uid()
    )
  );

-- Owners can delete services for their shops
DROP POLICY IF EXISTS "Owners can delete their services" ON services;
CREATE POLICY "Owners can delete their services"
  ON services
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = services.shop_id
      AND shops.owner_user_id = auth.uid()
    )
  );

-- Service role can manage all services
DROP POLICY IF EXISTS "Service role can manage all services" ON services;
CREATE POLICY "Service role can manage all services"
  ON services
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_updated_at();

-- Add comments
COMMENT ON TABLE services IS 'Services offered by shops (e.g., haircut, massage, consultation)';
COMMENT ON COLUMN services.shop_id IS 'Foreign key to shops table';
COMMENT ON COLUMN services.name IS 'Service name (e.g., "Haircut", "30-minute Massage")';
COMMENT ON COLUMN services.description IS 'Optional service description';
COMMENT ON COLUMN services.price IS 'Service price in JPY';
COMMENT ON COLUMN services.duration_minutes IS 'Service duration in minutes (nullable)';
COMMENT ON COLUMN services.is_active IS 'Whether the service is currently available for booking';

