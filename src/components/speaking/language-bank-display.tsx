"use client";

import type { LanguageBank, SpeakingAnswer } from "@/lib/types";

type Row = { primary: string; secondary: string; tertiary?: string };

const EMPTY: LanguageBank = {
  topic_specific_vocabulary: [],
  useful_vocabulary: [],
  advanced_adjectives_adverbs: [],
  idioms_phrasal_verbs: [],
  collocations: [],
  linking_words: [],
  synonyms_paraphrasing: [],
  referencing_devices: [],
  sentence_patterns: [],
  grammar_focus: [],
};

const SECTIONS: { label: string; rows: (bank: LanguageBank) => Row[] }[] = [
  { label: "Topic-Specific Vocabulary", rows: (b) => b.topic_specific_vocabulary.map((i) => ({ primary: i.word, secondary: i.meaning })) },
  { label: "Useful Vocabulary", rows: (b) => b.useful_vocabulary.map((i) => ({ primary: i.word, secondary: i.meaning })) },
  { label: "Advanced Adjectives/Adverbs", rows: (b) => b.advanced_adjectives_adverbs.map((i) => ({ primary: i.word, secondary: i.meaning })) },
  { label: "Idioms & Phrasal Verbs", rows: (b) => b.idioms_phrasal_verbs.map((i) => ({ primary: i.phrase, secondary: i.meaning })) },
  { label: "Collocations", rows: (b) => b.collocations.map((i) => ({ primary: i.phrase, secondary: i.meaning })) },
  { label: "Linking Words", rows: (b) => b.linking_words.map((i) => ({ primary: i.word, secondary: i.function })) },
  { label: "Synonyms & Paraphrasing", rows: (b) => b.synonyms_paraphrasing.map((i) => ({ primary: i.vocabulary, secondary: i.replacement })) },
  { label: "Referencing Devices", rows: (b) => b.referencing_devices.map((i) => ({ primary: i.phrase, secondary: i.replacement })) },
  { label: "Sentence Patterns", rows: (b) => b.sentence_patterns.map((i) => ({ primary: i.sentence, secondary: i.meaning, tertiary: i.example })) },
  { label: "Grammar Focus", rows: (b) => b.grammar_focus.map((i) => ({ primary: i.grammar, secondary: i.example })) },
];

/** Builds a LanguageBank from a Part 1 answer's per-answer columns. */
export function answerLanguageBank(answer: SpeakingAnswer): LanguageBank {
  return {
    topic_specific_vocabulary: answer.topic_specific_vocabulary ?? [],
    useful_vocabulary: answer.useful_vocabulary ?? [],
    advanced_adjectives_adverbs: answer.advanced_adjectives_adverbs ?? [],
    idioms_phrasal_verbs: answer.idioms_phrasal_verbs ?? [],
    collocations: answer.collocations ?? [],
    linking_words: answer.linking_words ?? [],
    synonyms_paraphrasing: answer.synonyms_paraphrasing ?? [],
    referencing_devices: answer.referencing_devices ?? [],
    sentence_patterns: answer.sentence_patterns ?? [],
    grammar_focus: answer.grammar_focus ?? [],
  };
}

/**
 * Read-only Language Bank display — renders only the non-empty sections, each as
 * "primary — secondary" rows. Shared by the Part 1/2/3 notebooks so the language
 * recorded in the editor is visible when reviewing a record.
 */
export function LanguageBankDisplay({
  bank,
  className,
}: {
  bank: LanguageBank;
  className?: string;
}) {
  const visible = SECTIONS.map((section) => ({
    label: section.label,
    rows: section.rows(bank ?? EMPTY),
  })).filter((section) => section.rows.length > 0);

  if (visible.length === 0) return null;

  return (
    <div className={`rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm ${className ?? ""}`}>
      <p className="section-label text-[var(--color-accent)]">Language Bank</p>
      <div className="mt-2 space-y-3">
        {visible.map((section) => (
          <div key={section.label}>
            <p className="text-xs font-medium text-[var(--color-ink)]">{section.label}</p>
            <ul className="mt-1 space-y-1 text-[var(--color-ink-secondary)]">
              {section.rows.map((row, index) => (
                <li key={index}>
                  <span className="font-medium text-[var(--color-ink)]">{row.primary}</span>
                  <span className="text-[var(--color-ink-muted)]"> — {row.secondary}</span>
                  {row.tertiary ? (
                    <span className="block text-xs text-[var(--color-ink-muted)]">e.g. {row.tertiary}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
