-- ============================================================================
-- Add verification_code to shops and auto-assign + notify on verification
-- ============================================================================

-- 1) Add verification_code column and unique index
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS verification_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS shops_verification_code_unique
ON shops(verification_code)
WHERE verification_code IS NOT NULL;

COMMENT ON COLUMN shops.verification_code IS 'Short code (e.g. S0001) assigned when a shop is verified. Used for quick lookup from landing page.';

-- 2) Sequence for generating sequential codes
CREATE SEQUENCE IF NOT EXISTS shop_verification_code_seq;

-- 3) Backfill codes for already-verified shops (if any)
DO $$
DECLARE
  r RECORD;
  next_code TEXT;
BEGIN
  FOR r IN
    SELECT id
    FROM shops
    WHERE COALESCE(is_verified, false) = TRUE
      AND verification_code IS NULL
    ORDER BY verified_at NULLS LAST, created_at NULLS LAST, id
  LOOP
    next_code := 'S' || LPAD(nextval('shop_verification_code_seq')::TEXT, 4, '0');

    UPDATE shops
    SET verification_code = next_code
    WHERE id = r.id;
  END LOOP;
END $$;

-- 4) Trigger function: assign code + create owner notification when shop becomes verified
CREATE OR REPLACE FUNCTION assign_shop_verification_code_and_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Only act when is_verified flips from false->true and no code yet
  IF COALESCE(OLD.is_verified, FALSE) = FALSE
     AND COALESCE(NEW.is_verified, FALSE) = TRUE
     AND NEW.verification_code IS NULL THEN

    -- Generate next code from sequence
    new_code := 'S' || LPAD(nextval('shop_verification_code_seq')::TEXT, 4, '0');

    -- Persist code on the shop
    UPDATE shops
    SET verification_code = new_code
    WHERE id = NEW.id;

    -- Notify the owner via notifications system (owner recipient type)
    -- Existing infra can turn this into email + in-app notification.
    IF NEW.owner_user_id IS NOT NULL THEN
      INSERT INTO notifications (
        recipient_type,
        recipient_id,
        type,
        title,
        body,
        data
      )
      VALUES (
        'owner',
        NEW.owner_user_id,
        'shop_verified',
        'Your shop has been verified',
        'Your shop \"' || NEW.name || '\" has been verified. Your verification code is ' || new_code || '.',
        jsonb_build_object(
          'shop_id', NEW.id,
          'verification_code', new_code
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5) Trigger on shops
DROP TRIGGER IF EXISTS trigger_assign_shop_verification_code_and_notify ON shops;
CREATE TRIGGER trigger_assign_shop_verification_code_and_notify
  AFTER UPDATE OF is_verified, verification_status ON shops
  FOR EACH ROW
  EXECUTE FUNCTION assign_shop_verification_code_and_notify();

