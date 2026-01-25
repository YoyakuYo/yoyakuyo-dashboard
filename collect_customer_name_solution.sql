-- Solution: How to collect the LINE customer name
-- Customer ID: 78fea290-ef9a-43c8-96d6-90460c04efe5

-- Option 1: Send a message asking for the customer's name
-- Insert a message into the conversation asking for their name
INSERT INTO messages (
  conversation_id,
  sender_type,
  content,
  created_at
) VALUES (
  '26a1f4b4-6ea0-498b-be43-27cfc69711e8', -- from the conversation data
  'owner',
  'Hello! Thank you for booking with us. May I please have your name so we can better serve you?',
  NOW()
);

-- Option 2: Update existing bookings with a default name (temporary solution)
-- You could update the customer_name in bookings to something like "LINE Customer"
UPDATE bookings
SET customer_name = 'LINE Customer ' || SUBSTRING(line_user_id FROM 1 FOR 8)
WHERE customer_id = '78fea290-ef9a-43c8-96d6-90460c04efe5'
  AND (customer_name IS NULL OR customer_name = '');

-- Option 3: Check if we can get name from LINE API (requires LINE Login integration)
-- This would involve:
-- 1. LINE Login OAuth flow to get user profile
-- 2. Store displayName from LINE profile in customers table

-- For now, let's see what we can do with the existing data
SELECT
  'Current Status:' as status,
  'LINE customer exists but name not collected' as issue,
  'Customer has made 20+ bookings' as activity,
  'Name missing from booking flow' as root_cause;

-- Show the conversation where we can ask for the name
SELECT
  conv.id as conversation_id,
  conv.customer_type,
  conv.customer_ref,
  COUNT(m.id) as total_messages,
  MAX(m.created_at) as last_message_at
FROM conversations conv
LEFT JOIN messages m ON m.conversation_id = conv.id
WHERE conv.customer_ref = '78fea290-ef9a-43c8-96d6-90460c04efe5'
GROUP BY conv.id, conv.customer_type, conv.customer_ref;

-- Recommendation: Update the booking flow to collect names
SELECT
  'RECOMMENDATION:' as action_needed,
  'Modify the LINE booking flow to ask for customer name' as step_1,
  'Add name field to booking form or conversation' as step_2,
  'Store name in bookings.customer_name column' as step_3,
  'Consider LINE Login integration for automatic name collection' as step_4;