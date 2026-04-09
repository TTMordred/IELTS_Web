-- ═══════════════════════════════════════════════════════════
-- IELTS Self-Study Hub — Schema 2.2
-- AI Settings + App Config
-- Run AFTER schema-2.1.sql
-- ═══════════════════════════════════════════════════════════

-- App-wide settings (admin-managed key-value store)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admin can modify settings
CREATE POLICY "Admin can modify settings"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Default: AI enabled
INSERT INTO public.app_settings (key, value) VALUES
  ('ai_enabled', 'true'),
  ('ai_model', 'gemini-2.0-flash'),
  ('ai_daily_limit_per_user', '20')
ON CONFLICT (key) DO NOTHING;
