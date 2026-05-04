-- Writing Task 1 image upload setup
-- Paste this into Supabase SQL Editor.

-- 1) Add image_url to writing_entries if it does not exist yet.
ALTER TABLE public.writing_entries
  ADD COLUMN IF NOT EXISTS image_url text;

-- 2) Create a dedicated storage bucket for Writing images.
INSERT INTO storage.buckets (id, name, public)
VALUES ('writing-images', 'writing-images', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- 3) Allow authenticated users to upload files into the bucket.
DROP POLICY IF EXISTS "Users upload writing images" ON storage.objects;
CREATE POLICY "Users upload writing images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'writing-images');

-- Optional: if you later want to keep the bucket private, switch the client
-- to signed URLs or user-scoped paths and add SELECT/DELETE policies too.