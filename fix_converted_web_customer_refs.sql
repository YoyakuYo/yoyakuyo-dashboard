-- Fix conversations with "converted_web_customer_*" references

-- Check if the UUID part of "converted_web_customer_*" matches actual customers
SELECT
  conv.id as conversation_id,
  conv.customer_ref,
  -- Extract UUID from the converted_web_customer string
  substring(conv.customer_ref from 'converted_web_customer_(.+)') as extracted_uuid,
  c.id as found_customer_id,
  c.name as customer_name,
  c.role,
  CASE
    WHEN c.id IS NOT NULL THEN '✅ Can fix - customer exists'
    ELSE '❌ Cannot fix - customer not found'
  END as fix_status
FROM conversations conv
LEFT JOIN customers c ON c.id = substring(conv.customer_ref from 'converted_web_customer_(.+)')::uuid
WHERE conv.customer_ref LIKE 'converted_web_customer_%';

-- Update conversations to use the correct customer reference and type
UPDATE conversations
SET
  customer_ref = substring(customer_ref from 'converted_web_customer_(.+)'),
  customer_type = CASE
    WHEN c.role = 'guest' THEN 'guest'::customer_type_enum
    WHEN c.role = 'line' THEN 'line'::customer_type_enum
    ELSE 'guest'::customer_type_enum -- fallback
  END
FROM customers c
WHERE conversations.customer_ref LIKE 'converted_web_customer_%'
  AND c.id = substring(conversations.customer_ref from 'converted_web_customer_(.+)')::uuid;

-- Delete conversations that reference non-existent customers
DELETE FROM conversations
WHERE customer_ref LIKE 'converted_web_customer_%'
  AND substring(customer_ref from 'converted_web_customer_(.+)')::uuid NOT IN (
    SELECT id FROM customers
  );

-- Also delete any associated messages
DELETE FROM messages
WHERE conversation_id IN (
  SELECT id FROM conversations
  WHERE customer_ref LIKE 'converted_web_customer_%'
    AND substring(customer_ref from 'converted_web_customer_(.+)')::uuid NOT IN (
      SELECT id FROM customers
    )
);

-- Verify the fix worked
SELECT
  'After cleanup:' as status,
  COUNT(*) as total_conversations,
  COUNT(CASE WHEN customer_ref LIKE 'converted_web_customer_%' THEN 1 END) as remaining_converted_refs
FROM conversations;

-- Final conversation summary
SELECT
  customer_type,
  COUNT(*) as conversations,
  COUNT(DISTINCT customer_ref) as unique_customers
FROM conversations
GROUP BY customer_type
ORDER BY customer_type;