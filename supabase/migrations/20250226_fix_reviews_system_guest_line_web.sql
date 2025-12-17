-- ============================================
-- FIX REVIEWS SYSTEM FOR GUEST + LINE + WEB
-- ============================================
-- This migration fixes the reviews system to support:
-- 1. Guest reviews (no authentication)
-- 2. LINE user reviews (via LIFF)
-- 3. Web user reviews (authenticated)
-- ============================================

-- PART 2: Ensure unified reviews table with author_type fields
-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add author_type enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_author_type_enum') THEN
    CREATE TYPE review_author_type_enum AS ENUM ('guest', 'user', 'line');
  END IF;

  -- Add author_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'author_type'
  ) THEN
    ALTER TABLE reviews ADD COLUMN author_type review_author_type_enum;
  END IF;

  -- Add user_id column (for web users - maps to customer_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN user_id UUID REFERENCES customers(id) ON DELETE SET NULL;
  END IF;

  -- Add line_user_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'line_user_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN line_user_id TEXT;
  END IF;

  -- Add guest_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'guest_name'
  ) THEN
    ALTER TABLE reviews ADD COLUMN guest_name TEXT;
  END IF;

  -- Rename comment to content for consistency (if needed)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'comment'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'content'
  ) THEN
    ALTER TABLE reviews RENAME COLUMN comment TO content;
  END IF;

  -- Ensure content is NOT NULL (if comment was nullable)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'content'
  ) THEN
    -- Make content NOT NULL if it's currently nullable
    ALTER TABLE reviews ALTER COLUMN content SET NOT NULL;
  END IF;

  -- Create indexes for new columns
  CREATE INDEX IF NOT EXISTS reviews_author_type_idx ON reviews(author_type);
  CREATE INDEX IF NOT EXISTS reviews_line_user_id_idx ON reviews(line_user_id) WHERE line_user_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS reviews_guest_name_idx ON reviews(guest_name) WHERE guest_name IS NOT NULL;
END $$;

-- PART 3: FIX RLS POLICIES (CRITICAL)
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public can read published reviews" ON reviews;
DROP POLICY IF EXISTS "Owners can read their shop reviews" ON reviews;
DROP POLICY IF EXISTS "Customers can create reviews" ON reviews;
DROP POLICY IF EXISTS "Owners can respond to reviews" ON reviews;

-- PART 3.1: INSERT policy - allow anon + authenticated
CREATE POLICY "Anyone can create reviews"
  ON reviews
  FOR INSERT
  TO public
  WITH CHECK (shop_id IS NOT NULL);

-- PART 3.2: SELECT policy - allow anon + authenticated, only published
CREATE POLICY "Anyone can read published reviews"
  ON reviews
  FOR SELECT
  TO public
  USING (status = 'published');

-- Allow owners to read all reviews for their shops (including hidden)
CREATE POLICY "Owners can read all their shop reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = reviews.shop_id
      AND shops.owner_user_id = auth.uid()
    )
  );

-- Allow owners to update their responses
CREATE POLICY "Owners can respond to reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
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

-- Add constraint to ensure proper author_type usage
-- Note: We use customer_id (existing) for user reviews, user_id is optional for future use
-- Only check user_id if the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'user_id'
  ) THEN
    -- Constraint with user_id
    ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_author_type_constraint;
    ALTER TABLE reviews ADD CONSTRAINT reviews_author_type_constraint CHECK (
      (author_type = 'guest' AND guest_name IS NOT NULL AND customer_id IS NULL AND user_id IS NULL AND line_user_id IS NULL) OR
      (author_type = 'user' AND (customer_id IS NOT NULL OR user_id IS NOT NULL) AND line_user_id IS NULL AND guest_name IS NULL) OR
      (author_type = 'line' AND line_user_id IS NOT NULL AND customer_id IS NULL AND user_id IS NULL AND guest_name IS NULL) OR
      (author_type IS NULL) -- Allow NULL for backward compatibility during migration
    );
  ELSE
    -- Constraint without user_id (fallback)
    ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_author_type_constraint;
    ALTER TABLE reviews ADD CONSTRAINT reviews_author_type_constraint CHECK (
      (author_type = 'guest' AND guest_name IS NOT NULL AND customer_id IS NULL AND line_user_id IS NULL) OR
      (author_type = 'user' AND customer_id IS NOT NULL AND line_user_id IS NULL AND guest_name IS NULL) OR
      (author_type = 'line' AND line_user_id IS NOT NULL AND customer_id IS NULL AND guest_name IS NULL) OR
      (author_type IS NULL) -- Allow NULL for backward compatibility during migration
    );
  END IF;
END $$;

-- Update existing reviews to classify by author_type
-- This is a best-effort classification based on existing data
-- Also backfill user_id from customer_id for existing reviews
UPDATE reviews
SET 
  author_type = CASE
    WHEN customer_id IS NOT NULL THEN 'user'::review_author_type_enum
    WHEN booking_id IS NOT NULL THEN 'user'::review_author_type_enum
    ELSE 'guest'::review_author_type_enum
  END,
  user_id = customer_id -- Backfill user_id from customer_id for existing reviews
WHERE author_type IS NULL;

-- Set guest_name for guest reviews if we can infer it
-- (This is a placeholder - real guest_name should come from form input)
UPDATE reviews
SET guest_name = 'Guest'
WHERE author_type = 'guest' AND guest_name IS NULL;

COMMENT ON COLUMN reviews.author_type IS 'Type of review author: guest (no auth), user (web auth), line (LINE LIFF)';
COMMENT ON COLUMN reviews.line_user_id IS 'LINE user ID for LINE-authored reviews';
COMMENT ON COLUMN reviews.guest_name IS 'Guest name for guest-authored reviews';
COMMENT ON COLUMN reviews.content IS 'Review content/comment (renamed from comment)';

