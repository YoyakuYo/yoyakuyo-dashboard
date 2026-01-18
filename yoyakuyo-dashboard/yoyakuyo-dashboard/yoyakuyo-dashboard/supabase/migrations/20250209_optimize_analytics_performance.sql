-- ============================================================================
-- OPTIMIZE ANALYTICS PERFORMANCE
-- ============================================================================
-- This migration adds indexes to improve analytics query performance
-- and prevents statement timeouts
-- ============================================================================

-- ============================================================================
-- STEP 1: Add indexes for analytics queries
-- ============================================================================

-- Indexes for bookings table (analytics queries)
CREATE INDEX IF NOT EXISTS idx_bookings_shop_id_status ON bookings(shop_id, status) WHERE shop_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_shop_id_created_at ON bookings(shop_id, created_at) WHERE shop_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id_created_at ON bookings(customer_id, created_at) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_shop_id_status_created_at ON bookings(shop_id, status, created_at) WHERE shop_id IS NOT NULL;

-- Indexes for payments table (revenue queries)
CREATE INDEX IF NOT EXISTS idx_payments_booking_id_status ON payments(booking_id, status) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status_created_at ON payments(status, created_at) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_payments_booking_id_status_created_at ON payments(booking_id, status, created_at) WHERE status = 'completed';

-- Indexes for shops table
CREATE INDEX IF NOT EXISTS idx_shops_owner_user_id ON shops(owner_user_id) WHERE owner_user_id IS NOT NULL;

-- Indexes for reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_shop_id_status ON reviews(shop_id, status) WHERE shop_id IS NOT NULL AND status = 'published';

-- ============================================================================
-- STEP 2: Drop slow views and replace with simpler materialized views or functions
-- ============================================================================

-- Drop the complex views that cause timeouts
DROP VIEW IF EXISTS shop_revenue_analytics CASCADE;
DROP VIEW IF EXISTS booking_analytics_by_date CASCADE;
DROP VIEW IF EXISTS customer_analytics CASCADE;
DROP VIEW IF EXISTS shop_performance_metrics CASCADE;

-- ============================================================================
-- STEP 3: Create optimized functions instead of views
-- ============================================================================

-- Function to get shop revenue analytics (optimized)
CREATE OR REPLACE FUNCTION get_shop_revenue_analytics(p_shop_id UUID)
RETURNS TABLE (
  shop_id UUID,
  shop_name TEXT,
  owner_user_id UUID,
  total_bookings BIGINT,
  completed_bookings BIGINT,
  confirmed_bookings BIGINT,
  pending_bookings BIGINT,
  cancelled_bookings BIGINT,
  total_revenue NUMERIC,
  revenue_last_30_days NUMERIC,
  revenue_last_7_days NUMERIC,
  average_booking_value NUMERIC,
  unique_customers BIGINT,
  new_customers_30_days BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.owner_user_id,
    COUNT(DISTINCT b.id)::BIGINT as total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END)::BIGINT as completed_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END)::BIGINT as confirmed_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END)::BIGINT as pending_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END)::BIGINT as cancelled_bookings,
    COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0)::NUMERIC as total_revenue,
    COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '30 days' THEN p.amount ELSE 0 END), 0)::NUMERIC as revenue_last_30_days,
    COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '7 days' THEN p.amount ELSE 0 END), 0)::NUMERIC as revenue_last_7_days,
    COALESCE(AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END), 0)::NUMERIC as average_booking_value,
    COUNT(DISTINCT b.customer_id)::BIGINT as unique_customers,
    COUNT(DISTINCT CASE WHEN b.created_at >= NOW() - INTERVAL '30 days' THEN b.customer_id END)::BIGINT as new_customers_30_days
  FROM shops s
  LEFT JOIN bookings b ON b.shop_id = s.id
  LEFT JOIN payments p ON p.booking_id = b.id
  WHERE s.id = p_shop_id
  GROUP BY s.id, s.name, s.owner_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get booking analytics by date (optimized)
CREATE OR REPLACE FUNCTION get_booking_analytics_by_date(p_shop_id UUID, p_start_date DATE)
RETURNS TABLE (
  booking_date DATE,
  shop_id UUID,
  owner_user_id UUID,
  bookings_count BIGINT,
  completed_count BIGINT,
  confirmed_count BIGINT,
  pending_count BIGINT,
  cancelled_count BIGINT,
  revenue NUMERIC,
  unique_customers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(b.created_at) as booking_date,
    s.id as shop_id,
    s.owner_user_id,
    COUNT(*)::BIGINT as bookings_count,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::BIGINT as completed_count,
    COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END)::BIGINT as confirmed_count,
    COUNT(CASE WHEN b.status = 'pending' THEN 1 END)::BIGINT as pending_count,
    COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END)::BIGINT as cancelled_count,
    COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0)::NUMERIC as revenue,
    COUNT(DISTINCT b.customer_id)::BIGINT as unique_customers
  FROM bookings b
  JOIN shops s ON s.id = b.shop_id
  LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'completed'
  WHERE s.id = p_shop_id
    AND DATE(b.created_at) >= p_start_date
  GROUP BY DATE(b.created_at), s.id, s.owner_user_id
  ORDER BY booking_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get shop performance metrics (optimized)
CREATE OR REPLACE FUNCTION get_shop_performance_metrics(p_shop_id UUID)
RETURNS TABLE (
  shop_id UUID,
  shop_name TEXT,
  owner_user_id UUID,
  total_bookings BIGINT,
  completed_bookings BIGINT,
  cancelled_bookings BIGINT,
  completion_rate NUMERIC,
  cancellation_rate NUMERIC,
  total_revenue NUMERIC,
  average_booking_value NUMERIC,
  unique_customers BIGINT,
  new_customers_30_days BIGINT,
  total_reviews BIGINT,
  average_rating NUMERIC,
  bookings_last_7_days BIGINT,
  bookings_last_30_days BIGINT,
  revenue_last_7_days NUMERIC,
  revenue_last_30_days NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.owner_user_id,
    COUNT(DISTINCT b.id)::BIGINT as total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END)::BIGINT as completed_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END)::BIGINT as cancelled_bookings,
    CASE 
      WHEN COUNT(DISTINCT b.id) > 0 
      THEN ROUND(100.0 * COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END)::NUMERIC / COUNT(DISTINCT b.id)::NUMERIC, 2)
      ELSE 0 
    END::NUMERIC as completion_rate,
    CASE 
      WHEN COUNT(DISTINCT b.id) > 0 
      THEN ROUND(100.0 * COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END)::NUMERIC / COUNT(DISTINCT b.id)::NUMERIC, 2)
      ELSE 0 
    END::NUMERIC as cancellation_rate,
    COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0)::NUMERIC as total_revenue,
    COALESCE(AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END), 0)::NUMERIC as average_booking_value,
    COUNT(DISTINCT b.customer_id)::BIGINT as unique_customers,
    COUNT(DISTINCT CASE WHEN b.created_at >= NOW() - INTERVAL '30 days' THEN b.customer_id END)::BIGINT as new_customers_30_days,
    COUNT(DISTINCT r.id)::BIGINT as total_reviews,
    COALESCE(AVG(r.rating), 0)::NUMERIC as average_rating,
    COUNT(DISTINCT CASE WHEN b.created_at >= NOW() - INTERVAL '7 days' THEN b.id END)::BIGINT as bookings_last_7_days,
    COUNT(DISTINCT CASE WHEN b.created_at >= NOW() - INTERVAL '30 days' THEN b.id END)::BIGINT as bookings_last_30_days,
    COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '7 days' THEN p.amount ELSE 0 END), 0)::NUMERIC as revenue_last_7_days,
    COALESCE(SUM(CASE WHEN p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '30 days' THEN p.amount ELSE 0 END), 0)::NUMERIC as revenue_last_30_days
  FROM shops s
  LEFT JOIN bookings b ON b.shop_id = s.id
  LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'completed'
  LEFT JOIN reviews r ON r.shop_id = s.id AND r.status = 'published'
  WHERE s.id = p_shop_id
  GROUP BY s.id, s.name, s.owner_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 4: Add comments
-- ============================================================================
COMMENT ON FUNCTION get_shop_revenue_analytics(UUID) IS 'Get revenue analytics for a specific shop (optimized)';
COMMENT ON FUNCTION get_booking_analytics_by_date(UUID, DATE) IS 'Get daily booking analytics for a shop from a start date (optimized)';
COMMENT ON FUNCTION get_shop_performance_metrics(UUID) IS 'Get comprehensive performance metrics for a specific shop (optimized)';

