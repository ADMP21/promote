-- ============================================================
-- AOT Digital Signage - Storage Bucket Setup
-- Run this in Supabase SQL Editor after schema.sql
-- ============================================================

-- Create storage bucket for signage images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signage-images',
  'signage-images',
  true,
  10485760,  -- 10MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- Public read access (for TV display)
CREATE POLICY "Public can view signage images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'signage-images');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload signage images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'signage-images');

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update signage images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'signage-images');

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete signage images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'signage-images');
