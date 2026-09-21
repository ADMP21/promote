ALTER TABLE public.display_settings
  ADD COLUMN IF NOT EXISTS overlay_opacity NUMERIC(3,2) NOT NULL DEFAULT 0.70;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'display_settings_overlay_opacity_check'
      AND conrelid = 'public.display_settings'::regclass
  ) THEN
    ALTER TABLE public.display_settings
      ADD CONSTRAINT display_settings_overlay_opacity_check
      CHECK (overlay_opacity IN (0.50, 0.70, 0.85));
  END IF;
END $$;
