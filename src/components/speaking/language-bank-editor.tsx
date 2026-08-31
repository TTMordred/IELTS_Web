"use client";

import { Plus, Trash2 } from "lucide-react";
import type {
  DiscussionDevice,
  GrammarFocusItem,
  LanguageBank,
  LinkingWordItem,
  PhraseMeaningItem,
  ReferencingItem,
  SentencePatternItem,
  StorytellingDevice,
  SynonymItem,
  WordMeaningItem,
} from "@/lib/types";
import type { StructuredTriple } from "./speaking-answer-editor";

/**
 * Row editor like StructuredTripleRows but with an OPTIONAL third field — used
 * where a third field is a nice-to-have (e.g. Storytelling Devices' example).
 */
export function OptionalTripleRows({
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
    onChange(values.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-[var(--color-ink)]">{label}</legend>
      {values.map((row, index) => (
        <div key={index} className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={row.primary}
              onChange={(event) => update(index, "primary", event.target.value)}
              placeholder={primaryLabel}
              aria-label={`${label} ${primaryLabel} ${index + 1}`}
              required
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <input
              value={row.secondary}
              onChange={(event) => update(index, "secondary", event.target.value)}
              placeholder={secondaryLabel}
              aria-label={`${label} ${secondaryLabel} ${index + 1}`}
              required
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
          <input
            value={row.tertiary}
            onChange={(event) => update(index, "tertiary", event.target.value)}
            placeholder={tertiaryLabel}
            aria-label={`${label} ${tertiaryLabel} ${index + 1}`}
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, { primary: "", secondary: "", tertiary: "" }])}
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </fieldset>
  );
}

/**
 * Two-column row in Part 1's style: a required term plus its required meaning /
 * function. Operates on StructuredTriple[] so the shared LanguageBankTriples
 * state and draft-autosave shape stay unchanged — the third field is simply not
 * shown (older Vietnamese glosses still round-trip through the mapping).
 */
function LanguageBankRow({
  label,
  primaryLabel,
  secondaryLabel,
  values,
  onChange,
}: {
  label: string;
  primaryLabel: string;
  secondaryLabel: string;
  values: StructuredTriple[];
  onChange: (values: StructuredTriple[]) => void;
}) {
  function update(index: number, key: "primary" | "secondary", value: string) {
    onChange(values.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-[var(--color-ink)]">{label}</legend>
      {values.map((row, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={row.primary}
            onChange={(event) => update(index, "primary", event.target.value)}
            placeholder={primaryLabel}
            aria-label={`${label} ${primaryLabel} ${index + 1}`}
            required
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <input
            value={row.secondary}
            onChange={(event) => update(index, "secondary", event.target.value)}
            placeholder={secondaryLabel}
            aria-label={`${label} ${secondaryLabel} ${index + 1}`}
            required
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
        onClick={() => onChange([...values, { primary: "", secondary: "", tertiary: "" }])}
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </fieldset>
  );
}

// ── Item ↔ triple mapping helpers ────────────────────────────────────────────
export const wordToTriple = (item: WordMeaningItem): StructuredTriple => ({
  primary: item.word, secondary: item.meaning, tertiary: item.meaningVi ?? "",
});
export const tripleToWord = (t: StructuredTriple): WordMeaningItem => ({
  word: t.primary, meaning: t.secondary, meaningVi: t.tertiary || undefined,
});
export const phraseToTriple = (item: PhraseMeaningItem): StructuredTriple => ({
  primary: item.phrase, secondary: item.meaning, tertiary: item.meaningVi ?? "",
});
export const tripleToPhrase = (t: StructuredTriple): PhraseMeaningItem => ({
  phrase: t.primary, meaning: t.secondary, meaningVi: t.tertiary || undefined,
});
export const linkingToTriple = (item: LinkingWordItem): StructuredTriple => ({
  primary: item.word, secondary: item.function, tertiary: item.meaningVi ?? "",
});
export const tripleToLinking = (t: StructuredTriple): LinkingWordItem => ({
  word: t.primary, function: t.secondary, meaningVi: t.tertiary || undefined,
});
export const synonymToTriple = (item: SynonymItem): StructuredTriple => ({
  primary: item.vocabulary, secondary: item.replacement, tertiary: item.meaningVi ?? "",
});
export const tripleToSynonym = (t: StructuredTriple): SynonymItem => ({
  vocabulary: t.primary, replacement: t.secondary, meaningVi: t.tertiary || undefined,
});
export const referencingToTriple = (item: ReferencingItem): StructuredTriple => ({
  primary: item.phrase, secondary: item.replacement, tertiary: item.meaningVi ?? "",
});
export const tripleToReferencing = (t: StructuredTriple): ReferencingItem => ({
  phrase: t.primary, replacement: t.secondary, meaningVi: t.tertiary || undefined,
});
export const patternToTriple = (item: SentencePatternItem): StructuredTriple => ({
  primary: item.sentence, secondary: item.meaning, tertiary: item.example,
});
export const tripleToPattern = (t: StructuredTriple): SentencePatternItem => ({
  sentence: t.primary, meaning: t.secondary, example: t.tertiary,
});
export const grammarToTriple = (item: GrammarFocusItem): StructuredTriple => ({
  primary: item.grammar, secondary: item.example, tertiary: item.meaningVi ?? "",
});
export const tripleToGrammar = (t: StructuredTriple): GrammarFocusItem => ({
  grammar: t.primary, example: t.secondary, meaningVi: t.tertiary || undefined,
});
export const storytellingToTriple = (item: StorytellingDevice): StructuredTriple => ({
  primary: item.expression, secondary: item.meaningVi, tertiary: item.example ?? "",
});
export const tripleToStorytelling = (t: StructuredTriple): StorytellingDevice => ({
  expression: t.primary, meaningVi: t.secondary, example: t.tertiary || undefined,
});
export const discussionToTriple = (item: DiscussionDevice): StructuredTriple => ({
  primary: item.expression, secondary: item.meaningVi, tertiary: item.example ?? "",
});
export const tripleToDiscussion = (t: StructuredTriple): DiscussionDevice => ({
  expression: t.primary, meaningVi: t.secondary, example: t.tertiary || undefined,
});

export function triplesFrom<T>(items: T[] | undefined, mapper: (item: T) => StructuredTriple): StructuredTriple[] {
  return items?.length ? items.map(mapper) : [{ primary: "", secondary: "", tertiary: "" }];
}

export function cleanTriples(triples: StructuredTriple[]): StructuredTriple[] {
  return triples.filter((row) => row.primary.trim() !== "");
}

export function cleanStrings(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

// ── The full 10-section Language Bank block ──────────────────────────────────
export type LanguageBankTriples = {
  topicVocab: StructuredTriple[];
  usefulVocab: StructuredTriple[];
  advancedVocab: StructuredTriple[];
  idioms: StructuredTriple[];
  collocations: StructuredTriple[];
  linkingWords: StructuredTriple[];
  synonyms: StructuredTriple[];
  referencing: StructuredTriple[];
  patterns: StructuredTriple[];
  grammar: StructuredTriple[];
};

export function emptyLanguageBankTriples(): LanguageBankTriples {
  const row = () => [{ primary: "", secondary: "", tertiary: "" }];
  return {
    topicVocab: row(), usefulVocab: row(), advancedVocab: row(), idioms: row(),
    collocations: row(), linkingWords: row(), synonyms: row(), referencing: row(),
    patterns: row(), grammar: row(),
  };
}

/** Initialises the 10 triple lists from a stored Language Bank (empty → one blank row each). */
export function languageBankTriplesFrom(bank: LanguageBank | undefined | null): LanguageBankTriples {
  return {
    topicVocab: triplesFrom(bank?.topic_specific_vocabulary, wordToTriple),
    usefulVocab: triplesFrom(bank?.useful_vocabulary, wordToTriple),
    advancedVocab: triplesFrom(bank?.advanced_adjectives_adverbs, wordToTriple),
    idioms: triplesFrom(bank?.idioms_phrasal_verbs, phraseToTriple),
    collocations: triplesFrom(bank?.collocations, phraseToTriple),
    linkingWords: triplesFrom(bank?.linking_words, linkingToTriple),
    synonyms: triplesFrom(bank?.synonyms_paraphrasing, synonymToTriple),
    referencing: triplesFrom(bank?.referencing_devices, referencingToTriple),
    patterns: triplesFrom(bank?.sentence_patterns, patternToTriple),
    grammar: triplesFrom(bank?.grammar_focus, grammarToTriple),
  };
}

/** Collapses the 10 triple lists back into a Language Bank (empty rows dropped). */
export function languageBankFromTriples(triples: LanguageBankTriples): LanguageBank {
  return {
    topic_specific_vocabulary: cleanTriples(triples.topicVocab).map(tripleToWord),
    useful_vocabulary: cleanTriples(triples.usefulVocab).map(tripleToWord),
    advanced_adjectives_adverbs: cleanTriples(triples.advancedVocab).map(tripleToWord),
    idioms_phrasal_verbs: cleanTriples(triples.idioms).map(tripleToPhrase),
    collocations: cleanTriples(triples.collocations).map(tripleToPhrase),
    linking_words: cleanTriples(triples.linkingWords).map(tripleToLinking),
    synonyms_paraphrasing: cleanTriples(triples.synonyms).map(tripleToSynonym),
    referencing_devices: cleanTriples(triples.referencing).map(tripleToReferencing),
    sentence_patterns: cleanTriples(triples.patterns).map(tripleToPattern),
    grammar_focus: cleanTriples(triples.grammar).map(tripleToGrammar),
  };
}

/**
 * The complete 10-section Language Bank editor in Part 1's style: two-column
 * required rows (word/phrase + meaning) — no Vietnamese gloss column. Parent
 * keeps the 10 triple lists (for draft-autosave compatibility) and bridges them
 * through value/onChange.
 */
export function LanguageBankEditor({
  value,
  onChange,
}: {
  value: LanguageBankTriples;
  onChange: (next: LanguageBankTriples) => void;
}) {
  return (
    <div className="space-y-5 border-t border-[var(--color-line)] pt-5">
      <div>
        <p className="section-label">Language Bank</p>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Capture language worth reusing — the word or phrase plus its meaning.</p>
      </div>
      <p className="section-label">Lexical Resource</p>
      <LanguageBankRow label="Topic-Specific Vocabulary" primaryLabel="Word or phrase" secondaryLabel="Meaning" values={value.topicVocab} onChange={(v) => onChange({ ...value, topicVocab: v })} />
      <LanguageBankRow label="Useful Vocabulary" primaryLabel="Word or phrase" secondaryLabel="Meaning" values={value.usefulVocab} onChange={(v) => onChange({ ...value, usefulVocab: v })} />
      <LanguageBankRow label="Advanced Adjectives/Adverbs" primaryLabel="Word" secondaryLabel="Meaning" values={value.advancedVocab} onChange={(v) => onChange({ ...value, advancedVocab: v })} />
      <LanguageBankRow label="Idioms & Phrasal Verbs" primaryLabel="Phrase" secondaryLabel="Meaning" values={value.idioms} onChange={(v) => onChange({ ...value, idioms: v })} />
      <LanguageBankRow label="Collocations" primaryLabel="Collocation" secondaryLabel="Meaning" values={value.collocations} onChange={(v) => onChange({ ...value, collocations: v })} />
      <LanguageBankRow label="Linking Words" primaryLabel="Word or phrase" secondaryLabel="Function" values={value.linkingWords} onChange={(v) => onChange({ ...value, linkingWords: v })} />
      <LanguageBankRow label="Synonyms & Paraphrasing" primaryLabel="Vocabulary" secondaryLabel="Replacement" values={value.synonyms} onChange={(v) => onChange({ ...value, synonyms: v })} />

      <div className="space-y-5 border-t border-[var(--color-line)] pt-5">
        <p className="section-label">Coherence & Grammar</p>
        <LanguageBankRow label="Referencing Devices" primaryLabel="Phrase" secondaryLabel="Replacement phrase/sentence" values={value.referencing} onChange={(v) => onChange({ ...value, referencing: v })} />
        <OptionalTripleRows label="Sentence Patterns" primaryLabel="Pattern" secondaryLabel="Meaning" tertiaryLabel="Example (optional)" values={value.patterns} onChange={(v) => onChange({ ...value, patterns: v })} />
        <LanguageBankRow label="Grammar Focus" primaryLabel="Grammar" secondaryLabel="Example" values={value.grammar} onChange={(v) => onChange({ ...value, grammar: v })} />
      </div>
    </div>
  );
}
