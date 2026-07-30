# Speaking Answer Sheets and Phrase Bank

## Status

Parts 1, 2, and 3 are implemented locally and remain uncommitted.

### Optional record name

`speaking_entries.name` is nullable and limited to 120 trimmed characters. The
New Record page accepts an optional name, and the detail header supports inline
renaming. Blank input is stored as `NULL`. Lists, global search, and Related
Records display the custom name when present and otherwise fall back to the
session type plus date. Existing records remain unnamed and require no backfill.

## Context

The existing Speaking module stores one `speaking_entries` row and one optional
`speaking_part_details` row per IELTS part. Part 1 currently compresses selected
topics into a comma-separated string and cannot store questions or answer
variants. The existing `global_topics` table already provides shared Speaking
topics and `sample_questions` JSON. The existing `vocab_cards` and
`grammar_notes` features should be reused where they fit.

The reference answer sheet organizes each question around one fixed answer
function and structure, then several answer variants with learning notes.

## Goals

- Add Answer Sheets for Parts 1, 2, and 3 to each Speaking record.
- Let learners select shared Topics and Questions from `global_topics`.
- Let learners select one fixed Answer Function per Question; its Structure is
  derived from the fixed mapping below.
- Support 1–5 complete answer variants per Question.
- Persist all sheet fields and allow later editing/deletion.
- Create Vocab, Grammar, and Phrase Bank items from the corresponding fields.
- Preserve generated learning items when an answer is deleted.
- Reuse one data model and Answer Sheet component across all three parts.

## Non-goals

- No changes to the shared Topic Bank ownership model.
- No audio transcription or speech-based AI grading.
- No admin CRUD feature for answer-function templates.

## Fixed answer mappings

The UI exposes these fixed pairs. The learner selects the Function; the
Structure is displayed automatically and is not independently editable.

| Function | Structure |
| --- | --- |
| Agree | Opinion → Identity reason → Explanation → Result |
| Benefit | Main benefit → Explanation → Personal example |
| Cause / Effect | Cause → Effect → Example |
| Comparison | A vs B → Preference → Reason |
| Disagree | Polite disagreement → Reason → Example |
| Future Plan | Wish → Reason → Possible result |
| Habit | Frequency → Activity → Reason → Limit |
| Partial Agreement | Partly agree → One side → Other side → Final view |
| Past Experience | Time → Situation → Action → Feeling |
| Preference | Direct answer → Reason → Example → Feeling |
| Problem | Problem → Why it matters → Example |
| Uncertainty | Soft start → Think → Answer |

## Data model

### Reused tables

- `global_topics`: shared Speaking topics (`module = 'speaking'`, `part = 1`)
  and their `sample_questions`.
- `vocab_cards`: Topic-Specific Vocabulary, Useful Vocabulary, and Advanced
  Adjectives/Adverbs. Useful Vocabulary has no topic; the other two use the
  selected topic name.
- `grammar_notes`: Sentence Patterns and Grammar Focus.
- `daily_activity`, `profiles`, and `updateStreak`: existing gamification.

### New table: `speaking_entry_questions`

One row represents a selected shared question in a Speaking record.

- `id` UUID primary key
- `entry_id` UUID FK to `speaking_entries` with cascade delete
- `topic_id` UUID nullable FK to `global_topics` with `ON DELETE SET NULL`
- `question_text` text snapshot of the selected question
- `answer_function` text constrained to the 12 fixed functions
- `created_at`, `updated_at`
- Unique `(entry_id, topic_id, question_text)`

The question snapshot protects old records if the shared Topic Bank changes or
an admin removes a shared topic.
The structure is derived from `answer_function` in shared constants, avoiding
function/structure mismatches in stored data.

### New table: `speaking_answers`

One row represents one answer variant. A question can have positions 1–5.

- `id` UUID primary key
- `entry_question_id` UUID FK to `speaking_entry_questions` with cascade delete
- `position` smallint constrained to 1–5; unique per question
- `answer_text` text
- `follow_up_ideas` text
- `topic_specific_vocabulary` JSONB array of `{ word, meaning }`
- `useful_vocabulary` JSONB array of `{ word, meaning }`
- `advanced_adjectives_adverbs` JSONB array of `{ word, meaning }`
- `idioms_phrasal_verbs` JSONB array of `{ phrase, meaning }`
- `collocations` JSONB array of `{ phrase, meaning }`
- `linking_words` JSONB array of `{ word, function }`
- `synonyms_paraphrasing` text
- `referencing_devices` text
- `sentence_patterns` text
- `grammar_focus` text
- `created_at`, `updated_at`

All answer fields are required at the server boundary. The three vocabulary
arrays and three Phrase Bank arrays must contain at least one item. Database
constraints enforce basic non-empty text, valid JSON array types, and the
maximum position; the server action validates each object and enforces complete
submissions and the 1–5 workflow.

### New table: `language_notes`

Phrase Bank uses one table with filtered tabs rather than three duplicated
tables.

- `id` UUID primary key
- `user_id` UUID FK to `profiles`
- `kind` constrained to `idiom`, `collocation`, or `linking_word`
- `phrase` text
- `meaning` text
- `topic` text nullable
- `source` text nullable
- `mastery_level` integer defaulting to 0
- `next_review` date defaulting to tomorrow
- `review_count` integer defaulting to 0
- `created_at`, `updated_at`

The UI feature is named **Phrase Bank** and has three tabs:

- Idioms & Phrasal Verbs
- Collocations
- Linking Words

Duplicate detection is case-insensitive on `user_id + kind + phrase`; duplicate
items are skipped and do not earn XP.

## UI and flow

### Part 2 and Part 3 extension

The New Speaking Record page shows Answer Sheets for all three Speaking parts
before the session metadata wizard. Draft questions and answers stay in client
state and are written together when the learner selects **Save Record**. An
abandoned page therefore creates no database record or XP.

All parts reuse `speaking_entry_questions` and `speaking_answers` rather than
introducing part-specific tables. `speaking_entry_questions` gains a required
`part` column constrained to `1`, `2`, or `3`, with a default of `1` so existing
Part 1 rows remain valid.

- Part 1 selects a Topic Bank topic and one of its `sample_questions`.
- Part 2 selects a `part = 2` Topic Bank row; its topic name is the Cue Card
  prompt stored as `question_text`.
- Part 3 selects one or more follow-up questions from the selected Part 2
  topic's `sample_questions`. It references the same Part 2 Topic Bank row and
  stores each selected follow-up as `question_text`.

Each question keeps one fixed Answer Function and its derived read-only Answer
Structure, and supports one to five complete answer variants. The existing
validation, Vocab Bank, Phrase Bank, Grammar Notes, duplicate handling, XP, and
deletion behavior apply unchanged to Parts 2 and 3.

The Speaking detail page displays separate Answer Sheet sections for Parts 1,
2, and 3. Part 3 choices are scoped to each Part 2 Cue Card, so no separate
`part = 3` Topic Bank rows or seed data are required.

The detail page adds a **Part 1 Learning Notebook** section:

1. `Add Topic` searches/selects a shared Part 1 Topic.
2. The learner selects one or more questions from that Topic's
   `sample_questions`.
3. Each Question card shows the selected Function and derived Structure, plus
   an answer count (`n/5`).
4. `Add Answer` opens a structured form. Repeated items use `word/phrase +
   meaning/function` rows with an Add Another Item control; all other sheet
   fields use required multiline text inputs.
5. The learner can edit/delete questions and individual answers. Deleting a
   Speaking answer does not delete generated Vocab, Grammar, or Phrase Bank
   items.

The new `/phrase-bank` page is added to navigation and provides search, topic
filtering, type tabs, add/delete controls, and mastery/review behavior aligned
with existing study features.

## Save behavior and XP

Saving an answer validates ownership, question membership, all required fields,
the answer position, and the Function mapping. It stores the answer snapshot,
then creates derived learning records:

- Each new Vocab card earns the existing 5 XP/card.
- Each new Grammar note uses the existing 8 XP/note behavior.
- Each new Phrase Bank item earns 5 XP/item, matching the vocabulary-like
  learning unit.
- XP and activity updates count only records actually inserted; duplicates are
  skipped.
- Generated learning records remain independent if the source answer is later
  edited or deleted.

The server action performs all authentication/ownership checks and revalidates
the Speaking detail, Phrase Bank, Vocab, Grammar, Dashboard, and Activity
paths as appropriate.

## Security and integrity

- RLS on both new Speaking tables checks ownership through the parent
  `speaking_entries` row.
- RLS on `language_notes` restricts all operations to `auth.uid() = user_id`.
- Server-side validation is mandatory because Server Actions are directly
  callable by POST requests.
- Topic and question selection is limited to authenticated, readable
  `global_topics` rows; the saved question text is still snapshotted.
- Generated records are never deleted as a side effect of deleting a Speaking
  answer.

## Error handling

- Invalid or incomplete answers return field-level errors without redirecting.
- A sixth answer is rejected.
- Duplicate derived items are harmless and do not add XP.
- If a derived-record insert fails after the answer is saved, the answer remains
  recoverable and the UI reports the failure; retrying is safe because duplicate
  derived items are skipped.
- Existing Speaking records remain valid and readable without notebook rows.

## Verification

Minimum checks before completion:

- Migration applies cleanly and RLS prevents cross-user reads/writes.
- Question selection snapshots Topic Bank question text.
- Function-to-Structure mapping is deterministic for all 12 functions.
- Required-field and 1–5 answer validation works server-side.
- Vocabulary and Phrase Bank row parsing creates the correct `kind`, topic, and
  source; Grammar fields map to `rule` and `correct_examples`.
- Duplicate items do not create cards/notes or XP.
- Deleting an answer preserves generated learning records.
- Existing Speaking list/detail creation still works.
- Run the project typecheck/lint and focused checks for Speaking, Vocab,
  Grammar, and Phrase Bank.
