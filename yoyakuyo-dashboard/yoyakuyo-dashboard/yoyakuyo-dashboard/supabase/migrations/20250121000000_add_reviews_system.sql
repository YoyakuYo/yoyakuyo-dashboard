-- Migration: Add reviews and ratings system
-- Creates reviews table, indexes, RLS policies, and adds rating stats to shops table

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    photos TEXT[], -- Array of photo URLs
    is_verified BOOLEAN DEFAULT false, -- True if review is from completed booking
    owner_response TEXT,
    owner_response_at TIMESTAMPTZ,
    status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'hidden', 'flagged')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS reviews_shop_id_idx ON reviews(shop_id);
CREATE INDEX IF NOT EXISTS reviews_booking_id_idx ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS reviews_customer_id_idx ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON reviews(rating);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status);
CREATE INDEX IF NOT EXISTS reviews_shop_id_status_idx ON reviews(shop_id, status);
CREATE INDEX IF NOT EXISTS reviews_shop_id_rating_idx ON reviews(shop_id, rating);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can read published reviews
CREATE POLICY "Public can read published reviews"
    ON reviews
    FOR SELECT
    USING (status = 'published');

-- Owners can read all reviews for their shops
CREATE POLICY "Owners can read their shop reviews"
    ON reviews
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shops
            WHERE shops.id = reviews.shop_id
            AND shops.owner_user_id = auth.uid()
        )
    );

-- Customers can insert reviews (will be validated in API)
CREATE POLICY "Customers can create reviews"
    ON reviews
    FOR INSERT
    WITH CHECK (true);

-- Owners can update their responses
CREATE POLICY "Owners can respond to reviews"
    ON reviews
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM shops
            WHERE shops.id = reviews.shop_id
            AND shops.owner_user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM shops
            WHERE shops.id = reviews.shop_id
            AND shops.owner_user_id = auth.uid()
        )
    );

-- Add trigger function for updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- Add rating stats columns to shops table
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Create index on average_rating for sorting
CREATE INDEX IF NOT EXISTS shops_average_rating_idx ON shops(average_rating) WHERE average_rating IS NOT NULL;

-- Function to update shop rating stats (called from API)
CREATE OR REPLACE FUNCTION update_shop_rating_stats(shop_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE shops
    SET 
        average_rating = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM reviews
            WHERE shop_id = shop_uuid AND status = 'published'
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM reviews
            WHERE shop_id = shop_uuid AND status = 'published'
        )
    WHERE id = shop_uuid;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE reviews IS 'Customer reviews and ratings for shops';
COMMENT ON COLUMN reviews.is_verified IS 'True if review is from a completed booking';
COMMENT ON COLUMN reviews.status IS 'Review status: pending (awaiting moderation), published (visible), hidden (soft deleted), flagged (reported)';

