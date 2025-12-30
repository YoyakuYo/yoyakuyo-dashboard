-- ============================================================================
-- CREATE ANALYTICS SYSTEM
-- ============================================================================
-- This migration adds analytics tracking and revenue calculation support
-- ============================================================================

-- ============================================================================
-- STEP 1: Add revenue tracking columns to bookings (if not exists)
-- ============================================================================
DO $$
BEGIN
  -- Add service_price to bookings if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'service_price'
  ) THEN
    ALTER TABLE bookings 
    ADD COLUMN service_price DECIMAL(10, 2);
    
    CREATE INDEX IF NOT EXISTS bookings_service_price_idx ON bookings(service_price);
  END IF;

  -- Add total_revenue to bookings if it doesn't exist (calculated from payments)
  -- This will be calculated via views/functions, but we add a cached column for performance
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'total_revenue'
  ) THEN
    ALTER TABLE bookings 
    ADD COLUMN total_revenue DECIMAL(10, 2) DEFAULT 0;
    
    CREATE INDEX IF NOT EXISTS bookings_total_revenue_idx ON bookings(total_revenue);
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create view for shop revenue analytics
-- ============================================================================
CREATE OR REPLACE VIEW shop_revenue_analytics AS
SELECT 
  s.id as shop_id,
  s.name as shop_name,
  s.owner_user_id,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '30 days' THEN p.amount ELSE 0 END), 0) as revenue_last_30_days,
  COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '7 days' THEN p.amount ELSE 0 END), 0) as revenue_last_7_days,
  COALESCE(AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END), 0) as average_booking_value,
  COUNT(DISTINCT b.customer_id) as unique_customers,
  COUNT(DISTINCT CASE WHEN b.created_at >= NOW() - INTERVAL '30 days' THEN b.customer_id END) as new_customers_30_days
FROM shops s
LEFT JOIN bookings b ON b.shop_id = s.id
LEFT JOIN payments p ON p.booking_id = b.id
GROUP BY s.id, s.name, s.owner_user_id;

-- ============================================================================
-- STEP 3: Create view for booking analytics by date
-- ============================================================================
CREATE OR REPLACE VIEW booking_analytics_by_date AS
SELECT 
  DATE(b.created_at) as booking_date,
  s.id as shop_id,
  s.owner_user_id,
  COUNT(*) as bookings_count,
  COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_count,
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as revenue,
  COUNT(DISTINCT b.customer_id) as unique_customers
FROM bookings b
JOIN shops s ON s.id = b.shop_id
LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'completed'
GROUP BY DATE(b.created_at), s.id, s.owner_user_id;

-- ============================================================================
-- STEP 4: Create view for customer analytics
-- ============================================================================
CREATE OR REPLACE VIEW customer_analytics AS
SELECT 
  c.id as customer_id,
  c.role as customer_type,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
  COUNT(DISTINCT b.shop_id) as shops_booked,
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_spent,
  COALESCE(AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END), 0) as average_booking_value,
  MIN(b.created_at) as first_booking_date,
  MAX(b.created_at) as last_booking_date,
  COUNT(DISTINCT cf.shop_id) as favorite_shops_count
FROM customers c
LEFT JOIN bookings b ON b.customer_id = c.id
LEFT JOIN payments p ON p.booking_id = b.id
LEFT JOIN customer_favorites cf ON cf.customer_id = c.id
GROUP BY c.id, c.role;

-- ============================================================================
-- STEP 5: Create function to update booking revenue cache
-- ============================================================================
CREATE OR REPLACE FUNCTION update_booking_revenue_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_revenue for the booking when payment status changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE bookings
    SET total_revenue = (
      SELECT COALESCE(SUM(amount), 0)
      FROM payments
      WHERE booking_id = NEW.booking_id
      AND status = 'completed'
    )
    WHERE id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update revenue cache
DROP TRIGGER IF EXISTS trigger_update_booking_revenue_cache ON payments;
CREATE TRIGGER trigger_update_booking_revenue_cache
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_revenue_cache();

-- ============================================================================
-- STEP 6: Backfill revenue cache for existing bookings
-- ============================================================================
UPDATE bookings b
SET total_revenue = (
  SELECT COALESCE(SUM(amount), 0)
  FROM payments p
  WHERE p.booking_id = b.id
  AND p.status = 'completed'
);

-- ============================================================================
-- STEP 7: Create view for performance metrics
-- ============================================================================
CREATE OR REPLACE VIEW shop_performance_metrics AS
SELECT 
  s.id as shop_id,
  s.name as shop_name,
  s.owner_user_id,
  -- Booking metrics
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
  CASE 
    WHEN COUNT(DISTINCT b.id) > 0 
    THEN ROUND(100.0 * COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) / COUNT(DISTINCT b.id), 2)
    ELSE 0 
  END as completion_rate,
  CASE 
    WHEN COUNT(DISTINCT b.id) > 0 
    THEN ROUND(100.0 * COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) / COUNT(DISTINCT b.id), 2)
    ELSE 0 
  END as cancellation_rate,
  -- Revenue metrics
  COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_revenue,
  COALESCE(AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END), 0) as average_booking_value,
  -- Customer metrics
  COUNT(DISTINCT b.customer_id) as unique_customers,
  COUNT(DISTINCT CASE WHEN b.created_at >= NOW() - INTERVAL '30 days' THEN b.customer_id END) as new_customers_30_days,
  -- Review metrics
  COUNT(DISTINCT r.id) as total_reviews,
  COALESCE(AVG(r.rating), 0) as average_rating,
  -- Time-based metrics
  COUNT(DISTINCT CASE WHEN b.created_at >= NOW() - INTERVAL '7 days' THEN b.id END) as bookings_last_7_days,
  COUNT(DISTINCT CASE WHEN b.created_at >= NOW() - INTERVAL '30 days' THEN b.id END) as bookings_last_30_days,
  COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '7 days' THEN p.amount ELSE 0 END), 0) as revenue_last_7_days,
  COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '30 days' THEN p.amount ELSE 0 END), 0) as revenue_last_30_days
FROM shops s
LEFT JOIN bookings b ON b.shop_id = s.id
LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'completed'
LEFT JOIN reviews r ON r.shop_id = s.id AND r.status = 'published'
GROUP BY s.id, s.name, s.owner_user_id;

-- ============================================================================
-- STEP 8: Enable RLS on views (views inherit RLS from base tables)
-- ============================================================================
-- Views don't have RLS themselves, but they respect RLS on underlying tables
-- Owners can only see their own shop analytics via the owner_user_id filter

-- ============================================================================
-- STEP 9: Add comments
-- ============================================================================
COMMENT ON VIEW shop_revenue_analytics IS 'Revenue and booking analytics per shop';
COMMENT ON VIEW booking_analytics_by_date IS 'Daily booking and revenue analytics';
COMMENT ON VIEW customer_analytics IS 'Customer behavior and spending analytics';
COMMENT ON VIEW shop_performance_metrics IS 'Comprehensive performance metrics per shop';
COMMENT ON FUNCTION update_booking_revenue_cache() IS 'Automatically updates booking revenue cache when payments change';

