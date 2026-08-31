-- IELTS Self-Study Hub — Schema 3.2
-- Speaking Part 2 Cue Cards
-- Run after schema-3.1.sql.
--
-- Part 2 has a richer structure than Part 1's Q&A model, so it gets its own
-- table rather than being forced into speaking_entry_questions/speaking_answers:
--   Cue Card  →  Cue Card Type  →  Topic  →  Answer Structure  →  Key Ideas
--   →  Answer  →  Follow-up Ideas  →  Storytelling Devices  →  Language Bank

DO $$ BEGIN
  CREATE TYPE public.cue_card_type AS ENUM (
    'Person', 'Place', 'Object', 'Activity', 'Event',
    'Experience', 'Skill', 'Media', 'Time'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.speaking_part2_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.speaking_entries(id) ON DELETE CASCADE,
  -- Provenance to the Topic Bank cue card (optional). Also lets Part 3 lookups
  -- derive which follow-up question sets are available for this entry.
  topic_id uuid REFERENCES public.global_topics(id) ON DELETE SET NULL,
  cue_card text NOT NULL CHECK (btrim(cue_card) <> ''),
  cue_card_type public.cue_card_type NOT NULL DEFAULT 'Experience',
  -- Broader IELTS topic (e.g. "Travel", "Technology") — distinct from the type.
  topic text,
  -- Logical storytelling framework: array of step strings, editable per card.
  answer_structure jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(answer_structure) = 'array'),
  -- Concise planning notes / outline keywords, not a full answer.
  key_ideas jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(key_ideas) = 'array'),
  answer text NOT NULL CHECK (btrim(answer) <> ''),
  -- Ideas to extend / personalise / replace details, or answer similar cards.
  follow_up_ideas jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(follow_up_ideas) = 'array'),
  -- Storytelling devices: array of { expression, meaningVi, example? }.
  storytelling_devices jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(storytelling_devices) = 'array'),
  -- The 10-section Language Bank object (arrays of the shared item shapes).
  language_bank jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(language_bank) = 'object'),
  position smallint NOT NULL DEFAULT 1 CHECK (position BETWEEN 1 AND 8),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_id, position)
);

CREATE INDEX IF NOT EXISTS idx_speaking_part2_cards_entry ON public.speaking_part2_cards(entry_id);

ALTER TABLE public.speaking_part2_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own speaking part 2 cards"
  ON public.speaking_part2_cards FOR ALL TO authenticated
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.speaking_part2_cards TO authenticated;
GRANT USAGE ON TYPE public.cue_card_type TO authenticated;
