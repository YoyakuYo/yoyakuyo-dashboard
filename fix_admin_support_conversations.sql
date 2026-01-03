-- Fix existing admin support conversations that were incorrectly created with a shop_id
-- Admin support tickets should have shop_id = null

-- First, identify admin support conversations that have a shop_id
-- These are conversations where:
-- 1. is_support_ticket = true
-- 2. shop_id is NOT null
-- 3. There are admin messages in the conversation (indicating it's admin support)
-- Note: Admin messages are stored with source='ai' and source_id='admin' in participants table

WITH admin_support_conversations AS (
  SELECT DISTINCT c.id, c.shop_id, c.customer_type, c.customer_ref
  FROM conversations c
  INNER JOIN messages m ON m.conversation_id = c.id
  INNER JOIN participants p ON p.id = m.sender_id
  WHERE c.is_support_ticket = true
    AND c.shop_id IS NOT NULL
    AND p.source = 'ai'
    AND p.source_id = 'admin'
)
-- Update these conversations to have null shop_id
UPDATE conversations
SET shop_id = NULL
WHERE id IN (SELECT id FROM admin_support_conversations);

-- Also fix any support tickets that don't have admin messages but should be admin support
-- (conversations with is_support_ticket = true and shop_id IS NOT NULL but no owner messages)
-- This is a fallback for cases where we can't determine from messages
UPDATE conversations
SET shop_id = NULL
WHERE is_support_ticket = true
  AND shop_id IS NOT NULL
  AND id NOT IN (
    -- Exclude conversations that have owner messages (these are owner support, not admin)
    SELECT DISTINCT c.id
    FROM conversations c
    INNER JOIN messages m ON m.conversation_id = c.id
    INNER JOIN participants p ON p.id = m.sender_id
    WHERE c.is_support_ticket = true
      AND p.source = 'owner'
  );

-- Verify the fix
SELECT 
  id,
  shop_id,
  is_support_ticket,
  customer_type,
  customer_ref,
  CASE 
    WHEN shop_id IS NULL THEN '✅ Admin Support (correct)'
    ELSE '❌ Has shop_id (should be null for admin support)'
  END as status
FROM conversations
WHERE is_support_ticket = true
ORDER BY created_at DESC
LIMIT 20;

