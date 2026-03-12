-- Permanently delete all unverified shops and their cascaded data.
-- Unverified = COALESCE(is_verified, false) = false.
-- Runs in batches to avoid long locks.

DO $$
DECLARE
  batch_size int := 5000;
  deleted_count int;
  total_deleted bigint := 0;
BEGIN
  LOOP
    WITH to_delete AS (
      SELECT id FROM shops
      WHERE COALESCE(is_verified, false) = false
      LIMIT batch_size
    )
    DELETE FROM shops WHERE id IN (SELECT id FROM to_delete);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    EXIT WHEN deleted_count = 0;
  END LOOP;

  RAISE NOTICE 'Deleted % unverified shop(s).', total_deleted;
END $$;
