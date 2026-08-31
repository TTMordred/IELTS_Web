"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, X } from "lucide-react";
import { savePart2Card } from "@/app/(app)/speaking/part2-actions";
import { useDraftAutosave } from "@/hooks/use-draft-autosave";
import { DraftRestoreBanner, DraftSavedIndicator } from "@/components/ui/draft-status";
import { RequiredTextarea, type StructuredTriple } from "./speaking-answer-editor";
import { StringListEditor } from "./string-list-editor";
import {
  CUE_CARD_TYPES,
  CUE_CARD_TYPE_LABELS,
  DEFAULT_ANSWER_STRUCTURE,
} from "@/lib/constants/speaking-cue-card";
import type { Part2CardDraft } from "@/lib/speaking/part2-validation";
import type { CueCardType, SpeakingPart2Card } from "@/lib/types";
import {
  LanguageBankEditor,
  OptionalTripleRows,
  cleanStrings,
  cleanTriples,
  languageBankFromTriples,
  languageBankTriplesFrom,
  storytellingToTriple,
  tripleToStorytelling,
  triplesFrom,
} from "./language-bank-editor";

export function SpeakingPart2CardEditor({
  entryId,
  initialCard,
  initialDraft,
  position,
  onClose,
  onSaved,
  onDraftSave,
}: {
  entryId?: string;
  initialCard?: SpeakingPart2Card;
  initialDraft?: Part2CardDraft;
  position: number;
  onClose: () => void;
  onSaved: () => void;
  onDraftSave?: (card: Part2CardDraft) => void;
}) {
  const source = initialCard ?? initialDraft;

  const [answerText, setAnswerText] = useState(source?.answer ?? "");
  const [cardType, setCardType] = useState<CueCardType>(source?.cue_card_type ?? "Experience");
  const [topic, setTopic] = useState(source?.topic ?? "");
  const [structure, setStructure] = useState<string[]>(
    source?.answer_structure.length ? source.answer_structure : DEFAULT_ANSWER_STRUCTURE[source?.cue_card_type ?? "Experience"],
  );
  const [keyIdeas, setKeyIdeas] = useState<string[]>(source?.key_ideas.length ? source.key_ideas : [""]);
  const [followUps, setFollowUps] = useState<string[]>(source?.follow_up_ideas.length ? source.follow_up_ideas : [""]);
  const [storytelling, setStorytelling] = useState<StructuredTriple[]>(triplesFrom(source?.storytelling_devices, storytellingToTriple));
  const [lbInitial] = useState(() => languageBankTriplesFrom(source?.language_bank));
  const [topicVocab, setTopicVocab] = useState<StructuredTriple[]>(lbInitial.topicVocab);
  const [usefulVocab, setUsefulVocab] = useState<StructuredTriple[]>(lbInitial.usefulVocab);
  const [advancedVocab, setAdvancedVocab] = useState<StructuredTriple[]>(lbInitial.advancedVocab);
  const [idioms, setIdioms] = useState<StructuredTriple[]>(lbInitial.idioms);
  const [collocations, setCollocations] = useState<StructuredTriple[]>(lbInitial.collocations);
  const [linkingWords, setLinkingWords] = useState<StructuredTriple[]>(lbInitial.linkingWords);
  const [synonyms, setSynonyms] = useState<StructuredTriple[]>(lbInitial.synonyms);
  const [referencing, setReferencing] = useState<StructuredTriple[]>(lbInitial.referencing);
  const [patterns, setPatterns] = useState<StructuredTriple[]>(lbInitial.patterns);
  const [grammar, setGrammar] = useState<StructuredTriple[]>(lbInitial.grammar);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const draftValue = {
    answerText, cardType, topic, structure, keyIdeas, followUps,
    storytelling, topicVocab, usefulVocab, advancedVocab, idioms, collocations,
    linkingWords, synonyms, referencing, patterns, grammar,
  };
  const draftKey = `speaking-part2:${entryId ?? "new"}:${initialCard?.id ?? initialDraft?.id ?? "new"}`;
  const draftAutosave = useDraftAutosave({ key: draftKey, value: draftValue });

  function restoreDraft() {
    const d = draftAutosave.draft;
    if (!d) return;
    setAnswerText(d.answerText ?? "");
    setCardType(d.cardType ?? "Experience");
    setTopic(d.topic ?? "");
    setStructure(d.structure ?? DEFAULT_ANSWER_STRUCTURE[cardType]);
    setKeyIdeas(d.keyIdeas ?? [""]);
    setFollowUps(d.followUps ?? [""]);
    setStorytelling(d.storytelling ?? [{ primary: "", secondary: "", tertiary: "" }]);
    setTopicVocab(d.topicVocab ?? [{ primary: "", secondary: "", tertiary: "" }]);
    setUsefulVocab(d.usefulVocab ?? [{ primary: "", secondary: "", tertiary: "" }]);
    setAdvancedVocab(d.advancedVocab ?? [{ primary: "", secondary: "", tertiary: "" }]);
    setIdioms(d.idioms ?? [{ primary: "", secondary: "", tertiary: "" }]);
    setCollocations(d.collocations ?? [{ primary: "", secondary: "", tertiary: "" }]);
    setLinkingWords(d.linkingWords ?? [{ primary: "", secondary: "", tertiary: "" }]);
    setSynonyms(d.synonyms ?? [{ primary: "", secondary: "", tertiary: "" }]);
    setReferencing(d.referencing ?? [{ primary: "", secondary: "", tertiary: "" }]);
    setPatterns(d.patterns ?? [{ primary: "", secondary: "", tertiary: "" }]);
    setGrammar(d.grammar ?? [{ primary: "", secondary: "", tertiary: "" }]);
    draftAutosave.consumeDraft();
  }

  function changeType(next: CueCardType) {
    const previousDefault = DEFAULT_ANSWER_STRUCTURE[cardType];
    const isUncustomized =
      structure.length === previousDefault.length &&
      structure.every((step, index) => step === previousDefault[index]);
    setCardType(next);
    // Re-seed the structure only when the user hasn't customised it.
    if (isUncustomized) setStructure(DEFAULT_ANSWER_STRUCTURE[next]);
  }

  function buildDraft(): Part2CardDraft {
    const languageBank = languageBankFromTriples({
      topicVocab, usefulVocab, advancedVocab, idioms, collocations,
      linkingWords, synonyms, referencing, patterns, grammar,
    });
    return {
      id: initialDraft?.id ?? crypto.randomUUID(),
      topicId: initialCard?.topic_id ?? initialDraft?.topicId ?? null,
      // The cue card text is fixed (chosen from the Topic Bank); it's displayed
      // in the notebook header, so the editor doesn't allow editing it.
      cue_card: source?.cue_card ?? "",
      cue_card_type: cardType,
      topic: topic.trim() || "",
      answer_structure: cleanStrings(structure),
      key_ideas: cleanStrings(keyIdeas),
      answer: answerText.trim(),
      follow_up_ideas: cleanStrings(followUps),
      storytelling_devices: cleanTriples(storytelling).map(tripleToStorytelling),
      language_bank: languageBank,
    };
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const draft = buildDraft();
        if (onDraftSave) {
          onDraftSave(draft);
        } else {
          if (!entryId || !initialCard?.id) throw new Error("Speaking record is required");
          await savePart2Card({
            entryId,
            id: initialCard.id,
            topicId: draft.topicId,
            cue_card: draft.cue_card,
            cue_card_type: draft.cue_card_type,
            topic: draft.topic,
            answer_structure: draft.answer_structure,
            key_ideas: draft.key_ideas,
            answer: draft.answer,
            follow_up_ideas: draft.follow_up_ideas,
            storytelling_devices: draft.storytelling_devices,
            language_bank: draft.language_bank,
          });
        }
        draftAutosave.clearDraft();
        onSaved();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to save cue card");
      }
    });
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-[var(--color-ink)]">{initialCard || initialDraft ? "Edit" : "Add"} Cue Card {position}</h4>
        <span className="flex items-center gap-3">
          <DraftSavedIndicator status={draftAutosave.status} savedAt={draftAutosave.savedAt} />
          <button type="button" onClick={onClose} aria-label="Close cue card editor" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
            <X className="h-4 w-4" />
          </button>
        </span>
      </div>

      {draftAutosave.showRestore && (
        <DraftRestoreBanner savedAt={draftAutosave.savedAt} onRestore={restoreDraft} onDismiss={draftAutosave.clearDraft} />
      )}

      {error ? <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[var(--color-critical)]">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--color-ink)]">Cue Card Type</span>
          <select
            value={cardType}
            onChange={(event) => changeType(event.target.value as CueCardType)}
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          >
            {CUE_CARD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <p className="text-xs text-[var(--color-ink-muted)]">{CUE_CARD_TYPE_LABELS[cardType]}</p>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--color-ink)]">Topic</span>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. Travel, Technology, Helping Others"
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </label>
      </div>

      <div className="space-y-5 border-t border-[var(--color-line)] pt-5">
        <p className="section-label">Planning & Storytelling</p>
        <StringListEditor label="Answer Structure" placeholder="e.g. Introduction, What it is, Why it matters" values={structure} onChange={setStructure} />
        <StringListEditor label="Key Ideas / Outline" placeholder="Concise keyword or idea (not a full sentence)…" values={keyIdeas} onChange={setKeyIdeas} />
        <RequiredTextarea label="Answer" value={answerText} onChange={setAnswerText} placeholder="Write the full sample Part 2 answer (talk for about 2 minutes)…" />
        <StringListEditor label="Follow-up / Expansion Ideas" placeholder="Ideas to extend, personalise or replace details…" values={followUps} onChange={setFollowUps} />
        <OptionalTripleRows
          label="Storytelling Devices"
          primaryLabel="Expression"
          secondaryLabel="Nghĩa tiếng Việt"
          tertiaryLabel="Example (optional)"
          values={storytelling}
          onChange={setStorytelling}
        />
        <p className="text-xs text-[var(--color-ink-muted)]">e.g. &ldquo;I still remember one time when&hellip;&rdquo; → Tôi vẫn nhớ có một lần&hellip;</p>
      </div>

      <LanguageBankEditor
        value={{ topicVocab, usefulVocab, advancedVocab, idioms, collocations, linkingWords, synonyms, referencing, patterns, grammar }}
        onChange={(next) => {
          setTopicVocab(next.topicVocab);
          setUsefulVocab(next.usefulVocab);
          setAdvancedVocab(next.advancedVocab);
          setIdioms(next.idioms);
          setCollocations(next.collocations);
          setLinkingWords(next.linkingWords);
          setSynonyms(next.synonyms);
          setReferencing(next.referencing);
          setPatterns(next.patterns);
          setGrammar(next.grammar);
        }}
      />

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink-secondary)]">Cancel</button>
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "Saving..." : "Save Cue Card"}
        </button>
      </div>
    </form>
  );
}
