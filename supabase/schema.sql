-- ============================================================
-- AOT Digital Signage - Complete Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL > New Query)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- IMAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT '',
  filename TEXT NOT NULL,
  image_url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for display ordering
CREATE INDEX IF NOT EXISTS idx_images_display_order ON public.images (display_order);
CREATE INDEX IF NOT EXISTS idx_images_active ON public.images (active);

-- ============================================================
-- DISPLAY SETTINGS TABLE (Singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.display_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slide_interval INTEGER NOT NULL DEFAULT 10 CHECK (slide_interval >= 3 AND slide_interval <= 60),
  transition_effect TEXT NOT NULL DEFAULT 'fade' CHECK (transition_effect IN ('fade', 'slide-left', 'slide-right', 'zoom')),
  auto_refresh BOOLEAN NOT NULL DEFAULT true,
  fullscreen_mode BOOLEAN NOT NULL DEFAULT true,
  show_header_overlay BOOLEAN NOT NULL DEFAULT true,
  show_footer_ticker BOOLEAN NOT NULL DEFAULT true,
  ticker_text TEXT NOT NULL DEFAULT 'Welcome to AOT Digital Signage System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings row (only if none exists)
INSERT INTO public.display_settings (slide_interval, transition_effect, ticker_text)
SELECT 10, 'fade', 'Welcome to AOT Digital Signage System'
WHERE NOT EXISTS (SELECT 1 FROM public.display_settings LIMIT 1);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.display_settings ENABLE ROW LEVEL SECURITY;

-- Images: Public read (for TV display), authenticated write
CREATE POLICY "Anyone can view images"
  ON public.images FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert images"
  ON public.images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update images"
  ON public.images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete images"
  ON public.images FOR DELETE
  TO authenticated
  USING (true);

-- Display settings: Public read (for TV display), authenticated write
CREATE POLICY "Anyone can view display settings"
  ON public.display_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert display settings"
  ON public.display_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update display settings"
  ON public.display_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- REALTIME
-- Enable realtime for live TV updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.images;
ALTER PUBLICATION supabase_realtime ADD TABLE public.display_settings;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER display_settings_updated_at
  BEFORE UPDATE ON public.display_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
