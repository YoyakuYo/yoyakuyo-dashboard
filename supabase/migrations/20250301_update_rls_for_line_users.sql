-- ============================================
-- UPDATE RLS POLICIES FOR LINE USERS
-- ============================================
-- Allow authenticated LINE users (via line_users.id = auth.uid()) to read messages
-- ============================================

-- Drop existing anon policies (we'll use authenticated instead)
DROP POLICY IF EXISTS "anon_can_read_messages_for_realtime" ON messages;
DROP POLICY IF EXISTS "anon_can_read_conversations_for_realtime" ON conversations;

-- RLS Policy: Allow authenticated users to read messages in their conversations
-- This works for both web users (auth.uid() = customer_id) and LINE users (auth.uid() = line_users.id)
CREATE POLICY "authenticated_can_read_own_messages"
ON messages
FOR SELECT
TO authenticated
USING (
  -- User is a participant in the conversation
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      -- Web user: customer_ref matches customer_id
      (conversations.customer_type = 'web' AND conversations.customer_ref = auth.uid()::text)
      OR
      -- LINE user: customer_ref matches line_user_id, and auth.uid() is in line_users
      (conversations.customer_type = 'line' AND EXISTS (
        SELECT 1 FROM line_users
        WHERE line_users.id = auth.uid()
        AND line_users.line_user_id = conversations.customer_ref
      ))
      OR
      -- Shop owner: shop_id matches owner's shop
      EXISTS (
        SELECT 1 FROM shops
        WHERE shops.id = conversations.shop_id
        AND shops.owner_id = auth.uid()::text
      )
    )
  )
);

-- RLS Policy: Allow authenticated users to read their own conversations
CREATE POLICY "authenticated_can_read_own_conversations"
ON conversations
FOR SELECT
TO authenticated
USING (
  -- Web user
  (customer_type = 'web' AND customer_ref = auth.uid()::text)
  OR
  -- LINE user
  (customer_type = 'line' AND EXISTS (
    SELECT 1 FROM line_users
    WHERE line_users.id = auth.uid()
    AND line_users.line_user_id = customer_ref
  ))
  OR
  -- Shop owner
  EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = conversations.shop_id
    AND shops.owner_id = auth.uid()::text
  )
);

-- Also allow anon for backward compatibility (but prefer authenticated)
CREATE POLICY "anon_can_read_messages_for_realtime_fallback"
ON messages
FOR SELECT
TO anon
USING (true);

CREATE POLICY "anon_can_read_conversations_for_realtime_fallback"
ON conversations
FOR SELECT
TO anon
USING (true);

