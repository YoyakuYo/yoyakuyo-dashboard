-- Migration: Enable RLS and create policies for shops table
-- Run this migration to allow authenticated users to read shops

-- Enable Row Level Security on shops table
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read shops (SELECT)
-- This allows both authenticated and unauthenticated users to view shops
CREATE POLICY "Allow public read access to shops"
ON shops
FOR SELECT
USING (true);

-- Policy: Allow authenticated users to insert shops
CREATE POLICY "Allow authenticated users to insert shops"
ON shops
FOR INSERT
WITH CHECK (true);

-- Policy: Allow users to update shops they own
CREATE POLICY "Allow users to update own shops"
ON shops
FOR UPDATE
USING (auth.uid() = owner_user_id OR owner_user_id IS NULL);

-- Policy: Allow users to delete shops they own
CREATE POLICY "Allow users to delete own shops"
ON shops
FOR DELETE
USING (auth.uid() = owner_user_id);

-- Note: If you're using x-user-id header instead of auth.uid(), 
-- you may need to adjust these policies or use service role key
-- for the API which bypasses RLS

