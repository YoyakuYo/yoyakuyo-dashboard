-- ============================================
-- MESSAGE ATTACHMENTS FOR SUPPORT CONVERSATIONS
-- ============================================
-- Allows owners and staff to share documents/files in support conversations
-- ============================================

-- Create message_attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL, -- Path in Supabase Storage
    file_name TEXT NOT NULL, -- Original filename
    file_size BIGINT, -- File size in bytes
    file_type TEXT, -- MIME type (e.g., 'application/pdf', 'image/jpeg')
    uploaded_by UUID, -- user_id of the uploader
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure file_path is unique per message (prevent duplicates)
    UNIQUE(message_id, file_path)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS message_attachments_message_id_idx ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS message_attachments_uploaded_by_idx ON message_attachments(uploaded_by);

-- Enable RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can manage all
DROP POLICY IF EXISTS "Service role can manage message attachments" ON message_attachments;
CREATE POLICY "Service role can manage message attachments"
ON message_attachments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS Policy: Users can view attachments for messages in their conversations
DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON message_attachments;
CREATE POLICY "Users can view attachments in their conversations"
ON message_attachments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE m.id = message_attachments.message_id
        AND (
            -- Owner can view if they own the shop
            EXISTS (
                SELECT 1 FROM shops s
                WHERE s.id = c.shop_id
                AND s.owner_user_id = auth.uid()
            )
            OR
            -- Admin can view support tickets (check admins table)
            (c.is_support_ticket = true AND EXISTS (
                SELECT 1 FROM admins a
                WHERE a.id = auth.uid()
                AND a.status = 'active'
            ))
        )
    )
);

COMMENT ON TABLE message_attachments IS 'Stores file attachments for messages in support conversations';
COMMENT ON COLUMN message_attachments.file_path IS 'Path in Supabase Storage bucket (e.g., support-messages/conversation_id/message_id/filename)';
COMMENT ON COLUMN message_attachments.file_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN message_attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN message_attachments.file_type IS 'MIME type of the file';

