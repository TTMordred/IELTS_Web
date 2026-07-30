-- IELTS Self-Study Hub — Schema 2.6
-- Speaking Part 1 notebook and Phrase Bank
-- Run after schema-2.5.sql.

ALTER TABLE public.speaking_entries ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.speaking_entries DROP CONSTRAINT IF EXISTS speaking_entries_name_check;
ALTER TABLE public.speaking_entries ADD CONSTRAINT speaking_entries_name_check
  CHECK (name IS NULL OR (btrim(name) <> '' AND char_length(name) <= 120));

CREATE TABLE IF NOT EXISTS public.speaking_entry_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.speaking_entries(id) ON DELETE CASCADE,
  part smallint NOT NULL DEFAULT 1 CHECK (part IN (1, 2, 3)),
  topic_id uuid REFERENCES public.global_topics(id) ON DELETE SET NULL,
  question_text text NOT NULL CHECK (btrim(question_text) <> ''),
  answer_function text NOT NULL CHECK (answer_function IN (
    'Agree', 'Benefit', 'Cause / Effect', 'Comparison', 'Disagree',
    'Future Plan', 'Habit', 'Partial Agreement', 'Past Experience',
    'Preference', 'Problem', 'Uncertainty'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.speaking_entry_questions
  ADD COLUMN IF NOT EXISTS part smallint NOT NULL DEFAULT 1 CHECK (part IN (1, 2, 3));
ALTER TABLE public.speaking_entry_questions
  DROP CONSTRAINT IF EXISTS speaking_entry_questions_entry_id_topic_id_question_text_key;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.speaking_entry_questions'::regclass
      AND conname = 'speaking_entry_questions_unique'
  ) THEN
    ALTER TABLE public.speaking_entry_questions
      ADD CONSTRAINT speaking_entry_questions_unique UNIQUE (entry_id, part, topic_id, question_text);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_speaking_entry_questions_entry
  ON public.speaking_entry_questions(entry_id);

ALTER TABLE public.speaking_entry_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own speaking questions"
  ON public.speaking_entry_questions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.speaking_entries
    WHERE id = entry_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.speaking_entries
    WHERE id = entry_id AND user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS public.speaking_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_question_id uuid NOT NULL REFERENCES public.speaking_entry_questions(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 5),
  answer_text text NOT NULL CHECK (btrim(answer_text) <> ''),
  follow_up_ideas text NOT NULL CHECK (btrim(follow_up_ideas) <> ''),
  topic_specific_vocabulary jsonb NOT NULL CHECK (jsonb_typeof(topic_specific_vocabulary) = 'array' AND jsonb_array_length(topic_specific_vocabulary) > 0),
  useful_vocabulary jsonb NOT NULL CHECK (jsonb_typeof(useful_vocabulary) = 'array' AND jsonb_array_length(useful_vocabulary) > 0),
  advanced_adjectives_adverbs jsonb NOT NULL CHECK (jsonb_typeof(advanced_adjectives_adverbs) = 'array' AND jsonb_array_length(advanced_adjectives_adverbs) > 0),
  idioms_phrasal_verbs jsonb NOT NULL CHECK (jsonb_typeof(idioms_phrasal_verbs) = 'array' AND jsonb_array_length(idioms_phrasal_verbs) > 0),
  collocations jsonb NOT NULL CHECK (jsonb_typeof(collocations) = 'array' AND jsonb_array_length(collocations) > 0),
  linking_words jsonb NOT NULL CHECK (jsonb_typeof(linking_words) = 'array' AND jsonb_array_length(linking_words) > 0),
  synonyms_paraphrasing text NOT NULL CHECK (btrim(synonyms_paraphrasing) <> ''),
  referencing_devices text NOT NULL CHECK (btrim(referencing_devices) <> ''),
  sentence_patterns text NOT NULL CHECK (btrim(sentence_patterns) <> ''),
  grammar_focus text NOT NULL CHECK (btrim(grammar_focus) <> ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_question_id, position)
);

CREATE INDEX IF NOT EXISTS idx_speaking_answers_question ON public.speaking_answers(entry_question_id);
ALTER TABLE public.speaking_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own speaking answers"
  ON public.speaking_answers FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.speaking_entry_questions q
    JOIN public.speaking_entries e ON e.id = q.entry_id
    WHERE q.id = entry_question_id AND e.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.speaking_entry_questions q
    JOIN public.speaking_entries e ON e.id = q.entry_id
    WHERE q.id = entry_question_id AND e.user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS public.language_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('idiom', 'collocation', 'linking_word')),
  phrase text NOT NULL CHECK (btrim(phrase) <> ''),
  meaning text NOT NULL CHECK (btrim(meaning) <> ''),
  topic text,
  source text,
  mastery_level integer NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 100),
  next_review date NOT NULL DEFAULT (current_date + 1),
  review_count integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_language_notes_unique_phrase ON public.language_notes(user_id, kind, lower(phrase));
CREATE INDEX IF NOT EXISTS idx_language_notes_user ON public.language_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_language_notes_topic ON public.language_notes(topic);
ALTER TABLE public.language_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own language notes"
  ON public.language_notes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
