-- Fix conversation_participants user_id values
-- This migration fixes missing user_id values in conversation_participants table
-- which are required for RLS policies to work correctly

-- ============================================
-- PART 1: Fix shop participants - add missing user_id (shop owner)
-- ============================================
UPDATE conversation_participants
SET
  user_id = shops.owner_user_id,
  shop_id = shops.id  -- Also fix missing shop_id
FROM conversations, shops
WHERE conversation_participants.participant_type = 'shop'
  AND conversation_participants.conversation_id = conversations.id
  AND conversations.shop_id = shops.id
  AND shops.owner_user_id IS NOT NULL
  AND conversation_participants.user_id IS NULL;

-- ============================================
-- PART 2: Fix customer participants - add missing line_user_id only
-- ============================================
-- NOTE: user_id should remain NULL for customers since they reference customers table, not users table
-- Only shop owners (from users table) should have user_id set

-- For LINE customers - set line_user_id correctly (user_id stays NULL)
UPDATE conversation_participants
SET line_user_id = customers.line_user_id
FROM customers, conversations
WHERE conversation_participants.participant_type = 'line_customer'
  AND conversation_participants.conversation_id = conversations.id
  AND conversations.customer_type = 'line'
  AND conversations.customer_ref = customers.id::TEXT
  AND customers.role = 'line'
  AND customers.line_user_id IS NOT NULL
  AND conversation_participants.line_user_id IS NULL;

-- ============================================
-- PART 3: Clean up invalid customer participants
-- ============================================
-- Remove customer participants that don't match conversation customer_ref
DELETE FROM conversation_participants
WHERE participant_type IN ('customer', 'web_customer', 'line_customer', 'guest')
  AND conversation_id IN (
    SELECT c.id
    FROM conversations c
    WHERE c.customer_ref != conversation_participants.participant_ref
  );

-- ============================================
-- PART 4: Verification
-- ============================================
-- Show what we fixed
SELECT
    'Shop participants with user_id' as action,
    COUNT(*) as count
FROM conversation_participants
WHERE participant_type = 'shop' AND user_id IS NOT NULL
UNION ALL
SELECT
    'LINE participants with line_user_id' as action,
    COUNT(*) as count
FROM conversation_participants
WHERE participant_type = 'line_customer' AND line_user_id IS NOT NULL
UNION ALL
SELECT
    'Total participants' as action,
    COUNT(*) as count
FROM conversation_participants
UNION ALL
SELECT
    'Conversations with participants' as action,
    COUNT(DISTINCT conversation_id) as count
FROM conversation_participants;
