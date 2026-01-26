-- ============================================================================
-- CLEANUP DUPLICATE CONVERSATIONS
-- ============================================================================
-- Remove duplicate conversations, keeping only the most recent one per customer-shop pair
-- ============================================================================

-- First, let's see what we're about to delete (preview)
SELECT
    'TO DELETE' as action,
    c.id as conversation_id,
    c.created_at,
    c.customer_ref,
    c.target_id,
    cust.name as customer_name,
    s.name as shop_name,
    ROW_NUMBER() OVER (
        PARTITION BY c.customer_ref, c.target_id
        ORDER BY c.created_at DESC
    ) as rank_in_group
FROM conversations c
LEFT JOIN customers cust ON cust.id::text = c.customer_ref
LEFT JOIN shops s ON s.id::text = c.target_id
WHERE c.conversation_type = 'booking_owner'
  AND c.target_type = 'shop'
  AND (c.customer_ref, c.target_id) IN (
      SELECT customer_ref, target_id
      FROM conversations
      WHERE conversation_type = 'booking_owner'
        AND target_type = 'shop'
      GROUP BY customer_ref, target_id
      HAVING COUNT(*) > 1
  )
ORDER BY c.customer_ref, c.target_id, c.created_at DESC;

-- Now delete the duplicates, keeping only the most recent conversation per customer-shop pair
-- This query keeps the most recent conversation and deletes the older ones
DELETE FROM conversations
WHERE id IN (
    SELECT c.id
    FROM conversations c
    WHERE c.conversation_type = 'booking_owner'
      AND c.target_type = 'shop'
      AND c.id NOT IN (
          -- Keep the most recent conversation for each customer-shop pair
          SELECT DISTINCT ON (customer_ref, target_id) c2.id
          FROM conversations c2
          WHERE c2.conversation_type = 'booking_owner'
            AND c2.target_type = 'shop'
          ORDER BY customer_ref, target_id, created_at DESC
      )
);

-- Update bookings to point to the remaining conversation
-- This handles cases where bookings were pointing to deleted conversations
UPDATE bookings b
SET conversation_id = (
    SELECT c.id
    FROM conversations c
    WHERE c.conversation_type = 'booking_owner'
      AND c.target_type = 'shop'
      AND c.customer_ref = (
          SELECT cust.id::text
          FROM customers cust
          WHERE cust.id = b.customer_id
      )
      AND c.target_id = (
          SELECT s.id::text
          FROM shops s
          WHERE s.id = b.shop_id
      )
    ORDER BY c.created_at DESC
    LIMIT 1
)
WHERE b.conversation_id IS NULL
   OR b.conversation_id NOT IN (SELECT id FROM conversations);

-- Verify the cleanup worked
SELECT
    'AFTER CLEANUP' as status,
    COUNT(*) as total_booking_owner_conversations,
    COUNT(DISTINCT customer_ref || '-' || target_id) as unique_customer_shop_pairs,
    COUNT(*) - COUNT(DISTINCT customer_ref || '-' || target_id) as duplicates_removed
FROM conversations
WHERE conversation_type = 'booking_owner'
  AND target_type = 'shop';

-- Check for any remaining duplicates
SELECT
    'REMAINING DUPLICATES' as status,
    customer_ref,
    target_id,
    COUNT(*) as remaining_count
FROM conversations
WHERE conversation_type = 'booking_owner'
  AND target_type = 'shop'
GROUP BY customer_ref, target_id
HAVING COUNT(*) > 1;