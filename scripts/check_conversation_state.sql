-- Check current state of conversations in database
-- Run this in Supabase SQL Editor to verify before applying migration

-- 1. Total conversations
SELECT
  COUNT(*) as total_conversations
FROM conversations;

-- 2. Conversations by type
SELECT
  conversation_type,
  COUNT(*) as count
FROM conversations
GROUP BY conversation_type
ORDER BY conversation_type;

-- 3. Conversations with missing required fields
SELECT
  COUNT(*) as conversations_with_missing_fields
FROM conversations
WHERE booking_id IS NOT NULL
  AND (conversation_type IS NULL OR target_type IS NULL OR target_id IS NULL);

-- 4. Sample conversations with missing fields
SELECT
  id,
  type,
  conversation_type,
  target_type,
  target_id,
  shop_id,
  booking_id,
  customer_type,
  customer_ref
FROM conversations
WHERE booking_id IS NOT NULL
  AND (conversation_type IS NULL OR target_type IS NULL OR target_id IS NULL)
LIMIT 10;

-- 5. Guest conversations
SELECT
  COUNT(*) as guest_conversations
FROM conversations
WHERE customer_type = 'guest';

-- 6. Guest conversations with proper configuration
SELECT
  COUNT(*) as properly_configured_guest_conversations
FROM conversations
WHERE customer_type = 'guest'
  AND conversation_type = 'booking_owner'
  AND target_type = 'shop'
  AND target_id IS NOT NULL;

-- 7. Guest conversations that need fixing
SELECT
  id,
  conversation_type,
  target_type,
  target_id,
  shop_id,
  booking_id,
  customer_ref
FROM conversations
WHERE customer_type = 'guest'
  AND (conversation_type IS NULL OR target_type IS NULL OR target_id IS NULL);

-- 8. Conversations visible to owners (what the owner messages endpoint sees)
SELECT
  COUNT(*) as owner_visible_conversations
FROM conversations
WHERE conversation_type = 'booking_owner'
  AND target_type = 'shop'
  AND target_id IS NOT NULL;

-- 9. Sample owner-visible conversations
SELECT
  id,
  customer_type,
  customer_ref,
  shop_id,
  booking_id
FROM conversations
WHERE conversation_type = 'booking_owner'
  AND target_type = 'shop'
  AND target_id IS NOT NULL
ORDER BY last_message_at DESC NULLS LAST
LIMIT 10;