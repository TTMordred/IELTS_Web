# Speaking Answer Editor — Structured Columns — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the four free-text sections of the Speaking answer editor into structured, add/remove rows so learners capture meaning + example per entry.

**Architecture:** The four `text` columns on `speaking_answers` become `jsonb` arrays. `types.ts` and `notebook-validation.ts` mirror the new shapes; the editor swaps the textareas for the existing `StructuredRows` (2-field) plus a new 3-field row component for Sentence Patterns; `createDerivedLearningItems` adapts the grammar-note rule/examples from the new arrays. All write paths flow through `saveSpeakingAnswer` → `answerInputSchema`, so the schema change propagates everywhere (edit, draft, and new-record flows).

**Tech Stack:** Next.js 16.2.2, React 19, Supabase, zod, lucide-react.

**Spec:** Requirements brainstormed 2026-08-26 (see conversation); design decisions captured in the Design section below. The separate Google Calendar plan is untouched.

## Global Constraints

- **No git commits.** The user commits manually. Each task ends with verification (type-check + lint), never a commit.
- Verify every task with: `~/.local/bin/node ./node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` (exit 0) and `~/.local/bin/node ./node_modules/eslint/bin/eslint.js <changed files>` (exit 0).
- Design system (AGENTS.md): accent `var(--color-accent)` (#1B4D3E); **no emoji in JSX** — use lucide-react icons; English UI text.
- The DB table is `public.speaking_answers`; the other lexical columns are already `jsonb` arrays with the pattern `jsonb_typeof(col) = 'array' AND jsonb_array_length(col) > 0` — mirror that.
- Local Supabase must be running (`supabase_db_IELTS_Web` container). Apply schema via `docker exec -i supabase_db_IELTS_Web psql -U postgres -d postgres`.

## Design

| Section | New row shape (jsonb array) | Editor columns |
|---|---|---|
| Sentence Patterns | `[{ sentence, meaning, example }]` | Pattern / Meaning / Example |
| Grammar Focus | `[{ grammar, example }]` | Grammar / Example |
| Synonyms & Paraphrasing | `[{ vocabulary, replacement }]` | Vocabulary / Replacement |
| Referencing Devices | `[{ phrase, replacement }]` | Phrase / Replacement phrase/sentence |

- Existing rows: migrated in-place by the ALTER (best-effort): the old free text becomes a single array row with the first field filled and the rest empty; Sentence Patterns splits on newlines.
- Grammar note logic is **kept** but adapted: `rule` = the grammar names joined with `", "`; `correct_examples` = the sentence-pattern sentences.
- `part1-notebook.tsx` passes these fields through untouched — it destructures `SpeakingAnswer` fields and re-emits them as `AnswerInput`, so only the shared types change; no edit needed there.

---

### Task 1: Schema — convert the four columns to jsonb

**Files:**
- Create: `supabase/schema-3.1.sql`
- Test (verify): apply to local DB via psql

**Interfaces:**
- Produces: `speaking_answers.synonyms_paraphrasing / referencing_devices / sentence_patterns / grammar_focus` are now `jsonb NOT NULL` arrays with a non-empty-array CHECK.

- [ ] **Step 1: Write the migration**

Create `supabase/schema-3.1.sql`:

```sql
-- Speaking answer editor: structured rows for the four free-text sections.
-- Old text values are wrapped into single-row arrays (Sentence Patterns splits
-- on newlines). Matches the existing jsonb array convention on this table.

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
         ELSE COALESCE(
           (SELECT jsonb_agg(jsonb_build_object('sentence', l, 'meaning', '', 'example', ''))
            FROM unnest(string_to_array(sentence_patterns, E'\n')) AS l
            WHERE btrim(l) <> ''),
           '[]'::jsonb) END),
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
```

- [ ] **Step 2: Apply it and verify**

Run:
```bash
docker exec -i supabase_db_IELTS_Web psql -U postgres -d postgres < supabase/schema-3.1.sql
docker exec -i supabase_db_IELTS_Web psql -U postgres -d postgres -c \
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='speaking_answers' AND column_name IN ('synonyms_paraphrasing','referencing_devices','sentence_patterns','grammar_focus') ORDER BY column_name;"
```
Expected: all four rows report `jsonb`. Then sanity-check one migrated row:
```bash
docker exec -i supabase_db_IELTS_Web psql -U postgres -d postgres -c \
  "SELECT sentence_patterns, grammar_focus FROM speaking_answers LIMIT 1;"
```
Expected: `sentence_patterns`/`grammar_focus` come back as JSON arrays (not plain text).

---

### Task 2: Types — new item shapes + `SpeakingAnswer`

**Files:**
- Modify: `src/lib/types.ts`

**Interfaces:**
- Consumes: nothing (new exported types).
- Produces: `SentencePatternItem`, `GrammarFocusItem`, `SynonymItem`, `ReferencingItem`; `SpeakingAnswer`'s four fields become arrays of these.

- [ ] **Step 1: Add the item types**

In `src/lib/types.ts`, in the Grammar Notes section (near `LinkingWordItem`), add:

```ts
export type SynonymItem = {
  vocabulary: string;
  replacement: string;
};

export type ReferencingItem = {
  phrase: string;
  replacement: string;
};

export type SentencePatternItem = {
  sentence: string;
  meaning: string;
  example: string;
};

export type GrammarFocusItem = {
  grammar: string;
  example: string;
};
```

- [ ] **Step 2: Update `SpeakingAnswer`**

Replace the four field lines in `SpeakingAnswer`:

```ts
  synonyms_paraphrasing: SynonymItem[];
  referencing_devices: ReferencingItem[];
  sentence_patterns: SentencePatternItem[];
  grammar_focus: GrammarFocusItem[];
```

- [ ] **Step 3: Verify**

Run:
```bash
~/.local/bin/node ./node_modules/typescript/bin/tsc -p tsconfig.json --noEmit && echo TSC_OK
```
Expected: `TSC_OK`.

---

### Task 3: Validation — zod schemas for the new shapes

**Files:**
- Modify: `src/lib/speaking/notebook-validation.ts`

**Interfaces:**
- Consumes: the item shapes from Task 2 (via zod infer on `AnswerInput`).
- Produces: `AnswerInput`'s four fields are now validated arrays with `min(1)` and all fields required.

- [ ] **Step 1: Add the schemas**

In `src/lib/speaking/notebook-validation.ts`, after `linkingWordSchema`:

```ts
export const synonymSchema = z.object({
  vocabulary: requiredText,
  replacement: requiredText,
});

export const referencingSchema = z.object({
  phrase: requiredText,
  replacement: requiredText,
});

export const sentencePatternSchema = z.object({
  sentence: requiredText,
  meaning: requiredText,
  example: requiredText,
});

export const grammarFocusSchema = z.object({
  grammar: requiredText,
  example: requiredText,
});
```

- [ ] **Step 2: Update `answerInputSchema`**

Replace the four lines in `answerInputSchema`:

```ts
  synonyms_paraphrasing: z.array(synonymSchema).min(1),
  referencing_devices: z.array(referencingSchema).min(1),
  sentence_patterns: z.array(sentencePatternSchema).min(1),
  grammar_focus: z.array(grammarFocusSchema).min(1),
```

- [ ] **Step 3: Verify**

Run:
```bash
~/.local/bin/node ./node_modules/typescript/bin/tsc -p tsconfig.json --noEmit && echo TSC_OK
~/.local/bin/node ./node_modules/eslint/bin/eslint.js src/lib/speaking/notebook-validation.ts && echo LINT_OK
```
Expected: `TSC_OK` and `LINT_OK`.

---

### Task 4: Editor — structured rows UI

**Files:**
- Modify: `src/components/speaking/speaking-answer-editor.tsx`

**Interfaces:**
- Consumes: `SpeakingAnswer` item shapes (Task 2), `AnswerInput` (Task 3), existing `rows`/`StructuredRows`.
- Produces: the editor renders 2-field rows for Grammar Focus / Synonyms / Referencing and 3-field rows for Sentence Patterns, and submits the new array shapes.

- [ ] **Step 1: Add a 3-field row component + helper**

After the `StructuredRows` component, add:

```tsx
type StructuredTriple = { primary: string; secondary: string; tertiary: string };

function StructuredTripleRows({
  label,
  primaryLabel,
  secondaryLabel,
  tertiaryLabel,
  values,
  onChange,
}: {
  label: string;
  primaryLabel: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  values: StructuredTriple[];
  onChange: (values: StructuredTriple[]) => void;
}) {
  function update(index: number, key: keyof StructuredTriple, value: string) {
    onChange(
      values.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row
      )
    );
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-[var(--color-ink)]">{label}</legend>
      {values.map((row, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <input
            value={row.primary}
            onChange={(event) => update(index, "primary", event.target.value)}
            placeholder={primaryLabel}
            aria-label={`${label} ${primaryLabel} ${index + 1}`}
            required
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <input
            value={row.secondary}
            onChange={(event) => update(index, "secondary", event.target.value)}
            placeholder={secondaryLabel}
            aria-label={`${label} ${secondaryLabel} ${index + 1}`}
            required
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <input
            value={row.tertiary}
            onChange={(event) => update(index, "tertiary", event.target.value)}
            placeholder={tertiaryLabel}
            aria-label={`${label} ${tertiaryLabel} ${index + 1}`}
            required
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <button
            type="button"
            onClick={() => onChange(values.filter((_, rowIndex) => rowIndex !== index))}
            disabled={values.length === 1}
            aria-label={`Remove ${label} item ${index + 1}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-ink-muted)] hover:text-[var(--color-critical)] disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...values, { primary: "", secondary: "", tertiary: "" }])
        }
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </fieldset>
  );
}

function tripleRows(
  items: SpeakingAnswer["sentence_patterns"] | undefined
): StructuredTriple[] {
  return items?.length
    ? items.map((item) => ({
        primary: item.sentence,
        secondary: item.meaning,
        tertiary: item.example,
      }))
    : [{ primary: "", secondary: "", tertiary: "" }];
}
```

- [ ] **Step 2: Convert the four state variables**

Replace the four lines:

```tsx
  const [synonyms, setSynonyms] = useState(() => rows(initialAnswer?.synonyms_paraphrasing, (item) => item.vocabulary, (item) => item.replacement));
  const [referencing, setReferencing] = useState(() => rows(initialAnswer?.referencing_devices, (item) => item.phrase, (item) => item.replacement));
  const [patterns, setPatterns] = useState(() => tripleRows(initialAnswer?.sentence_patterns));
  const [grammar, setGrammar] = useState(() => rows(initialAnswer?.grammar_focus, (item) => item.grammar, (item) => item.example));
```

(Delete the old `const [synonyms, setSynonyms] = useState(initialAnswer?.synonyms_paraphrasing ?? "");` and the three similar lines.)

- [ ] **Step 3: Update the submit mapping**

In `submit`, replace the four lines:

```ts
          synonyms_paraphrasing: synonyms.map((item) => ({ vocabulary: item.primary, replacement: item.secondary })),
          referencing_devices: referencing.map((item) => ({ phrase: item.primary, replacement: item.secondary })),
          sentence_patterns: patterns.map((item) => ({ sentence: item.primary, meaning: item.secondary, example: item.tertiary })),
          grammar_focus: grammar.map((item) => ({ grammar: item.primary, example: item.secondary })),
```

- [ ] **Step 4: Replace the four textareas in the JSX**

In the "Lexical Resource" section, replace the Synonyms textarea with:

```tsx
        <StructuredRows label="Synonyms & Paraphrasing" primaryLabel="Vocabulary" secondaryLabel="Replacement" values={synonyms} onChange={setSynonyms} />
```

In the "Coherence & Grammar" section, replace the three textareas with:

```tsx
        <StructuredRows label="Referencing Devices" primaryLabel="Phrase" secondaryLabel="Replacement phrase/sentence" values={referencing} onChange={setReferencing} />
        <StructuredTripleRows label="Sentence Patterns" primaryLabel="Pattern" secondaryLabel="Meaning" tertiaryLabel="Example" values={patterns} onChange={setPatterns} />
        <StructuredRows label="Grammar Focus" primaryLabel="Grammar" secondaryLabel="Example" values={grammar} onChange={setGrammar} />
```

- [ ] **Step 5: Verify**

Run:
```bash
~/.local/bin/node ./node_modules/typescript/bin/tsc -p tsconfig.json --noEmit && echo TSC_OK
~/.local/bin/node ./node_modules/eslint/bin/eslint.js src/components/speaking/speaking-answer-editor.tsx && echo LINT_OK
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/speaking; echo
```
Expected: `TSC_OK`, `LINT_OK`, HTTP `200` (the speaking list still compiles/renders).

---

### Task 5: Actions — adapt grammar-note creation

**Files:**
- Modify: `src/app/(app)/speaking/notebook-actions.ts`

**Interfaces:**
- Consumes: `AnswerInput` (Task 3) — `input.grammar_focus`, `input.sentence_patterns` are now arrays.
- Produces: `createDerivedLearningItems` writes `grammar_notes.rule` = joined grammar names and `correct_examples` = the pattern sentences.

- [ ] **Step 1: Update the grammar note block**

In `createDerivedLearningItems`, replace the block (currently starting at `const { data: existingGrammar, ...`):

```ts
  const grammarRule = input.grammar_focus.map((item) => item.grammar).join(", ");
  const patternExamples = input.sentence_patterns.map((item) => item.sentence);

  const { data: existingGrammar, error: grammarReadError } = await supabase
    .from("grammar_notes")
    .select("rule")
    .eq("user_id", userId);
  if (grammarReadError) throw grammarReadError;
  const grammarExists = (existingGrammar ?? []).some(
    (item) => normalizeLearningItem(item.rule) === normalizeLearningItem(grammarRule),
  );
  const newGrammarCount = grammarExists ? 0 : 1;
  if (!grammarExists) {
    const { error } = await supabase.from("grammar_notes").insert({
      user_id: userId,
      category: "speaking_patterns",
      rule: grammarRule,
      correct_examples: patternExamples,
      common_mistakes: [],
      source,
      mastery_level: 0,
    });
    if (error) throw error;
  }
```

- [ ] **Step 2: Verify**

Run:
```bash
~/.local/bin/node ./node_modules/typescript/bin/tsc -p tsconfig.json --noEmit && echo TSC_OK
~/.local/bin/node ./node_modules/eslint/bin/eslint.js src/app/\(app\)/speaking/notebook-actions.ts && echo LINT_OK
```
Expected: `TSC_OK` and `LINT_OK`.

---

### Task 6: End-to-end verification

**Files:**
- None (runtime check).

**Interfaces:**
- Consumes: everything from Tasks 1–5.

- [ ] **Step 1: Confirm `part1-notebook.tsx` compiles with the new types**

It passes these fields through unchanged, so it should need no edit — but it must still type-check:

```bash
~/.local/bin/node ./node_modules/typescript/bin/tsc -p tsconfig.json --noEmit && echo TSC_OK
~/.local/bin/node ./node_modules/eslint/bin/eslint.js src/components/speaking/part1-notebook.tsx src/app/\(app\)/speaking/new/page.tsx && echo LINT_OK
```
Expected: `TSC_OK` and `LINT_OK`.

- [ ] **Step 2: Manual smoke test (logged-in)**

With the dev server running:
1. Open a speaking record with an answer, edit the answer — the four sections show rows instead of textareas; Sentence Patterns has three fields per row; the others have two.
2. Add rows, fill them, Save. The record reloads with the rows persisted.
3. Check the DB:
   ```bash
   docker exec -i supabase_db_IELTS_Web psql -U postgres -d postgres -c \
     "SELECT sentence_patterns, grammar_focus FROM speaking_answers ORDER BY updated_at DESC LIMIT 1;"
   ```
   Expected: arrays in the new shapes (e.g. `[{"sentence":"...","meaning":"...","example":"..."}]`).
4. In the Grammar page (`/grammar`), confirm a note was created with `rule` = the joined grammar names and `correct_examples` = the pattern sentences.
5. New-record flow: create a new speaking record with draft answers, submit — no validation errors; the same structured shapes persist.

---

## Cross-task reference (signatures)

| Symbol | Defined in | Consumed by |
|---|---|---|
| `speaking_answers.<4 fields> :: jsonb[]` | Task 1 | Tasks 2, 6 |
| `SynonymItem`, `ReferencingItem`, `SentencePatternItem`, `GrammarFocusItem` | Task 2 | Tasks 3, 4 |
| `SpeakingAnswer.<4 fields> : Item[]` | Task 2 | Tasks 4, 6 |
| `synonymSchema`, `referencingSchema`, `sentencePatternSchema`, `grammarFocusSchema` | Task 3 | Task 3 (`answerInputSchema`) |
| `AnswerInput.<4 fields> : array` | Task 3 | Tasks 4, 5 |
| `StructuredTripleRows`, `tripleRows` | Task 4 | Task 4 |
| `grammarRule` / `patternExamples` in `createDerivedLearningItems` | Task 5 | `grammar_notes` writes |
