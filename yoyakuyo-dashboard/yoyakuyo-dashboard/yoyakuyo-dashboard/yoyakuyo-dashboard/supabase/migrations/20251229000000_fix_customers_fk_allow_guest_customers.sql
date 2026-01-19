-- Migration: Allow guest customers without auth.users accounts
-- Problem:
--   Some environments have a foreign key on public.customers(id) -> auth.users(id).
--   Guest bookings create customers rows with generated UUIDs that do NOT exist in auth.users,
--   causing: "insert or update on table customers violates foreign key constraint ..."
--
-- Fix (minimal):
--   Drop ONLY the FK constraint from customers -> auth.users if it exists.
--   This preserves customers as the canonical customer identity table, while still allowing
--   LINE/Web customers to use ids that match auth.users.

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop any FK constraints on public.customers that reference auth.users
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.customers'::regclass
      AND contype = 'f'
      AND confrelid = 'auth.users'::regclass
  ) LOOP
    EXECUTE format('ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS %I', r.conname);
    RAISE NOTICE 'Dropped FK constraint on customers -> auth.users: %', r.conname;
  END LOOP;
END $$;


