-- ═══════════════════════════════════════════════════════════
-- IELTS Self-Study Hub — Schema 2.3
-- Resource Library + Mistake Journal tables
-- Run AFTER schema-2.2.sql
-- ═══════════════════════════════════════════════════════════

-- ── Resource Library ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text NOT NULL,
  module text CHECK (module IN ('listening', 'reading', 'speaking', 'writing', 'general')),
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'all')),
  tags text[] DEFAULT '{}',
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  usage_count integer NOT NULL DEFAULT 0,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_resources_user ON public.resources(user_id);
CREATE INDEX idx_resources_module ON public.resources(module);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Users can read own + public resources
CREATE POLICY "Users read own or public resources"
  ON public.resources FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users insert own resources"
  ON public.resources FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own resources"
  ON public.resources FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own resources"
  ON public.resources FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admin can manage all
CREATE POLICY "Admin manages all resources"
  ON public.resources FOR ALL TO authenticated
  USING (is_admin());

-- ── Study Planner ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  time_slot text NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'evening')),
  module text CHECK (module IN ('listening', 'reading', 'speaking', 'writing', 'vocab', 'grammar')),
  topic text,
  duration_min integer DEFAULT 30,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date, time_slot)
);
CREATE INDEX idx_study_plan_user ON public.study_plan_items(user_id);
ALTER TABLE public.study_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own plans" ON public.study_plan_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Mistake Journal ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mistake_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module text NOT NULL CHECK (module IN ('listening', 'reading', 'speaking', 'writing')),
  question_type text,
  description text NOT NULL,
  reason text CHECK (reason IN ('carelessness', 'knowledge_gap', 'time_pressure', 'vocab_gap', 'paraphrasing', 'other')),
  correct_approach text,
  source_record_id uuid,
  tags text[] DEFAULT '{}',
  reviewed boolean NOT NULL DEFAULT false,
  review_count integer NOT NULL DEFAULT 0,
  next_review date DEFAULT current_date + interval '1 day',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mistake_entries_user ON public.mistake_entries(user_id);
CREATE INDEX idx_mistake_entries_module ON public.mistake_entries(module);
CREATE INDEX idx_mistake_entries_reviewed ON public.mistake_entries(user_id, reviewed);
ALTER TABLE public.mistake_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own mistakes"
  ON public.mistake_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own mistakes"
  ON public.mistake_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own mistakes"
  ON public.mistake_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own mistakes"
  ON public.mistake_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin manages all mistakes"
  ON public.mistake_entries FOR ALL TO authenticated
  USING (is_admin());

-- ── Share Links (Tutor / Shared View) ───────────────────────
CREATE TABLE IF NOT EXISTS public.share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  view_config jsonb DEFAULT '{"modules": ["listening","reading","writing","speaking"], "showHeatmap": true, "showTrends": true}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_share_links_token ON public.share_links(token);
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own share links" ON public.share_links FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Public read by token (for shared view)
CREATE POLICY "Anyone can read by token" ON public.share_links FOR SELECT USING (true);
