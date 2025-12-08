-- ============================================================================
-- CREATE UNIFIED MESSAGING SYSTEM
-- ============================================================================
-- This migration creates a unified conversations and messages system
-- for Customer ↔ Owner ↔ Staff messaging
-- ============================================================================

-- 1. Create conversation type enum
DO $$ BEGIN
  CREATE TYPE conversation_type AS ENUM (
    'customer_owner',
    'owner_staff',
    'staff_customer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create sender role enum
DO $$ BEGIN
  CREATE TYPE sender_role_type AS ENUM (
    'customer',
    'owner',
    'staff'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type conversation_type NOT NULL,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role sender_role_type NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false
);

-- 5. Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_shop_id ON conversations(shop_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner_id ON conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_staff_id ON conversations(staff_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- 6. Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE is_read = false;

-- 7. Create unique constraint for conversations
-- One conversation per type per participant combination
CREATE UNIQUE INDEX IF NOT EXISTS unique_customer_owner_conversation 
  ON conversations(shop_id, customer_id, owner_id) 
  WHERE type = 'customer_owner' AND customer_id IS NOT NULL AND owner_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_owner_staff_conversation 
  ON conversations(shop_id, owner_id, staff_id) 
  WHERE type = 'owner_staff' AND owner_id IS NOT NULL AND staff_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_staff_customer_conversation 
  ON conversations(shop_id, customer_id, staff_id) 
  WHERE type = 'staff_customer' AND customer_id IS NOT NULL AND staff_id IS NOT NULL;

-- 8. Create trigger to update conversations.updated_at when messages are inserted
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_updated_at ON messages;
CREATE TRIGGER trigger_update_conversation_updated_at
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

-- 9. Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for conversations

-- Customers can view their own conversations
DROP POLICY IF EXISTS "Customers can view their conversations" ON conversations;
CREATE POLICY "Customers can view their conversations" ON conversations
  FOR SELECT USING (
    customer_id = auth.uid()
  );

-- Owners can view conversations for their shops
DROP POLICY IF EXISTS "Owners can view shop conversations" ON conversations;
CREATE POLICY "Owners can view shop conversations" ON conversations
  FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = conversations.shop_id
      AND shops.owner_user_id = auth.uid()
    )
  );

-- Staff can view all conversations
DROP POLICY IF EXISTS "Staff can view all conversations" ON conversations;
CREATE POLICY "Staff can view all conversations" ON conversations
  FOR SELECT USING (
    staff_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

-- Allow inserts (will be handled by backend with service role)
DROP POLICY IF EXISTS "Service role can manage conversations" ON conversations;
CREATE POLICY "Service role can manage conversations" ON conversations
  FOR ALL USING (true)
  WITH CHECK (true);

-- 11. RLS Policies for messages

-- Customers can view messages in their conversations
DROP POLICY IF EXISTS "Customers can view their messages" ON messages;
CREATE POLICY "Customers can view their messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE customer_id = auth.uid()
    )
  );

-- Owners can view messages in their shop conversations
DROP POLICY IF EXISTS "Owners can view shop messages" ON messages;
CREATE POLICY "Owners can view shop messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM shops
        WHERE shops.id = conversations.shop_id
        AND shops.owner_user_id = auth.uid()
      )
    )
  );

-- Staff can view all messages
DROP POLICY IF EXISTS "Staff can view all messages" ON messages;
CREATE POLICY "Staff can view all messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE staff_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE auth_user_id = auth.uid() AND active = true
    )
  );

-- Allow inserts (will be handled by backend with service role)
DROP POLICY IF EXISTS "Service role can manage messages" ON messages;
CREATE POLICY "Service role can manage messages" ON messages
  FOR ALL USING (true)
  WITH CHECK (true);

-- 12. Create function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_type conversation_type,
  p_shop_id UUID,
  p_customer_id UUID DEFAULT NULL,
  p_owner_id UUID DEFAULT NULL,
  p_staff_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE type = p_type
    AND shop_id = p_shop_id
    AND (p_customer_id IS NULL OR customer_id = p_customer_id)
    AND (p_owner_id IS NULL OR owner_id = p_owner_id)
    AND (p_staff_id IS NULL OR staff_id = p_staff_id)
  LIMIT 1;

  -- If not found, create new conversation
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (type, shop_id, customer_id, owner_id, staff_id)
    VALUES (p_type, p_shop_id, p_customer_id, p_owner_id, p_staff_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Enable realtime for messages and conversations tables
-- Only add if not already in publication
DO $$
BEGIN
  -- Add messages table to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  -- Add conversations table to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
END $$;

