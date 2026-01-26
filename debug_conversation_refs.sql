-- Debug what values are in conversations.customer_ref
SELECT
  conv.customer_type,
  conv.customer_ref,
  CASE
    WHEN conv.customer_ref ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'Valid UUID'
    WHEN conv.customer_ref LIKE 'U%' THEN 'LINE User ID'
    ELSE 'Other format'
  END as ref_format,
  COUNT(*) as count
FROM conversations conv
GROUP BY conv.customer_type, conv.customer_ref,
  CASE
    WHEN conv.customer_ref ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'Valid UUID'
    WHEN conv.customer_ref LIKE 'U%' THEN 'LINE User ID'
    ELSE 'Other format'
  END
ORDER BY conv.customer_type, count DESC;

-- Show some examples of each type
SELECT
  'UUID format refs:' as type,
  customer_ref
FROM conversations
WHERE customer_ref ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
LIMIT 3;

SELECT
  'LINE user ID refs:' as type,
  customer_ref
FROM conversations
WHERE customer_ref LIKE 'U%'
LIMIT 3;

SELECT
  'Other format refs:' as type,
  customer_ref
FROM conversations
WHERE customer_ref NOT LIKE 'U%'
  AND customer_ref !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
LIMIT 5;