-- Update existing bookings to use actual customer names
-- This script identifies bookings with generic names and shows what they should be

-- First, let's see what we're working with
WITH booking_analysis AS (
  SELECT 
    b.id as booking_id,
    b.customer_id,
    b.source,
    c.role as customer_role,
    c.email as customer_email,
    c.name as customer_name_in_table,
    c.auth_user_id,
    c.line_user_id,
    -- Get LINE customer name
    CASE 
      WHEN c.role = 'line' AND c.line_user_id IS NOT NULL THEN
        (SELECT line_display_name FROM customer_profiles WHERE line_user_id = c.line_user_id LIMIT 1)
      ELSE NULL
    END as line_display_name,
    -- Get WEB customer name
    CASE 
      WHEN c.role = 'web' AND c.auth_user_id IS NOT NULL THEN
        (SELECT full_name FROM users WHERE id = c.auth_user_id LIMIT 1)
      ELSE NULL
    END as user_full_name,
    -- Get WEB customer email
    CASE 
      WHEN c.role = 'web' AND c.auth_user_id IS NOT NULL THEN
        (SELECT email FROM users WHERE id = c.auth_user_id LIMIT 1)
      ELSE NULL
    END as user_email
  FROM bookings b
  LEFT JOIN customers c ON b.customer_id = c.id
  WHERE b.customer_id IS NOT NULL
),
name_corrections AS (
  SELECT 
    booking_id,
    customer_id,
    source,
    customer_role,
    customer_email,
    customer_name_in_table,
    -- Calculate what the name SHOULD be
    COALESCE(
      line_display_name,
      user_full_name,
      customer_name_in_table,
      CASE 
        WHEN customer_role = 'line' THEN 'LINE Customer'
        WHEN customer_role = 'web' THEN COALESCE(user_email, customer_email, 'Web Customer')
        WHEN customer_role = 'guest' THEN COALESCE(customer_name_in_table, customer_email, 'Guest')
        ELSE 'Unknown Customer'
      END
    ) as correct_customer_name,
    -- Current vs correct comparison
    CASE 
      WHEN customer_role = 'line' AND line_display_name IS NOT NULL THEN '✅ Has LINE name'
      WHEN customer_role = 'line' AND line_display_name IS NULL THEN '❌ Missing LINE name'
      WHEN customer_role = 'web' AND user_full_name IS NOT NULL THEN '✅ Has WEB name'
      WHEN customer_role = 'web' AND user_full_name IS NULL THEN '⚠️ Missing WEB name (using email)'
      WHEN customer_role = 'guest' AND customer_name_in_table IS NOT NULL THEN '✅ Has GUEST name'
      WHEN customer_role = 'guest' AND customer_name_in_table IS NULL THEN '⚠️ Missing GUEST name (using email)'
      ELSE '❓ Unknown'
    END as status
  FROM booking_analysis
)
SELECT 
  booking_id,
  source,
  customer_role,
  customer_email,
  customer_name_in_table as current_name_in_db,
  correct_customer_name as should_display_as,
  status,
  CASE 
    WHEN customer_name_in_table IS NULL AND correct_customer_name NOT LIKE '%Customer%' AND correct_customer_name NOT LIKE '%Guest%' THEN '⚠️ Name missing in customers.name'
    WHEN customer_name_in_table IS NOT NULL AND customer_name_in_table = correct_customer_name THEN '✅ Name correct'
    WHEN customer_name_in_table IS NOT NULL AND customer_name_in_table != correct_customer_name THEN '⚠️ Name mismatch'
    ELSE '✅ OK'
  END as recommendation
FROM name_corrections
ORDER BY 
  CASE WHEN status LIKE '❌%' THEN 1 WHEN status LIKE '⚠️%' THEN 2 ELSE 3 END,
  booking_id DESC;

-- NOTE: The bookings table doesn't store customer_name (it's fetched dynamically)
-- So we need to ensure customers.name is populated for guest customers
-- For LINE and WEB, names come from customer_profiles and users tables respectively

