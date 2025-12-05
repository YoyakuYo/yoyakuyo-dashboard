-- ============================================================================
-- CREATE PER-SHOP STAFF & ROLES SYSTEM
-- ============================================================================
-- This migration creates tables for shop teams (different from platform staff):
-- 1. shop_staff - staff members working at specific shops
-- 2. shop_staff_invitations - invitations for staff to join shops
-- ============================================================================

-- ============================================================================
-- STEP 1: Create shop_staff table (for shop teams, not platform staff)
-- ============================================================================
CREATE TABLE IF NOT EXISTS shop_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff', 'accountant')),
  can_manage_bookings BOOLEAN DEFAULT FALSE,
  can_reply_messages BOOLEAN DEFAULT FALSE,
  can_edit_services BOOLEAN DEFAULT FALSE,
  can_view_analytics BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure one user can only be staff at a shop once
  UNIQUE(shop_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_staff_shop_id ON shop_staff(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_staff_user_id ON shop_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_staff_role ON shop_staff(role);

-- ============================================================================
-- STEP 2: Create shop_staff_invitations table
-- ============================================================================
CREATE TABLE IF NOT EXISTS shop_staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff', 'accountant')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_staff_invitations_shop_id ON shop_staff_invitations(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_staff_invitations_email ON shop_staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_shop_staff_invitations_status ON shop_staff_invitations(status);

-- ============================================================================
-- STEP 3: Enable RLS
-- ============================================================================
ALTER TABLE shop_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_staff_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: RLS Policies for shop_staff
-- ============================================================================

-- Shop owners/managers can view staff for their shops
DROP POLICY IF EXISTS "Shop owners can view their shop staff" ON shop_staff;
CREATE POLICY "Shop owners can view their shop staff"
  ON shop_staff FOR SELECT
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
    OR user_id = auth.uid() -- Staff can view their own record
    OR (
      -- Managers can view staff for shops they manage
      EXISTS (
        SELECT 1 FROM shop_staff ss
        WHERE ss.shop_id = shop_staff.shop_id
        AND ss.user_id = auth.uid()
        AND ss.role IN ('owner', 'manager')
      )
    )
  );

-- Shop owners/managers can create staff for their shops
DROP POLICY IF EXISTS "Shop owners can create staff" ON shop_staff;
CREATE POLICY "Shop owners can create staff"
  ON shop_staff FOR INSERT
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
    OR (
      -- Managers can add staff if they have permission
      EXISTS (
        SELECT 1 FROM shop_staff ss
        WHERE ss.shop_id = shop_staff.shop_id
        AND ss.user_id = auth.uid()
        AND ss.role IN ('owner', 'manager')
      )
    )
  );

-- Shop owners/managers can update staff for their shops
DROP POLICY IF EXISTS "Shop owners can update staff" ON shop_staff;
CREATE POLICY "Shop owners can update staff"
  ON shop_staff FOR UPDATE
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
    OR (
      -- Managers can update staff if they have permission
      EXISTS (
        SELECT 1 FROM shop_staff ss
        WHERE ss.shop_id = shop_staff.shop_id
        AND ss.user_id = auth.uid()
        AND ss.role IN ('owner', 'manager')
      )
    )
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
    OR (
      EXISTS (
        SELECT 1 FROM shop_staff ss
        WHERE ss.shop_id = shop_staff.shop_id
        AND ss.user_id = auth.uid()
        AND ss.role IN ('owner', 'manager')
      )
    )
  );

-- Shop owners/managers can delete staff from their shops
DROP POLICY IF EXISTS "Shop owners can delete staff" ON shop_staff;
CREATE POLICY "Shop owners can delete staff"
  ON shop_staff FOR DELETE
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
    OR (
      EXISTS (
        SELECT 1 FROM shop_staff ss
        WHERE ss.shop_id = shop_staff.shop_id
        AND ss.user_id = auth.uid()
        AND ss.role IN ('owner', 'manager')
      )
    )
  );

-- ============================================================================
-- STEP 5: RLS Policies for shop_staff_invitations
-- ============================================================================

-- Shop owners/managers can view invitations for their shops
DROP POLICY IF EXISTS "Shop owners can view invitations" ON shop_staff_invitations;
CREATE POLICY "Shop owners can view invitations"
  ON shop_staff_invitations FOR SELECT
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
    OR invited_by_user_id = auth.uid()
    OR (
      EXISTS (
        SELECT 1 FROM shop_staff ss
        WHERE ss.shop_id = shop_staff_invitations.shop_id
        AND ss.user_id = auth.uid()
        AND ss.role IN ('owner', 'manager')
      )
    )
  );

-- Shop owners/managers can create invitations
DROP POLICY IF EXISTS "Shop owners can create invitations" ON shop_staff_invitations;
CREATE POLICY "Shop owners can create invitations"
  ON shop_staff_invitations FOR INSERT
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
    AND invited_by_user_id = auth.uid()
    OR (
      EXISTS (
        SELECT 1 FROM shop_staff ss
        WHERE ss.shop_id = shop_staff_invitations.shop_id
        AND ss.user_id = auth.uid()
        AND ss.role IN ('owner', 'manager')
      )
      AND invited_by_user_id = auth.uid()
    )
  );

-- Shop owners/managers can update invitations
DROP POLICY IF EXISTS "Shop owners can update invitations" ON shop_staff_invitations;
CREATE POLICY "Shop owners can update invitations"
  ON shop_staff_invitations FOR UPDATE
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
    OR invited_by_user_id = auth.uid()
  )
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
    OR invited_by_user_id = auth.uid()
  );

-- ============================================================================
-- STEP 6: Create updated_at triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION update_shop_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shop_staff_updated_at ON shop_staff;
CREATE TRIGGER update_shop_staff_updated_at
  BEFORE UPDATE ON shop_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_staff_updated_at();

CREATE OR REPLACE FUNCTION update_shop_staff_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shop_staff_invitations_updated_at ON shop_staff_invitations;
CREATE TRIGGER update_shop_staff_invitations_updated_at
  BEFORE UPDATE ON shop_staff_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_staff_invitations_updated_at();

-- ============================================================================
-- STEP 7: Add comments
-- ============================================================================
COMMENT ON TABLE shop_staff IS 'Staff members working at specific shops (per-shop teams, not platform staff)';
COMMENT ON TABLE shop_staff_invitations IS 'Invitations for users to join shop teams';
COMMENT ON COLUMN shop_staff.role IS 'Staff role: owner, manager, staff, or accountant';
COMMENT ON COLUMN shop_staff.can_manage_bookings IS 'Permission to manage bookings';
COMMENT ON COLUMN shop_staff.can_reply_messages IS 'Permission to reply to customer messages';
COMMENT ON COLUMN shop_staff.can_edit_services IS 'Permission to edit services and pricing';
COMMENT ON COLUMN shop_staff.can_view_analytics IS 'Permission to view analytics';

