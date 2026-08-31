-- Speaking answer editor: structured rows for the four free-text sections.
-- Old text values are wrapped into single-row arrays (Sentence Patterns splits
-- on newlines). Matches the existing jsonb array convention on this table.
--
-- NOTE: PostgreSQL forbids subqueries inside ALTER COLUMN ... TYPE ... USING,
-- so the Sentence Patterns newline split (originally an inline subquery) is
-- factored into a temporary helper function, dropped at the end of this file.
--
-- Idempotent: the whole conversion is guarded so it only runs while the
-- columns are still `text`. Re-running on an already-migrated database (e.g.
-- production) is a safe no-op.

CREATE OR REPLACE FUNCTION public._split_lines_to_jsonb(text)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    (SELECT jsonb_agg(jsonb_build_object('sentence', l, 'meaning', '', 'example', ''))
     FROM unnest(string_to_array($1, E'\n')) AS l
     WHERE btrim(l) <> ''),
    '[]'::jsonb)
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'speaking_answers'
      AND column_name = 'synonyms_paraphrasing'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE public.speaking_answers
      DROP CONSTRAINT IF EXISTS speaking_answers_synonyms_paraphrasing_check,
      DROP CONSTRAINT IF EXISTS speaking_answers_referencing_devices_check,
      DROP CONSTRAINT IF EXISTS speaking_answers_sentence_patterns_check,
      DROP CONSTRAINT IF EXISTS speaking_answers_grammar_focus_check,
      ALTER COLUMN synonyms_paraphrasing DROP NOT NULL,
      ALTER COLUMN referencing_devices DROP NOT NULL,
      ALTER COLUMN sentence_patterns DROP NOT NULL,
      ALTER COLUMN grammar_focus DROP NOT NULL;

    ALTER TABLE public.speaking_answers
      ALTER COLUMN synonyms_paraphrasing TYPE jsonb USING (
        CASE WHEN btrim(synonyms_paraphrasing) = '' THEN '[]'::jsonb
             ELSE jsonb_build_array(jsonb_build_object('vocabulary', synonyms_paraphrasing, 'replacement', '')) END),
      ALTER COLUMN referencing_devices TYPE jsonb USING (
        CASE WHEN btrim(referencing_devices) = '' THEN '[]'::jsonb
             ELSE jsonb_build_array(jsonb_build_object('phrase', referencing_devices, 'replacement', '')) END),
      ALTER COLUMN sentence_patterns TYPE jsonb USING (
        CASE WHEN btrim(sentence_patterns) = '' THEN '[]'::jsonb
             ELSE public._split_lines_to_jsonb(sentence_patterns) END),
      ALTER COLUMN grammar_focus TYPE jsonb USING (
        CASE WHEN btrim(grammar_focus) = '' THEN '[]'::jsonb
             ELSE jsonb_build_array(jsonb_build_object('grammar', grammar_focus, 'example', '')) END);

    ALTER TABLE public.speaking_answers
      ALTER COLUMN synonyms_paraphrasing SET NOT NULL,
      ALTER COLUMN referencing_devices SET NOT NULL,
      ALTER COLUMN sentence_patterns SET NOT NULL,
      ALTER COLUMN grammar_focus SET NOT NULL,
      ADD CONSTRAINT speaking_answers_synonyms_paraphrasing_check
        CHECK (jsonb_typeof(synonyms_paraphrasing) = 'array' AND jsonb_array_length(synonyms_paraphrasing) > 0),
      ADD CONSTRAINT speaking_answers_referencing_devices_check
        CHECK (jsonb_typeof(referencing_devices) = 'array' AND jsonb_array_length(referencing_devices) > 0),
      ADD CONSTRAINT speaking_answers_sentence_patterns_check
        CHECK (jsonb_typeof(sentence_patterns) = 'array' AND jsonb_array_length(sentence_patterns) > 0),
      ADD CONSTRAINT speaking_answers_grammar_focus_check
        CHECK (jsonb_typeof(grammar_focus) = 'array' AND jsonb_array_length(grammar_focus) > 0);
  END IF;
END $$;

DROP FUNCTION IF EXISTS public._split_lines_to_jsonb(text);
