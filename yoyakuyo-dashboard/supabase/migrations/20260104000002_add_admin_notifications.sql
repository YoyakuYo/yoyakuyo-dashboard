-- Migration: Add admin support to notifications table
-- This migration extends the notifications table to support admin recipients

-- Update notifications table to support 'admin' recipient_type
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_recipient_type_check;

ALTER TABLE notifications 
  ADD CONSTRAINT notifications_recipient_type_check 
  CHECK (recipient_type IN ('owner', 'customer', 'admin'));

-- Update RLS policy to allow admins to read their own notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;

CREATE POLICY "Users can read own notifications"
ON notifications
FOR SELECT
USING (
    (recipient_type = 'owner' AND recipient_id = auth.uid()) OR
    (recipient_type = 'customer' AND recipient_id = auth.uid()) OR
    (recipient_type = 'admin' AND recipient_id = auth.uid())
);

-- Update RLS policy to allow admins to update their own notifications
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can update own notifications"
ON notifications
FOR UPDATE
USING (
    (recipient_type = 'owner' AND recipient_id = auth.uid()) OR
    (recipient_type = 'customer' AND recipient_id = auth.uid()) OR
    (recipient_type = 'admin' AND recipient_id = auth.uid())
)
WITH CHECK (
    (recipient_type = 'owner' AND recipient_id = auth.uid()) OR
    (recipient_type = 'customer' AND recipient_id = auth.uid()) OR
    (recipient_type = 'admin' AND recipient_id = auth.uid())
);

-- Ensure notifications table is in the realtime publication
-- This is required for real-time subscriptions to work
DO $$
BEGIN
    -- Add notifications to realtime publication if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
        RAISE NOTICE '✅ Added notifications table to supabase_realtime publication';
    ELSE
        RAISE NOTICE '✅ notifications table already in supabase_realtime publication';
    END IF;
END $$;

-- Enable REPLICA IDENTITY FULL for notifications table
-- This allows Supabase Realtime to send complete row data in INSERT/UPDATE events
-- Without this, realtime events won't fire or will be incomplete
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Verify setup (commented out - uncomment to check)
-- SELECT 
--     tablename,
--     CASE 
--         WHEN tablename = 'notifications' THEN '✅ IN PUBLICATION'
--         ELSE '❌ NOT IN PUBLICATION'
--     END as status
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime' 
-- AND tablename = 'notifications';

