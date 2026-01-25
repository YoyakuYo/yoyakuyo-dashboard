-- Check current guest customer status - do they actually have names/emails?

SELECT
  'CURRENT GUEST STATUS CHECK:' as verification,
  COUNT(*) as total_guests,
  COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as guests_with_names,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as guests_with_emails,
  COUNT(CASE WHEN name IS NOT NULL AND email IS NOT NULL THEN 1 END) as guests_with_both,
  ROUND(
    COUNT(CASE WHEN name IS NOT NULL AND email IS NOT NULL THEN 1 END)::decimal /
    COUNT(*)::decimal * 100, 1
  ) || '%' as guests_with_complete_info
FROM customers
WHERE role = 'guest';

-- Show recent guest customers with their data
SELECT
  'Recent guests with contact info:' as check,
  c.id,
  c.name,
  c.email,
  c.created_at,
  CASE
    WHEN c.name IS NOT NULL AND c.email IS NOT NULL THEN '✅ Complete contact info'
    WHEN c.name IS NULL AND c.email IS NULL THEN '❌ No contact info'
    ELSE '⚠️ Partial contact info'
  END as contact_status
FROM customers c
WHERE c.role = 'guest'
ORDER BY c.created_at DESC
LIMIT 10;

-- Check if shops can see guest names/emails in conversations
SELECT
  'Guest conversations - can shops see names?' as check,
  conv.id as conversation_id,
  conv.customer_type,
  conv.customer_ref,
  c.name as guest_name,
  c.email as guest_email,
  CASE
    WHEN c.name IS NOT NULL AND c.email IS NOT NULL THEN '✅ Shop can see guest name/email'
    WHEN c.name IS NULL OR c.email IS NULL THEN '❌ Shop sees anonymous guest'
    ELSE 'Unknown'
  END as shop_visibility
FROM conversations conv
LEFT JOIN customers c ON (
  CASE WHEN conv.customer_type::text = 'line' THEN c.line_user_id = conv.customer_ref
       ELSE c.id = conv.customer_ref::uuid END
)
WHERE conv.customer_type::text = 'guest'
ORDER BY conv.created_at DESC
LIMIT 5;

-- Check if guest booking confirmations include contact info
SELECT
  'Guest booking confirmations:' as check,
  b.id as booking_id,
  b.customer_id,
  c.name as guest_name,
  c.email as guest_email,
  b.created_at as booking_time,
  CASE
    WHEN c.name IS NOT NULL AND c.email IS NOT NULL THEN '✅ Confirmation can include name/email'
    WHEN c.name IS NULL OR c.email IS NULL THEN '❌ Confirmation shows anonymous guest'
    ELSE 'Unknown'
  END as confirmation_status
FROM bookings b
JOIN customers c ON c.id = b.customer_id
WHERE c.role = 'guest'
ORDER BY b.created_at DESC
LIMIT 5;