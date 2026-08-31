"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { saveSpeakingAnswer } from "@/app/(app)/speaking/notebook-actions";
import { useDraftAutosave } from "@/hooks/use-draft-autosave";
import { DraftRestoreBanner, DraftSavedIndicator } from "@/components/ui/draft-status";
import type { SpeakingAnswer } from "@/lib/types";
import type { AnswerInput } from "@/lib/speaking/notebook-validation";

export type StructuredRow = { primary: string; secondary: string };

export function StructuredRows({
  label,
  primaryLabel,
  secondaryLabel,
  values,
  onChange,
}: {
  label: string;
  primaryLabel: string;
  secondaryLabel: string;
  values: StructuredRow[];
  onChange: (values: StructuredRow[]) => void;
}) {
  function update(index: number, key: keyof StructuredRow, value: string) {
    onChange(values.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
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
        onClick={() => onChange([...values, { primary: "", secondary: "" }])}
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </fieldset>
  );
}

export type StructuredTriple = { primary: string; secondary: string; tertiary: string };

export function StructuredTripleRows({
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
        <div key={index} className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
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
            required
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
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

export function tripleRows(
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

export function rows<T>(items: T[] | undefined, primary: (item: T) => string, secondary: (item: T) => string): StructuredRow[] {
  return items?.length ? items.map((item) => ({ primary: primary(item), secondary: secondary(item) })) : [{ primary: "", secondary: "" }];
}

export function RequiredTextarea({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        required
        className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      />
    </label>
  );
}

export function SpeakingAnswerEditor({
  entryQuestionId,
  position,
  initialAnswer,
  onClose,
  onSaved,
  onDraftSave,
}: {
  entryQuestionId?: string;
  position: number;
  initialAnswer?: SpeakingAnswer;
  onClose: () => void;
  onSaved: () => void;
  onDraftSave?: (answer: AnswerInput) => void;
}) {
  const [answerText, setAnswerText] = useState(initialAnswer?.answer_text ?? "");
  const [followUpIdeas, setFollowUpIdeas] = useState(initialAnswer?.follow_up_ideas ?? "");
  const [topicVocab, setTopicVocab] = useState(() => rows(initialAnswer?.topic_specific_vocabulary, (item) => item.word, (item) => item.meaning));
  const [usefulVocab, setUsefulVocab] = useState(() => rows(initialAnswer?.useful_vocabulary, (item) => item.word, (item) => item.meaning));
  const [advancedVocab, setAdvancedVocab] = useState(() => rows(initialAnswer?.advanced_adjectives_adverbs, (item) => item.word, (item) => item.meaning));
  const [idioms, setIdioms] = useState(() => rows(initialAnswer?.idioms_phrasal_verbs, (item) => item.phrase, (item) => item.meaning));
  const [collocations, setCollocations] = useState(() => rows(initialAnswer?.collocations, (item) => item.phrase, (item) => item.meaning));
  const [linkingWords, setLinkingWords] = useState(() => rows(initialAnswer?.linking_words, (item) => item.word, (item) => item.function));
  const [synonyms, setSynonyms] = useState(() => rows(initialAnswer?.synonyms_paraphrasing, (item) => item.vocabulary, (item) => item.replacement));
  const [referencing, setReferencing] = useState(() => rows(initialAnswer?.referencing_devices, (item) => item.phrase, (item) => item.replacement));
  const [patterns, setPatterns] = useState(() => tripleRows(initialAnswer?.sentence_patterns));
  const [grammar, setGrammar] = useState(() => rows(initialAnswer?.grammar_focus, (item) => item.grammar, (item) => item.example));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Google-Forms-style draft autosave
  const draftValue = {
    answerText,
    followUpIdeas,
    topicVocab,
    usefulVocab,
    advancedVocab,
    idioms,
    collocations,
    linkingWords,
    synonyms,
    referencing,
    patterns,
    grammar,
  };
  const draftKey = `speaking-answer:${entryQuestionId ?? "new"}:${initialAnswer?.id ?? "new"}:${position}`;
  const draftAutosave = useDraftAutosave({ key: draftKey, value: draftValue });

  function restoreDraft() {
    const d = draftAutosave.draft;
    if (!d) return;
    setAnswerText(d.answerText ?? "");
    setFollowUpIdeas(d.followUpIdeas ?? "");
    setTopicVocab(d.topicVocab ?? [{ primary: "", secondary: "" }]);
    setUsefulVocab(d.usefulVocab ?? [{ primary: "", secondary: "" }]);
    setAdvancedVocab(d.advancedVocab ?? [{ primary: "", secondary: "" }]);
    setIdioms(d.idioms ?? [{ primary: "", secondary: "" }]);
    setCollocations(d.collocations ?? [{ primary: "", secondary: "" }]);
    setLinkingWords(d.linkingWords ?? [{ primary: "", secondary: "" }]);
    setSynonyms(d.synonyms ?? [{ primary: "", secondary: "" }]);
    setReferencing(d.referencing ?? [{ primary: "", secondary: "" }]);
    setPatterns(d.patterns ?? [{ primary: "", secondary: "", tertiary: "" }]);
    setGrammar(d.grammar ?? [{ primary: "", secondary: "" }]);
    draftAutosave.consumeDraft();
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const answer: AnswerInput = {
          position,
          answer_text: answerText,
          follow_up_ideas: followUpIdeas,
          topic_specific_vocabulary: topicVocab.map((item) => ({ word: item.primary, meaning: item.secondary })),
          useful_vocabulary: usefulVocab.map((item) => ({ word: item.primary, meaning: item.secondary })),
          advanced_adjectives_adverbs: advancedVocab.map((item) => ({ word: item.primary, meaning: item.secondary })),
          idioms_phrasal_verbs: idioms.map((item) => ({ phrase: item.primary, meaning: item.secondary })),
          collocations: collocations.map((item) => ({ phrase: item.primary, meaning: item.secondary })),
          linking_words: linkingWords.map((item) => ({ word: item.primary, function: item.secondary })),
          synonyms_paraphrasing: synonyms.map((item) => ({ vocabulary: item.primary, replacement: item.secondary })),
          referencing_devices: referencing.map((item) => ({ phrase: item.primary, replacement: item.secondary })),
          sentence_patterns: patterns.map((item) => ({ sentence: item.primary, meaning: item.secondary, example: item.tertiary })),
          grammar_focus: grammar.map((item) => ({ grammar: item.primary, example: item.secondary })),
        };
        if (onDraftSave) {
          onDraftSave(answer);
        } else {
          if (!entryQuestionId) throw new Error("Speaking record is required");
          await saveSpeakingAnswer({ id: initialAnswer?.id, entryQuestionId, ...answer });
        }
        draftAutosave.clearDraft();
        onSaved();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to save answer");
      }
    });
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-[var(--color-ink)]">{initialAnswer ? "Edit" : "Add"} Answer {position}</h4>
        <span className="flex items-center gap-3">
          <DraftSavedIndicator status={draftAutosave.status} savedAt={draftAutosave.savedAt} />
          <button type="button" onClick={onClose} aria-label="Close answer editor" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
            <X className="h-4 w-4" />
          </button>
        </span>
      </div>

      {draftAutosave.showRestore && (
        <DraftRestoreBanner savedAt={draftAutosave.savedAt} onRestore={restoreDraft} onDismiss={draftAutosave.clearDraft} />
      )}

      {error ? <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[var(--color-critical)]">{error}</p> : null}

      <RequiredTextarea label="Answer" value={answerText} onChange={setAnswerText} placeholder="Write a complete answer variant..." />
      <RequiredTextarea label="Follow-up Ideas" value={followUpIdeas} onChange={setFollowUpIdeas} placeholder="Add possible follow-up ideas..." />

      <div className="space-y-5 border-t border-[var(--color-line)] pt-5">
        <p className="section-label">Lexical Resource</p>
        <StructuredRows label="Topic-Specific Vocabulary" primaryLabel="Word or phrase" secondaryLabel="Meaning" values={topicVocab} onChange={setTopicVocab} />
        <StructuredRows label="Useful Vocabulary" primaryLabel="Word or phrase" secondaryLabel="Meaning" values={usefulVocab} onChange={setUsefulVocab} />
        <StructuredRows label="Advanced Adjectives/Adverbs" primaryLabel="Word" secondaryLabel="Meaning" values={advancedVocab} onChange={setAdvancedVocab} />
        <StructuredRows label="Idioms & Phrasal Verbs" primaryLabel="Phrase" secondaryLabel="Meaning" values={idioms} onChange={setIdioms} />
        <StructuredRows label="Collocations" primaryLabel="Collocation" secondaryLabel="Meaning" values={collocations} onChange={setCollocations} />
        <StructuredRows label="Linking Words" primaryLabel="Word or phrase" secondaryLabel="Function" values={linkingWords} onChange={setLinkingWords} />
        <StructuredRows label="Synonyms & Paraphrasing" primaryLabel="Vocabulary" secondaryLabel="Replacement" values={synonyms} onChange={setSynonyms} />
      </div>

      <div className="space-y-5 border-t border-[var(--color-line)] pt-5">
        <p className="section-label">Coherence & Grammar</p>
        <StructuredRows label="Referencing Devices" primaryLabel="Phrase" secondaryLabel="Replacement phrase/sentence" values={referencing} onChange={setReferencing} />
        <StructuredTripleRows label="Sentence Patterns" primaryLabel="Pattern" secondaryLabel="Meaning" tertiaryLabel="Example" values={patterns} onChange={setPatterns} />
        <StructuredRows label="Grammar Focus" primaryLabel="Grammar" secondaryLabel="Example" values={grammar} onChange={setGrammar} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink-secondary)]">Cancel</button>
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "Saving..." : "Save Answer"}
        </button>
      </div>
    </form>
  );
}
