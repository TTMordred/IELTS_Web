-- IELTS Self-Study Hub — Schema 3.3
-- Speaking Part 3 Discussion Questions
-- Run after schema-3.2.sql.
--
-- Part 3 extends a Part 2 discussion theme into a chain of structured
-- questions. It gets its own table (rather than the Part 1 Q&A model) because
-- each question carries a reasoning framework of its own:
--   Question  →  Answer Function  →  Answer Structure  →  Main Idea
--   →  Supporting Ideas  →  Alternative View  →  Answer  →  Follow-up Ideas
--   →  Discussion Devices  →  Language Bank

DO $$ BEGIN
  CREATE TYPE public.part3_answer_function AS ENUM (
    'Opinion', 'Cause / Reason', 'Effect / Impact', 'Advantages',
    'Disadvantages', 'Compare / Contrast', 'Agree / Disagree', 'Problem',
    'Solution', 'Prediction / Future', 'Evaluation / A vs B'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.speaking_part3_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.speaking_entries(id) ON DELETE CASCADE,
  -- Provenance to the Part 2 cue card whose follow-up set this question came
  -- from (optional). Drives which discussion themes are available per entry.
  topic_id uuid REFERENCES public.global_topics(id) ON DELETE SET NULL,
  question text NOT NULL CHECK (btrim(question) <> ''),
  -- Broader IELTS topic (e.g. "Travel", "Technology"), mirroring Part 2's `topic`.
  topic text,
  answer_function public.part3_answer_function NOT NULL DEFAULT 'Opinion',
  -- Per-function reasoning framework: array of step strings, editable per
  -- question (the default structure is only a starting point).
  answer_structure jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(answer_structure) = 'array'),
  -- Central argument — distinct from the full answer.
  main_idea text NOT NULL CHECK (btrim(main_idea) <> ''),
  -- Array of { idea, importance: 'essential' | 'optional' }.
  supporting_ideas jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(supporting_ideas) = 'array'),
  -- Perspective / exception / qualification / counterargument.
  alternative_view text,
  answer text NOT NULL CHECK (btrim(answer) <> ''),
  -- Ideas to extend / vary the answer for similar follow-up questions.
  follow_up_ideas jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(follow_up_ideas) = 'array'),
  -- Reusable discussion expressions — array of { expression, meaningVi, example }
  -- (mirrors Part 2's storytelling_devices).
  discussion_devices jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(discussion_devices) = 'array'),
  -- The 10-section Language Bank object (arrays of the shared item shapes).
  language_bank jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(language_bank) = 'object'),
  position smallint NOT NULL DEFAULT 1 CHECK (position BETWEEN 1 AND 20),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_id, position)
);

CREATE INDEX IF NOT EXISTS idx_speaking_part3_questions_entry ON public.speaking_part3_questions(entry_id);

ALTER TABLE public.speaking_part3_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own speaking part 3 questions"
  ON public.speaking_part3_questions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.speaking_entries
    WHERE id = entry_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.speaking_entries
    WHERE id = entry_id AND user_id = auth.uid()
  ));

-- Tables created via raw SQL must be explicitly granted to the API roles
-- (the dashboard migration runner does this automatically for generated
-- tables; raw DDL does not).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.speaking_part3_questions TO authenticated;
GRANT USAGE ON TYPE public.part3_answer_function TO authenticated;
