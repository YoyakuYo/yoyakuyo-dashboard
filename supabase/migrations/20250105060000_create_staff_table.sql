-- ============================================================================
-- CREATE STAFF TABLE
-- ============================================================================
-- This migration creates the staff table for shop staff management
-- Used by: /shops page (Staff tab), API routes
-- ============================================================================

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  role TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_staff_shop_id ON staff(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_shop_id_active ON staff(shop_id, is_active);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can read active staff
DROP POLICY IF EXISTS "Public can read active staff" ON staff;
CREATE POLICY "Public can read active staff"
  ON staff
  FOR SELECT
  USING (is_active = TRUE);

-- Owners can read all staff for their shops
DROP POLICY IF EXISTS "Owners can read their shop staff" ON staff;
CREATE POLICY "Owners can read their shop staff"
  ON staff
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = staff.shop_id
      AND shops.owner_user_id = auth.uid()
    )
  );

-- Owners can insert staff for their shops
DROP POLICY IF EXISTS "Owners can insert staff" ON staff;
CREATE POLICY "Owners can insert staff"
  ON staff
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = staff.shop_id
      AND shops.owner_user_id = auth.uid()
    )
  );

-- Owners can update staff for their shops
DROP POLICY IF EXISTS "Owners can update their staff" ON staff;
CREATE POLICY "Owners can update their staff"
  ON staff
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = staff.shop_id
      AND shops.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = staff.shop_id
      AND shops.owner_user_id = auth.uid()
    )
  );

-- Owners can delete staff for their shops
DROP POLICY IF EXISTS "Owners can delete their staff" ON staff;
CREATE POLICY "Owners can delete their staff"
  ON staff
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = staff.shop_id
      AND shops.owner_user_id = auth.uid()
    )
  );

-- Service role can manage all staff
DROP POLICY IF EXISTS "Service role can manage all staff" ON staff;
CREATE POLICY "Service role can manage all staff"
  ON staff
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_updated_at();

-- Add comments
COMMENT ON TABLE staff IS 'Staff members working at shops';
COMMENT ON COLUMN staff.shop_id IS 'Foreign key to shops table';
COMMENT ON COLUMN staff.first_name IS 'Staff first name (required)';
COMMENT ON COLUMN staff.last_name IS 'Staff last name (optional)';
COMMENT ON COLUMN staff.phone IS 'Staff phone number (optional)';
COMMENT ON COLUMN staff.email IS 'Staff email address (optional)';
COMMENT ON COLUMN staff.role IS 'Staff role (e.g., "Stylist", "Therapist", "Manager")';
COMMENT ON COLUMN staff.is_active IS 'Whether the staff member is currently active';

