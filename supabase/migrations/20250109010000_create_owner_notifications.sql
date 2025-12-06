-- ============================================================================
-- CREATE owner_notifications TABLE
-- ============================================================================
-- Stores notifications for owners (verification resubmission, approval, etc.)

CREATE TABLE IF NOT EXISTS owner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  verification_id UUID REFERENCES owner_verification(id) ON DELETE SET NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_owner_notifications_receiver_id ON owner_notifications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_owner_notifications_is_read ON owner_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_owner_notifications_verification_id ON owner_notifications(verification_id);
CREATE INDEX IF NOT EXISTS idx_owner_notifications_created_at ON owner_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE owner_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Owners can read their own notifications
CREATE POLICY "Owners can view their own notifications"
  ON owner_notifications FOR SELECT
  USING (auth.uid() = receiver_id);

-- Owners can update their own notifications (mark as read)
CREATE POLICY "Owners can update their own notifications"
  ON owner_notifications FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Staff can insert notifications for any owner
CREATE POLICY "Staff can create notifications"
  ON owner_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.auth_user_id = auth.uid()
      AND staff_profiles.active = true
    )
  );

-- Staff can view all notifications
CREATE POLICY "Staff can view all notifications"
  ON owner_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.auth_user_id = auth.uid()
      AND staff_profiles.active = true
    )
  );

COMMENT ON TABLE owner_notifications IS 'Notifications for shop owners (verification status changes, resubmission requests, etc.)';
COMMENT ON COLUMN owner_notifications.type IS 'Notification type: verification_resubmission, verification_approved, verification_rejected, etc.';
COMMENT ON COLUMN owner_notifications.is_read IS 'Whether the owner has read this notification';

