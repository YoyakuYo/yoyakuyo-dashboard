-- Add admin response fields to platform_reviews table
-- This allows admins to respond to platform reviews, similar to shop reviews

ALTER TABLE platform_reviews
ADD COLUMN IF NOT EXISTS admin_response TEXT,
ADD COLUMN IF NOT EXISTS admin_response_at TIMESTAMP WITH TIME ZONE;

-- Add comment for the new columns
COMMENT ON COLUMN platform_reviews.admin_response IS 'Admin response to the platform review';
COMMENT ON COLUMN platform_reviews.admin_response_at IS 'Timestamp when admin responded';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS platform_reviews_admin_response_at_idx ON platform_reviews(admin_response_at) WHERE admin_response_at IS NOT NULL;