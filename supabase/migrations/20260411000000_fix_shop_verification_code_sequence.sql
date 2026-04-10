-- Fix duplicate verification_code (S0001) when shop_verification_code_seq lags behind
-- existing rows (imports, manual fixes, restores). Also prevents PATCH from setting
-- verification_code to another shop's code (handled in API; trigger is the source of truth).

CREATE OR REPLACE FUNCTION assign_shop_verification_code_and_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  max_used INTEGER;
  seq_last BIGINT;
BEGIN
  IF COALESCE(OLD.is_verified, FALSE) = FALSE
     AND COALESCE(NEW.is_verified, FALSE) = TRUE
     AND NEW.verification_code IS NULL THEN

    SELECT COALESCE(MAX((SUBSTRING(verification_code FROM 2 FOR 4))::INTEGER), 0)
    INTO max_used
    FROM shops
    WHERE verification_code ~ '^S[0-9]{4}$';

    SELECT last_value INTO seq_last FROM shop_verification_code_seq;

    PERFORM setval(
      'shop_verification_code_seq',
      GREATEST(max_used, seq_last)
    );

    new_code := 'S' || LPAD(nextval('shop_verification_code_seq')::TEXT, 4, '0');

    WHILE EXISTS (SELECT 1 FROM shops WHERE verification_code = new_code) LOOP
      new_code := 'S' || LPAD(nextval('shop_verification_code_seq')::TEXT, 4, '0');
    END LOOP;

    UPDATE shops
    SET verification_code = new_code
    WHERE id = NEW.id;

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
