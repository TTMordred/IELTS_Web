-- Schema 2.5: Add structured AI teacher feedback to writing entries
ALTER TABLE writing_entries ADD COLUMN IF NOT EXISTS teacher_feedback jsonb;
