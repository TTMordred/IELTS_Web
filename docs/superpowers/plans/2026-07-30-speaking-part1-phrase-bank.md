# Speaking Part 1 Notebook and Phrase Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a structured Part 1 learning notebook to Speaking records and route reusable vocabulary, phrase, and grammar items into their study banks.

**Architecture:** Reuse `global_topics` and its `sample_questions` as the shared Topic/Question source. Persist per-record question snapshots and answer variants in two new tables, and persist idioms/collocations/linking words in one typed `language_notes` table exposed as Phrase Bank. Server Actions own validation, RLS-safe mutations, duplicate filtering, and XP updates.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/Postgres/RLS, Zod 4, Tailwind CSS, lucide-react, Node test runner.

**Repository rule:** Do not commit or push this plan or any implementation changes unless the user explicitly asks.

---

### Task 1: Database migration and shared contracts

**Files:**
- Create: `supabase/schema-2.6.sql`
- Create: `src/lib/constants/speaking-answer-templates.ts`
- Modify: `src/lib/constants/grammar-categories.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add the answer-function mapping**

Export `ANSWER_FUNCTION_TEMPLATES` as the exact 12 `{ function, structure }` pairs from the approved design, plus `AnswerFunction` and `answerStructureFor()` derived from that array. The function must return the matching structure or `null`.

- [ ] **Step 2: Add the migration**

Create `speaking_entry_questions`, `speaking_answers`, and `language_notes` with the approved columns. Use these critical constraints:

```sql
unique (entry_id, topic_id, question_text)
unique (entry_question_id, position)
check (position between 1 and 5)
check (jsonb_typeof(topic_specific_vocabulary) = 'array')
check (jsonb_array_length(topic_specific_vocabulary) > 0)
check (kind in ('idiom', 'collocation', 'linking_word'))
```

Use `ON DELETE CASCADE` from answers to entry questions and from entry questions to Speaking entries. Use `ON DELETE SET NULL` for `topic_id`. Add RLS policies that authorize Speaking child rows through the owned `speaking_entries` parent and authorize `language_notes` with `auth.uid() = user_id`. Add a case-insensitive unique expression index on `(user_id, kind, lower(phrase))` for Phrase Bank duplicates.

- [ ] **Step 3: Add the Grammar category and TypeScript row types**

Add a `speaking_patterns` Grammar category named `Speaking Sentence Patterns`. Add types for structured word rows, phrase rows, entry questions, answers, and language notes in `src/lib/types.ts`.

- [ ] **Step 4: Verify migration text and TypeScript**

Run:

```powershell
rg -n "create table.*(speaking_entry_questions|speaking_answers|language_notes)|create policy|position between 1 and 5" supabase/schema-2.6.sql
npx tsc --noEmit
```

Expected: all three tables and their policies appear; TypeScript exits 0.

### Task 2: Validation contract with runnable checks

**Files:**
- Create: `src/lib/speaking/notebook-validation.ts`
- Create: `src/lib/speaking/notebook-validation.test.ts`

- [ ] **Step 1: Write failing Node tests**

Use `node:test` and `node:assert/strict` to cover:

```ts
test("maps every answer function to one structure", () => {
  assert.equal(ANSWER_FUNCTION_TEMPLATES.length, 12);
  for (const item of ANSWER_FUNCTION_TEMPLATES) {
    assert.equal(answerStructureFor(item.function), item.structure);
  }
});

test("rejects an answer with an empty required field", () => {
  assert.equal(answerInputSchema.safeParse({ ...validAnswer, grammar_focus: "" }).success, false);
});

test("rejects empty structured lists", () => {
  assert.equal(answerInputSchema.safeParse({ ...validAnswer, collocations: [] }).success, false);
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run `node --test src/lib/speaking/notebook-validation.test.ts`.

Expected: FAIL because the validation module does not exist.

- [ ] **Step 3: Implement the Zod schemas**

Export `wordMeaningSchema`, `phraseMeaningSchema`, `linkingWordSchema`, `entryQuestionInputSchema`, and `answerInputSchema`. All strings must use `.trim().min(1)`, every structured list must use `.min(1)`, and `position` must be an integer from 1 to 5. Infer and export the input types from the schemas.

- [ ] **Step 4: Run focused checks**

Run:

```powershell
node --test src/lib/speaking/notebook-validation.test.ts
npx tsc --noEmit
```

Expected: all tests pass and TypeScript exits 0.

### Task 3: Speaking notebook Server Actions

**Files:**
- Create: `src/app/(app)/speaking/notebook-actions.ts`
- Modify: `src/app/(app)/speaking/actions.ts`

- [ ] **Step 1: Add read actions**

Implement:

```ts
export async function getPart1Notebook(entryId: string)
export async function getPart1TopicBank()
```

Both authenticate with `auth.getUser()`. The notebook query must ownership-filter the parent Speaking entry and return nested entry questions with answers ordered by topic/question creation and answer position. Topic Bank must select `id, name, sample_questions` where module is `speaking` and part is 1.

- [ ] **Step 2: Add question mutations**

Implement:

```ts
export async function addEntryQuestion(input: {
  entryId: string;
  topicId: string;
  questionText: string;
  answerFunction: AnswerFunction;
})
export async function deleteEntryQuestion(id: string)
```

Validate the Function mapping, verify the parent entry belongs to the current user, verify the Topic Bank row contains the requested question, snapshot `questionText`, then insert. Deletes must filter through an owned parent query before mutation. Revalidate only the affected Speaking detail route.

- [ ] **Step 3: Add answer save/delete mutations**

Implement:

```ts
export async function saveSpeakingAnswer(input: AnswerInput & {
  id?: string;
  entryQuestionId: string;
})
export async function deleteSpeakingAnswer(id: string)
```

Parse with `answerInputSchema`, verify ownership through the parent entry, reject a sixth new answer, and insert/update the answer snapshot. Deletion removes only `speaking_answers`; it must not remove derived bank items.

- [ ] **Step 4: Derive Vocab, Phrase, and Grammar items**

Inside the save action, normalize duplicate keys with `trim().toLocaleLowerCase("en")` and batch-create only missing items:

- Vocab: Topic-Specific and Advanced use the Topic Bank name; Useful uses `topic = null`; tags identify `speaking` and the source group.
- Phrase Bank: map the three arrays to `kind = idiom | collocation | linking_word`, with topic and source snapshots.
- Grammar: create one `grammar_notes` row with category `speaking_patterns`, `rule = grammar_focus`, and `correct_examples` from non-empty lines in `sentence_patterns`.

Award `5 * (new vocab + new language notes) + 8 * new grammar notes`. Increment `daily_activity.notes_added` only for new Grammar notes, update profile XP/last_active, and call `updateStreak` once. Duplicate derived rows award no XP.

- [ ] **Step 5: Revalidate consumers and run checks**

Revalidate the Speaking detail, `/vocab`, `/grammar`, `/phrase-bank`, `/dashboard`, and `/activity` after a successful save. Run focused Node tests, `npx tsc --noEmit`, and `npm run lint`.

Expected: all exit 0.

### Task 4: Part 1 notebook UI on Speaking detail

**Files:**
- Create: `src/components/speaking/part1-notebook.tsx`
- Create: `src/components/speaking/speaking-answer-editor.tsx`
- Modify: `src/app/(app)/speaking/[id]/page.tsx`

- [ ] **Step 1: Load notebook and Topic Bank server-side**

In the detail page, fetch related records, Part 1 notebook, and Part 1 Topic Bank in parallel after ownership is established. Pass serializable initial data to the client notebook component.

- [ ] **Step 2: Build Topic/Question selection**

Add a `Part 1 Learning Notebook` card using the design-system variables and lucide-react icons. Provide Topic search/select, render the selected Topic's `sample_questions`, and require one Answer Function before adding each question. Show the derived Structure read-only.

- [ ] **Step 3: Build structured answer rows**

In `speaking-answer-editor.tsx`, use a small reusable row editor for:

- `{ word, meaning }` vocabulary groups
- `{ phrase, meaning }` idiom/collocation groups
- `{ word, function }` linking words

Each group starts with one row, supports add/remove, and displays English-only labels. Use required textareas for Answer, Follow-up Ideas, Synonyms & Paraphrasing, Referencing Devices, Sentence Patterns, and Grammar Focus.

- [ ] **Step 4: Add edit/delete and answer limit states**

Question cards show `n/5 answers`, existing answer summaries, Edit/Delete actions, and disable Add Answer at five. Mutations display server errors, preserve editor input after failure, refresh the router after success, and provide accessible button labels and focus states.

- [ ] **Step 5: Verify the UI build**

Run:

```powershell
node --test src/lib/speaking/notebook-validation.test.ts
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all exit 0 and `/speaking/[id]` compiles.

### Task 5: Phrase Bank feature

**Files:**
- Create: `src/app/(app)/phrase-bank/page.tsx`
- Create: `src/app/(app)/phrase-bank/actions.ts`
- Create: `src/app/(app)/phrase-bank/loading.tsx`
- Create: `src/components/phrase-bank/phrase-bank-board.tsx`
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Add Phrase Bank actions**

Implement authenticated actions to list, manually add, delete, and update mastery for the current user's `language_notes`. Manual adds validate `kind`, phrase, and meaning, skip case-insensitive duplicates, award 5 XP only for a new row, update activity/profile/streak, and revalidate Phrase Bank/Dashboard/Activity.

- [ ] **Step 2: Build the Phrase Bank page**

Create `/phrase-bank` as a Server Component that fetches the current user's notes and renders `PhraseBankBoard`. The client board has three tabs, search across phrase/meaning, optional topic filtering, an English structured add form, mastery display/update, source display, and delete confirmation. Use `var(--color-accent)` and lucide icons only.

- [ ] **Step 3: Add navigation and loading state**

Add a `Phrase Bank` sidebar item with a lucide icon next to Vocab/Grammar. Add a loading skeleton consistent with other app modules.

- [ ] **Step 4: Verify routes and static checks**

Run `npx tsc --noEmit`, `npm run lint`, and `npm run build`.

Expected: all exit 0; build output includes `/phrase-bank` and Speaking detail.

### Task 6: Final regression and handoff

**Files:**
- Review all files changed above
- Do not create or modify plan/spec files during this task

- [ ] **Step 1: Apply the migration to the intended local/development database only if the environment is available**

Use the repository's existing Supabase workflow. Do not apply to production or any remote project without explicit user approval. Confirm the three new tables and RLS policies exist.

- [ ] **Step 2: Run compact final verification**

Run:

```powershell
node --test src/lib/speaking/notebook-validation.test.ts
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Expected: tests/typecheck/lint/build/diff check pass; status lists only intended uncommitted changes.

- [ ] **Step 3: Manually verify the critical flow when a development database is available**

Create a Speaking record, select a Part 1 Topic/Question, choose a Function, save 1–5 complete answers, and confirm Vocab/Phrase/Grammar records and XP. Confirm duplicates add no XP and deleting the answer preserves derived learning items.

- [ ] **Step 4: Report without committing or pushing**

Summarize files changed, migration status, verification evidence, and any environment-only checks that remain. Leave all changes uncommitted until the user explicitly requests a commit.

---

# Speaking Part 2 and Part 3 Answer Sheets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the draft and persisted Speaking Answer Sheet flow to IELTS Parts 2 and 3.

**Architecture:** Reuse `speaking_entry_questions` and `speaking_answers`, adding an explicit `part` discriminator. One Answer Sheet component handles Part-specific Topic Bank mapping: Part 2 uses the topic name as its Cue Card prompt, while Part 3 uses that Part 2 topic's `sample_questions`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/Postgres, Zod, Node test runner.

### Task 1: Add the part discriminator

**Files:**
- Modify: `supabase/schema-2.6.sql`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/speaking/notebook-validation.ts`
- Test: `src/lib/speaking/notebook-validation.test.mjs`

- [ ] Add a failing validation test that accepts `part: 1 | 2 | 3` and rejects `part: 4` in a new-record notebook question.
- [ ] Run `node --test src/lib/speaking/notebook-validation.test.mjs`; expect the new assertion to fail.
- [ ] Add `part smallint NOT NULL DEFAULT 1 CHECK (part IN (1, 2, 3))` to `speaking_entry_questions`, include `part` in its unique key, TypeScript type, and Zod draft schema.
- [ ] Re-run the focused test; expect all tests to pass.

### Task 2: Make mutations and reads Part-aware

**Files:**
- Modify: `src/app/(app)/speaking/notebook-actions.ts`
- Modify: `src/app/(app)/speaking/actions.ts`

- [ ] Require `part` in `addEntryQuestion` and validate the Topic Bank mapping: Part 1 uses a Part 1 sample question, Part 2 equals a Part 2 topic name, and Part 3 uses a Part 2 sample question.
- [ ] Replace Part 1-only readers with `getSpeakingNotebook(entryId, part)` and `getSpeakingTopicBank(part)`, mapping Part 3 to Part 2 Topic Bank rows.
- [ ] Pass each draft question's `part` through record creation and preserve all existing answer validation, derived items, XP, and RLS checks.

### Task 3: Reuse the Answer Sheet UI across all parts

**Files:**
- Modify: `src/components/speaking/part1-notebook.tsx`
- Modify: `src/app/(app)/speaking/new/page.tsx`
- Test: `src/app/(app)/speaking/new/page.test.mjs`

- [ ] Extend the source regression test to require Answer Sheets for `part={1}`, `part={2}`, and `part={3}`; run it and expect failure.
- [ ] Add a required `part` prop to the shared component. For Part 2, use the selected topic name directly; for Parts 1 and 3, show `sample_questions`.
- [ ] Render all three Answer Sheets immediately on New Record. Scope Part 3 topics to selected Part 2 Cue Cards and combine the three drafts on Save Record.
- [ ] Remove the duplicate legacy Part 1/2/3 topic inputs from the metadata wizard, leaving Scores/Type and Reflection/Recording.
- [ ] Re-run the regression test and TypeScript; expect both to pass.

### Task 4: Show all parts on record detail

**Files:**
- Modify: `src/app/(app)/speaking/[id]/page.tsx`

- [ ] Fetch notebooks for Parts 1–3 and Topic Bank rows for Parts 1–2.
- [ ] Render three Answer Sheet sections; scope Part 3 choices to the record's selected Part 2 topic IDs.

### Task 5: Apply and verify locally

**Files:**
- Review all changed files; do not commit or push.

- [ ] Apply the `part` column and unique constraint to the running local Supabase database only.
- [ ] Run focused Node tests, scoped ESLint, `npx tsc --noEmit --incremental false`, `npm run build`, and `git diff --check`.
- [ ] Restart the local Next.js server and confirm `/auth` responds while protected Speaking routes redirect unauthenticated requests correctly.

### Task 6: Add optional Speaking record names

**Files:**
- Create: `src/lib/speaking/record-name.ts`
- Create: `src/lib/speaking/record-name.test.mjs`
- Modify: `supabase/schema.sql`
- Modify: `supabase/schema-2.6.sql`
- Modify: `src/app/(app)/speaking/actions.ts`
- Modify: `src/app/(app)/speaking/new/page.tsx`
- Modify: `src/app/(app)/speaking/page.tsx`
- Modify: `src/app/(app)/speaking/[id]/page.tsx`
- Modify: `src/app/(app)/inline-actions.ts`
- Modify: `src/app/(app)/search/actions.ts`
- Modify: `src/app/(app)/record-links-actions.ts`

- [ ] Write failing tests for trimming, blank-to-null conversion, the 120-character limit, and type/date fallback labels.
- [ ] Add the nullable constrained `name` column and apply it to local Supabase.
- [ ] Normalize the optional name at create and inline-update server boundaries.
- [ ] Add the New Record input and inline rename control.
- [ ] Use the shared label helper in Speaking list, global search, and Related Records.
- [ ] Run focused tests, scoped ESLint, TypeScript, build, schema checks, and restart the local web server without committing or pushing.
