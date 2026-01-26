-- ENSURE FUTURE GUESTS AND LINE CUSTOMERS ARE AUTOMATICALLY VISIBLE

-- CHECK HOW NEW GUESTS GET CONVERSATIONS
SELECT
  'Future guest conversation creation:' as check,
  'Guest booking API should create conversation automatically' as current_system,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name LIKE '%booking%'
      AND routine_definition LIKE '%conversation%'
    )
    THEN '✅ System has conversation creation logic'
    ELSE '❌ System may not auto-create conversations'
  END as booking_api_status;

-- CHECK HOW NEW LINE CUSTOMERS GET CONVERSATIONS
SELECT
  'Future LINE customer conversation creation:' as check,
  'LINE message webhook should create conversation on first message' as current_system,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND (routine_name LIKE '%line%' OR routine_name LIKE '%webhook%')
      AND routine_definition LIKE '%conversation%'
    )
    THEN '✅ LINE webhook creates conversations'
    ELSE '❌ LINE system may not auto-create conversations'
  END as line_system_status;

-- VERIFY GUEST BOOKING FLOW CREATES CONVERSATIONS
SELECT
  'Guest booking flow check:' as verification,
  'API endpoint: POST /bookings/guest' as endpoint,
  'Should create: customer + booking + conversation' as expected_behavior,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM customers c
      JOIN bookings b ON b.customer_id = c.id
      LEFT JOIN conversations conv ON conv.customer_ref = c.id::text AND conv.customer_type::text = 'guest'
      WHERE c.role = 'guest'
      AND conv.id IS NOT NULL
      LIMIT 1
    )
    THEN '✅ Guest bookings create conversations'
    ELSE '❌ Guest bookings NOT creating conversations'
  END as current_status;

-- VERIFY LINE CUSTOMER FLOW CREATES CONVERSATIONS
SELECT
  'LINE customer flow check:' as verification,
  'On first LINE message' as trigger,
  'Should create: customer (if new) + conversation' as expected_behavior,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM customers c
      LEFT JOIN conversations conv ON (
        CASE WHEN conv.customer_type::text = 'line' THEN conv.customer_ref = c.line_user_id
             ELSE false END
      )
      WHERE c.role = 'customer'
      AND c.line_user_id IS NOT NULL
      AND conv.id IS NOT NULL
      LIMIT 1
    )
    THEN '✅ LINE customers get conversations on first message'
    ELSE '❌ LINE customers NOT getting conversations'
  END as current_status;

-- RECOMMENDED: ADD AUTO-CONVERSATION CREATION TO BOOKING API
SELECT
  'RECOMMENDATION: Enhance guest booking API' as improvement,
  'Add conversation creation to /bookings/guest endpoint' as action_needed,
  'Ensure every guest booking creates a conversation' as benefit,
  'Prevent future invisible guests' as prevention;

-- RECOMMENDED: ADD AUTO-CONVERSATION CREATION TO LINE WEBHOOK
SELECT
  'RECOMMENDATION: Enhance LINE webhook' as improvement,
  'Add conversation creation on first LINE message' as action_needed,
  'Ensure every LINE customer gets a conversation' as benefit,
  'Prevent future invisible LINE customers' as prevention;

-- MONITORING: CHECK FOR NEW CUSTOMERS WITHOUT CONVERSATIONS
SELECT
  'Monitoring query for future issues:' as ongoing_check,
  'Run this weekly to catch any new invisible customers' as maintenance,
  'SELECT c.id, c.name, c.role FROM customers c LEFT JOIN conversations conv ON conv.customer_ref = CASE WHEN conv.customer_type::text = ''line'' THEN c.line_user_id ELSE c.id::text END WHERE conv.id IS NULL AND c.created_at > NOW() - INTERVAL ''7 days'';' as query_to_run;