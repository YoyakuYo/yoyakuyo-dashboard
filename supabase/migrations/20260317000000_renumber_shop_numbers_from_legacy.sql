-- Run after 20260316000000 if shop_number was already 100001+ (old sequence scale).
-- Resets to 1, 2, … in verification_code order; adds CHECK (1–5000).

DO $$
DECLARE
  r RECORD;
  n INT := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM shops WHERE shop_number > 5000 LIMIT 1) THEN
    RETURN;
  END IF;

  UPDATE shops SET shop_number = NULL WHERE owner_user_id IS NOT NULL;

  FOR r IN
    SELECT id
    FROM shops
    WHERE owner_user_id IS NOT NULL
      AND (is_deleted IS NULL OR is_deleted = false)
    ORDER BY verification_code NULLS LAST, created_at NULLS LAST, id
  LOOP
    n := n + 1;
    IF n > 5000 THEN
      RAISE EXCEPTION 'More than 5000 owner shops.';
    END IF;
    UPDATE shops SET shop_number = n WHERE id = r.id;
  END LOOP;

  PERFORM setval(
    'shop_number_seq',
    GREATEST(0, COALESCE((SELECT MAX(shop_number) FROM shops WHERE shop_number IS NOT NULL), 0))
  );
END $$;

ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_shop_number_max_5000;
ALTER TABLE shops ADD CONSTRAINT shops_shop_number_max_5000
  CHECK (shop_number IS NULL OR (shop_number BETWEEN 1 AND 5000));
