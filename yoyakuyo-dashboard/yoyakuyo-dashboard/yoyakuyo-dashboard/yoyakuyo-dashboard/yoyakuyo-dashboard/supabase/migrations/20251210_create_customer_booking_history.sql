-- ============================================================================
-- CREATE CUSTOMER BOOKING HISTORY VIEW
-- ============================================================================
-- View that shows all bookings for a customer with shop details
-- ============================================================================

-- Create view for customer booking history
CREATE OR REPLACE VIEW customer_booking_history AS
SELECT 
  b.id AS booking_id,
  b.customer_id,
  b.customer_profile_id,
  b.shop_id,
  b.date AS booking_date,
  b.time_slot AS booking_time,
  b.status AS booking_status,
  b.created_at AS booking_created_at,
  b.updated_at AS booking_updated_at,
  -- Shop details
  s.name AS shop_name,
  s.address AS shop_address,
  s.phone AS shop_phone,
  s.email AS shop_email,
  s.prefecture AS shop_prefecture,
  s.city AS shop_city,
  -- Customer details
  cp.full_name AS customer_name,
  cp.email AS customer_email,
  cp.phone AS customer_phone,
  -- Service details (if exists)
  sv.name AS service_name,
  sv.duration_minutes AS service_duration_minutes,
  sv.price AS service_price
FROM bookings b
LEFT JOIN shops s ON s.id = b.shop_id
LEFT JOIN customer_profiles cp ON cp.id = COALESCE(b.customer_profile_id, b.customer_id)
LEFT JOIN services sv ON sv.id = b.service_id
WHERE b.customer_id IS NOT NULL OR b.customer_profile_id IS NOT NULL;

-- Create index on bookings for faster customer queries
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_profile_id ON bookings(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date DESC);

-- Add comment
COMMENT ON VIEW customer_booking_history IS 'Complete booking history for customers with shop and service details';

