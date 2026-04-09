-- ═══════════════════════════════════════════════════════════
-- IELTS Self-Study Hub — Schema 2.4
-- B4: question_type_notes (per-user strategy notes per QT)
-- B5: record_links (cross-module junction table)
-- Run AFTER schema-2.3.sql in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── B4: Question Type Notes ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.question_type_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module text NOT NULL CHECK (module IN ('listening', 'reading')),
  question_type text NOT NULL,
  strategy text,
  traps text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module, question_type)
);

CREATE INDEX IF NOT EXISTS idx_qt_notes_user ON public.question_type_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_qt_notes_lookup ON public.question_type_notes(user_id, module, question_type);
ALTER TABLE public.question_type_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own QT notes" ON public.question_type_notes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own QT notes" ON public.question_type_notes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own QT notes" ON public.question_type_notes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own QT notes" ON public.question_type_notes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── B5: Cross-Module Record Links ───────────────────────────
CREATE TABLE IF NOT EXISTS public.record_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_table text NOT NULL CHECK (source_table IN (
    'listening_records', 'reading_records', 'writing_entries', 'speaking_entries', 'vocab_cards', 'mistake_entries'
  )),
  source_id uuid NOT NULL,
  target_table text NOT NULL CHECK (target_table IN (
    'listening_records', 'reading_records', 'writing_entries', 'speaking_entries', 'vocab_cards', 'mistake_entries'
  )),
  target_id uuid NOT NULL,
  relation_type text CHECK (relation_type IN ('related', 'source', 'follow_up', 'mistake_of', 'vocab_from')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_table, source_id, target_table, target_id)
);

CREATE INDEX IF NOT EXISTS idx_record_links_source ON public.record_links(user_id, source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_record_links_target ON public.record_links(user_id, target_table, target_id);
ALTER TABLE public.record_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own links" ON public.record_links
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own links" ON public.record_links
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own links" ON public.record_links
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own links" ON public.record_links
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── C6: Speaking Recordings Storage Bucket ──────────────────
-- Run this block separately if storage schema is in a different DB schema:
INSERT INTO storage.buckets (id, name, public)
  VALUES ('speaking-recordings', 'speaking-recordings', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own recordings" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'speaking-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own recordings" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'speaking-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own recordings" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'speaking-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
