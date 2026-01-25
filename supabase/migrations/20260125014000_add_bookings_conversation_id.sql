-- ============================================================================
-- ADD bookings.conversation_id (back-link to conversations)
-- ============================================================================
-- Needed so bookings and conversations can be linked both ways.
-- Safe to run multiple times (uses IF NOT EXISTS / guarded constraint creation).
-- ============================================================================

DO $$
BEGIN
  -- Add column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE bookings
    ADD COLUMN conversation_id uuid;
  END IF;

  -- Add FK constraint if missing (name is stable)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_conversation_id_fkey'
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT bookings_conversation_id_fkey
    FOREIGN KEY (conversation_id)
    REFERENCES conversations(id)
    ON DELETE SET NULL;
  END IF;

  -- Helpful index
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bookings_conversation_id ON bookings(conversation_id)';
END $$;

