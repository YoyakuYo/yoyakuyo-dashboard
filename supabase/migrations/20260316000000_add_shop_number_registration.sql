-- Shop numbers 1–5000 for owner shops (customer search). verification_code (S0001) stays separate.
-- Does not touch customers.* (see add_customer_id_system.sql for customer_id_display / magic_code).

CREATE SEQUENCE IF NOT EXISTS shop_number_seq;

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS shop_number BIGINT;

COMMENT ON COLUMN shops.shop_number IS 'Unique number 1–5000 for owner shops; customers search by this.';

CREATE UNIQUE INDEX IF NOT EXISTS shops_shop_number_unique
ON shops(shop_number)
WHERE shop_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS shops_shop_number_lookup_idx
ON shops(shop_number)
WHERE shop_number IS NOT NULL AND (is_deleted IS NULL OR is_deleted = false);

CREATE OR REPLACE FUNCTION assign_shop_number_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.owner_user_id IS NOT NULL AND NEW.shop_number IS NULL THEN
    NEW.shop_number := nextval('shop_number_seq');
    IF NEW.shop_number > 5000 THEN
      RAISE EXCEPTION 'Shop number pool is full (max 5000).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_assign_shop_number_on_insert ON shops;
CREATE TRIGGER trigger_assign_shop_number_on_insert
  BEFORE INSERT ON shops
  FOR EACH ROW
  EXECUTE FUNCTION assign_shop_number_on_insert();

-- Backfill owner shops: S0001 before S0002, then created_at
DO $$
DECLARE
  r RECORD;
  n INT := 0;
BEGIN
  FOR r IN
    SELECT id
    FROM shops
    WHERE owner_user_id IS NOT NULL
      AND shop_number IS NULL
      AND (is_deleted IS NULL OR is_deleted = false)
    ORDER BY verification_code NULLS LAST, created_at NULLS LAST, id
  LOOP
    n := n + 1;
    IF n > 5000 THEN
      RAISE EXCEPTION 'More than 5000 owner shops; raise cap in migration.';
    END IF;
    UPDATE shops SET shop_number = n WHERE id = r.id;
  END LOOP;

  PERFORM setval(
    'shop_number_seq',
    GREATEST(0, COALESCE((SELECT MAX(shop_number) FROM shops WHERE shop_number IS NOT NULL), 0))
  );
END $$;

-- Legacy: if any shop_number > 5000 (e.g. old 100001 scale), renumber 1..N and fix sequence
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
