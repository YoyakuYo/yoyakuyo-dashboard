-- ============================================
-- PLATFORM REVIEWS TABLE
-- ============================================
-- For reviews about the Yoyaku Yo platform itself
-- (not shop-specific reviews)
-- ============================================

CREATE TABLE IF NOT EXISTS platform_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    platform TEXT NOT NULL DEFAULT 'yoyakuyo',
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_email TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'pending', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_reviews_rating_idx ON platform_reviews(rating);
CREATE INDEX IF NOT EXISTS platform_reviews_status_idx ON platform_reviews(status);
CREATE INDEX IF NOT EXISTS platform_reviews_created_at_idx ON platform_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS platform_reviews_platform_idx ON platform_reviews(platform);

-- Enable RLS
ALTER TABLE platform_reviews ENABLE ROW LEVEL SECURITY;

-- Service role can manage all platform reviews
DROP POLICY IF EXISTS "Service role can manage platform_reviews" ON platform_reviews;
CREATE POLICY "Service role can manage platform_reviews"
ON platform_reviews
FOR ALL
USING (true)
WITH CHECK (true);

-- Public can read published reviews
DROP POLICY IF EXISTS "Public can read published platform reviews" ON platform_reviews;
CREATE POLICY "Public can read published platform reviews"
ON platform_reviews
FOR SELECT
USING (status = 'published');

-- Public can create reviews (no auth required)
DROP POLICY IF EXISTS "Public can create platform reviews" ON platform_reviews;
CREATE POLICY "Public can create platform reviews"
ON platform_reviews
FOR INSERT
WITH CHECK (true);

COMMENT ON TABLE platform_reviews IS 'Reviews about the Yoyaku Yo platform itself (not shop-specific)';
COMMENT ON COLUMN platform_reviews.platform IS 'Platform identifier (default: yoyakuyo)';
COMMENT ON COLUMN platform_reviews.status IS 'Review status: published, pending, or rejected';

