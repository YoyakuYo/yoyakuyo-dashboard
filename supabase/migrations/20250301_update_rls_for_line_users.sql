-- ============================================
-- UPDATE RLS POLICIES FOR LINE USERS
-- ============================================
-- Allow authenticated LINE users (via customers.id = auth.uid()) to read messages
-- LINE users have customers.id = auth.users.id, so we can use auth.uid() directly
-- ============================================

-- Drop existing anon policies (we'll use authenticated instead)
DROP POLICY IF EXISTS "anon_can_read_messages_for_realtime" ON messages;
DROP POLICY IF EXISTS "anon_can_read_conversations_for_realtime" ON conversations;

-- RLS Policy: Allow authenticated users to read messages in their conversations
-- This works for both web users and LINE users (both have customers.id = auth.users.id)
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
      -- Web user: customer_ref matches customer_id (auth.uid())
      (conversations.customer_type = 'web' AND conversations.customer_ref = auth.uid()::text)
      OR
      -- LINE user: customer_ref matches line_user_id, and auth.uid() is in customers via line_accounts
      (conversations.customer_type = 'line' AND EXISTS (
        SELECT 1 FROM line_accounts la
        INNER JOIN customers c ON la.customer_id = c.id
        WHERE c.id = auth.uid()
        AND la.line_user_id = conversations.customer_ref
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
  -- LINE user: customer_ref matches line_user_id, and auth.uid() is in customers via line_accounts
  (customer_type = 'line' AND EXISTS (
    SELECT 1 FROM line_accounts la
    INNER JOIN customers c ON la.customer_id = c.id
    WHERE c.id = auth.uid()
    AND la.line_user_id = customer_ref
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

