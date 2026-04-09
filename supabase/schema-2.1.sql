-- ═══════════════════════════════════════════════════════════
-- IELTS Self-Study Hub — Schema 2.1
-- Global Topics Marketplace + Admin Role + Forecast
-- Run AFTER schema.sql (which now includes Phase 2 tables)
-- ═══════════════════════════════════════════════════════════

-- ── 1. Add role to profiles ─────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- Patch trigger to set role explicitly on new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. is_admin() function (hardened) ───────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Restrict execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ── 3. Global Topics table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.global_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  module text NOT NULL CHECK (module IN ('speaking', 'vocab')),
  part smallint CHECK (
    (module = 'speaking' AND part IN (1, 2, 3))
    OR (module = 'vocab' AND part IS NULL)
  ),
  category text,
  sample_questions jsonb DEFAULT '[]' CHECK (jsonb_typeof(sample_questions) = 'array'),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_forecast boolean NOT NULL DEFAULT false,
  forecast_quarter text CHECK (
    forecast_quarter ~ '^Q[1-4]/[0-9]{4}$'
  ),
  -- Enforce: forecast topics must have quarter, non-forecast must not
  CHECK (is_forecast = (forecast_quarter IS NOT NULL)),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_global_topics_module_part ON public.global_topics(module, part);
CREATE INDEX idx_global_topics_forecast ON public.global_topics(is_forecast, forecast_quarter);
CREATE INDEX idx_global_topics_created_by ON public.global_topics(created_by);

ALTER TABLE public.global_topics ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all topics
CREATE POLICY "Anyone can read topics"
  ON public.global_topics FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can add topics
CREATE POLICY "Users can add topics"
  ON public.global_topics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only admin can update/delete any topic
CREATE POLICY "Admin can update topics"
  ON public.global_topics FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin can delete topics"
  ON public.global_topics FOR DELETE
  TO authenticated
  USING (is_admin());

-- ── 4. Topic Upvotes (junction, prevents double-vote) ───────
CREATE TABLE IF NOT EXISTS public.topic_upvotes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.global_topics(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

ALTER TABLE public.topic_upvotes ENABLE ROW LEVEL SECURITY;

-- Users can read all upvotes (for count display)
CREATE POLICY "Anyone can read upvotes"
  ON public.topic_upvotes FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own upvotes
CREATE POLICY "Users insert own upvotes"
  ON public.topic_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own upvotes
CREATE POLICY "Users delete own upvotes"
  ON public.topic_upvotes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── 5. Admin read policies on existing tables ───────────────
-- Allow admin to SELECT all rows from module tables for dashboard stats

CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_admin() OR auth.uid() = id);

CREATE POLICY "Admin can read all listening"
  ON public.listening_records FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin can read all reading"
  ON public.reading_records FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin can read all writing"
  ON public.writing_entries FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin can read all speaking"
  ON public.speaking_entries FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin can read all vocab"
  ON public.vocab_cards FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin can read all activity"
  ON public.daily_activity FOR SELECT
  TO authenticated
  USING (is_admin());

-- ── 6. Helper: get server date (for streak) ─────────────────
CREATE OR REPLACE FUNCTION public.get_current_date_text()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT to_char(CURRENT_DATE, 'YYYY-MM-DD');
$$;

GRANT EXECUTE ON FUNCTION public.get_current_date_text() TO authenticated;
