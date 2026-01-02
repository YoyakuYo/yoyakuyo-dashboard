-- Migration: Create shop_notifications table for notification badge state
-- This migration creates the notification system for shop dashboard badges

-- ============================================
-- 1. Create shop_notifications table
-- ============================================
CREATE TABLE IF NOT EXISTS shop_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'new_booking' CHECK (type IN ('new_booking')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS shop_notifications_shop_id_idx ON shop_notifications(shop_id);
CREATE INDEX IF NOT EXISTS shop_notifications_booking_id_idx ON shop_notifications(booking_id);
CREATE INDEX IF NOT EXISTS shop_notifications_is_read_idx ON shop_notifications(shop_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS shop_notifications_created_at_idx ON shop_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE shop_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_notifications
DROP POLICY IF EXISTS "Shop owners can read own notifications" ON shop_notifications;
DROP POLICY IF EXISTS "Shop owners can update own notifications" ON shop_notifications;
DROP POLICY IF EXISTS "Service role can manage notifications" ON shop_notifications;

CREATE POLICY "Shop owners can read own notifications"
ON shop_notifications
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM shops
        WHERE shops.id = shop_notifications.shop_id
        AND shops.owner_user_id = auth.uid()
    )
);

CREATE POLICY "Shop owners can update own notifications"
ON shop_notifications
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM shops
        WHERE shops.id = shop_notifications.shop_id
        AND shops.owner_user_id = auth.uid()
    )
);

CREATE POLICY "Service role can manage notifications"
ON shop_notifications
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 2. Create function to automatically create notification on booking
-- ============================================
CREATE OR REPLACE FUNCTION create_shop_notification_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create notification when booking is created
    IF NEW.shop_id IS NOT NULL THEN
        INSERT INTO shop_notifications (shop_id, booking_id, type, is_read)
        VALUES (NEW.shop_id, NEW.id, 'new_booking', FALSE)
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_create_shop_notification ON bookings;
CREATE TRIGGER trigger_create_shop_notification
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_shop_notification_on_booking();

COMMENT ON TABLE shop_notifications IS 'Notifications for shop owners about new bookings';
COMMENT ON FUNCTION create_shop_notification_on_booking IS 'Automatically creates shop notification when booking is created';

