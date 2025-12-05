-- ============================================================================
-- UNIFIED STAFF / MANAGER PROFILE SYSTEM
-- ============================================================================
-- This migration creates:
-- 1. staff_profiles table (admins, managers, verifiers, support)
-- 2. complaints table (support center)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create staff_profiles table
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_profiles_auth_user_id ON staff_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_email ON staff_profiles(email);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_active ON staff_profiles(active);

-- ============================================================================
-- STEP 2: Create complaints table
-- ============================================================================
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  assigned_to UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_shop_id ON complaints(shop_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);

-- ============================================================================
-- STEP 3: Create complaint_messages table for conversation thread
-- ============================================================================
CREATE TABLE IF NOT EXISTS complaint_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'staff')),
  staff_profile_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_complaint_messages_complaint_id ON complaint_messages(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_messages_created_at ON complaint_messages(created_at DESC);

-- ============================================================================
-- STEP 4: Add staff control fields to shops table
-- ============================================================================
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS staff_notes TEXT,
ADD COLUMN IF NOT EXISTS last_staff_edit_by UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_staff_edit_at TIMESTAMPTZ;

-- ============================================================================
-- STEP 5: Enable RLS on all new tables
-- ============================================================================
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: RLS Policies for staff_profiles
-- ============================================================================
-- Staff can view all staff profiles
CREATE POLICY "Staff can view all staff profiles"
  ON staff_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.active = TRUE
    )
  );

-- Only super admins can insert/update staff profiles
CREATE POLICY "Super admins can manage staff profiles"
  ON staff_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.is_super_admin = TRUE
      AND sp.active = TRUE
    )
  );

-- ============================================================================
-- STEP 7: RLS Policies for complaints
-- ============================================================================
-- Users can view their own complaints
CREATE POLICY "Users can view their own complaints"
  ON complaints FOR SELECT
  USING (user_id = auth.uid());

-- Users can create complaints
CREATE POLICY "Users can create complaints"
  ON complaints FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Staff can view all complaints
CREATE POLICY "Staff can view all complaints"
  ON complaints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.active = TRUE
    )
  );

-- Staff can update complaints
CREATE POLICY "Staff can update complaints"
  ON complaints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.active = TRUE
    )
  );

-- ============================================================================
-- STEP 8: RLS Policies for complaint_messages
-- ============================================================================
-- Users can view messages for their complaints
CREATE POLICY "Users can view their complaint messages"
  ON complaint_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM complaints c
      WHERE c.id = complaint_messages.complaint_id
      AND c.user_id = auth.uid()
    )
    OR sender_id = auth.uid()
  );

-- Users can send messages to their complaints
CREATE POLICY "Users can send complaint messages"
  ON complaint_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM complaints c
      WHERE c.id = complaint_id
      AND c.user_id = auth.uid()
    )
    AND sender_type = 'user'
    AND sender_id = auth.uid()
  );

-- Staff can view all complaint messages
CREATE POLICY "Staff can view all complaint messages"
  ON complaint_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.active = TRUE
    )
  );

-- Staff can send messages to any complaint
CREATE POLICY "Staff can send complaint messages"
  ON complaint_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.active = TRUE
    )
    AND sender_type = 'staff'
    AND EXISTS (
      SELECT 1 FROM staff_profiles sp2
      WHERE sp2.id = staff_profile_id
      AND sp2.auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 9: Update shops RLS to allow staff full access
-- ============================================================================
-- Staff can read all shops (update existing policy or create new)
DROP POLICY IF EXISTS "Staff can read all shops" ON shops;
CREATE POLICY "Staff can read all shops"
  ON shops FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.active = TRUE
    )
    OR owner_user_id = auth.uid()
    OR owner_user_id IS NULL
  );

-- Staff can update all shops
DROP POLICY IF EXISTS "Staff can update all shops" ON shops;
CREATE POLICY "Staff can update all shops"
  ON shops FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.active = TRUE
    )
  );

-- ============================================================================
-- STEP 10: Update bookings RLS to allow staff full access
-- ============================================================================
-- Staff can read all bookings
DROP POLICY IF EXISTS "Staff can read all bookings" ON bookings;
CREATE POLICY "Staff can read all bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.active = TRUE
    )
    OR shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
    OR customer_profile_id IN (SELECT id FROM customer_profiles WHERE id = auth.uid())
  );

-- Staff can insert/update/delete all bookings
DROP POLICY IF EXISTS "Staff can manage all bookings" ON bookings;
CREATE POLICY "Staff can manage all bookings"
  ON bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.active = TRUE
    )
  );

-- ============================================================================
-- STEP 11: Update services RLS to allow staff full access
-- ============================================================================
-- Staff can read all services
DROP POLICY IF EXISTS "Staff can read all services" ON services;
CREATE POLICY "Staff can read all services"
  ON services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.active = TRUE
    )
    OR shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
  );

-- Staff can manage all services
DROP POLICY IF EXISTS "Staff can manage all services" ON services;
CREATE POLICY "Staff can manage all services"
  ON services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.auth_user_id = auth.uid()
      AND sp.active = TRUE
    )
  );

-- ============================================================================
-- STEP 12: Add comments for documentation
-- ============================================================================
COMMENT ON TABLE staff_profiles IS 'Unified staff/manager profile system for admins, managers, verifiers, and support';
COMMENT ON TABLE complaints IS 'Support center complaints from users';
COMMENT ON TABLE complaint_messages IS 'Conversation thread for complaints';
COMMENT ON COLUMN staff_profiles.is_super_admin IS 'Super admins can manage other staff profiles';
COMMENT ON COLUMN shops.staff_notes IS 'Internal notes from staff about the shop';
COMMENT ON COLUMN shops.last_staff_edit_by IS 'Last staff member who edited this shop';

