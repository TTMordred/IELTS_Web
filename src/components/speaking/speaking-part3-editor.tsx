"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { savePart3Question } from "@/app/(app)/speaking/part3-actions";
import { useDraftAutosave } from "@/hooks/use-draft-autosave";
import { DraftRestoreBanner, DraftSavedIndicator } from "@/components/ui/draft-status";
import { RequiredTextarea, type StructuredTriple } from "./speaking-answer-editor";
import { StringListEditor } from "./string-list-editor";
import {
  DEFAULT_ANSWER_STRUCTURE,
  PART3_ANSWER_FUNCTION_LABELS,
  PART3_ANSWER_FUNCTIONS,
} from "@/lib/constants/speaking-part3";
import type { Part3QuestionDraft } from "@/lib/speaking/part3-validation";
import type {
  Part3AnswerFunction,
  SpeakingPart3Question,
  SupportingIdea,
} from "@/lib/types";
import {
  LanguageBankEditor,
  OptionalTripleRows,
  cleanStrings,
  cleanTriples,
  discussionToTriple,
  languageBankFromTriples,
  languageBankTriplesFrom,
  tripleToDiscussion,
  triplesFrom,
  type LanguageBankTriples,
} from "./language-bank-editor";

function SupportingIdeasEditor({
  values,
  onChange,
}: {
  values: SupportingIdea[];
  onChange: (values: SupportingIdea[]) => void;
}) {
  function update(index: number, key: keyof SupportingIdea, value: string) {
    onChange(values.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-[var(--color-ink)]">Supporting Ideas</legend>
      {values.map((row, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={row.idea}
            onChange={(event) => update(index, "idea", event.target.value)}
            placeholder={`Supporting idea ${index + 1}…`}
            aria-label={`Supporting idea ${index + 1}`}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <select
            value={row.importance}
            onChange={(event) => update(index, "importance", event.target.value as SupportingIdea["importance"])}
            aria-label={`Supporting idea ${index + 1} importance`}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-2 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          >
            <option value="essential">Essential</option>
            <option value="optional">Optional / Expansion</option>
          </select>
          <button
            type="button"
            onClick={() => onChange(values.filter((_, rowIndex) => rowIndex !== index))}
            disabled={values.length === 1}
            aria-label={`Remove supporting idea ${index + 1}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-ink-muted)] hover:text-[var(--color-critical)] disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, { idea: "", importance: "optional" }])}
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> Add supporting idea
      </button>
    </fieldset>
  );
}

export function SpeakingPart3QuestionEditor({
  entryId,
  initialQuestion,
  initialDraft,
  position,
  onClose,
  onSaved,
  onDraftSave,
}: {
  entryId?: string;
  initialQuestion?: SpeakingPart3Question;
  initialDraft?: Part3QuestionDraft;
  position: number;
  onClose: () => void;
  onSaved: () => void;
  onDraftSave?: (question: Part3QuestionDraft) => void;
}) {
  const source = initialQuestion ?? initialDraft;

  const [questionText, setQuestionText] = useState(source?.question ?? "");
  const [topic, setTopic] = useState(source?.topic ?? "");
  const [answerFunction, setAnswerFunction] = useState<Part3AnswerFunction>(source?.answer_function ?? "Opinion");
  const [structure, setStructure] = useState<string[]>(
    source?.answer_structure.length ? source.answer_structure : DEFAULT_ANSWER_STRUCTURE[source?.answer_function ?? "Opinion"],
  );
  const [mainIdea, setMainIdea] = useState(source?.main_idea ?? "");
  const [supportingIdeas, setSupportingIdeas] = useState<SupportingIdea[]>(
    source?.supporting_ideas.length ? source.supporting_ideas : [{ idea: "", importance: "essential" }],
  );
  const [alternativeView, setAlternativeView] = useState(source?.alternative_view ?? "");
  const [answerText, setAnswerText] = useState(source?.answer ?? "");
  const [followUps, setFollowUps] = useState<string[]>(source?.follow_up_ideas.length ? source.follow_up_ideas : [""]);
  const [discussionDevices, setDiscussionDevices] = useState<StructuredTriple[]>(
    triplesFrom(source?.discussion_devices, discussionToTriple),
  );
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

  const lbValue: LanguageBankTriples = {
    topicVocab, usefulVocab, advancedVocab, idioms, collocations,
    linkingWords, synonyms, referencing, patterns, grammar,
  };

  const draftValue = {
    questionText, topic, answerFunction, structure, mainIdea, supportingIdeas,
    alternativeView, answerText, followUps, discussionDevices,
    topicVocab, usefulVocab, advancedVocab, idioms, collocations,
    linkingWords, synonyms, referencing, patterns, grammar,
  };
  const draftKey = `speaking-part3:${entryId ?? "new"}:${initialQuestion?.id ?? initialDraft?.id ?? "new"}`;
  const draftAutosave = useDraftAutosave({ key: draftKey, value: draftValue });

  function restoreDraft() {
    const d = draftAutosave.draft;
    if (!d) return;
    setQuestionText(d.questionText ?? "");
    setTopic(d.topic ?? "");
    setAnswerFunction(d.answerFunction ?? "Opinion");
    setStructure(d.structure ?? DEFAULT_ANSWER_STRUCTURE[d.answerFunction ?? "Opinion"]);
    setMainIdea(d.mainIdea ?? "");
    setSupportingIdeas(d.supportingIdeas ?? [{ idea: "", importance: "essential" }]);
    setAlternativeView(d.alternativeView ?? "");
    setAnswerText(d.answerText ?? "");
    setFollowUps(d.followUps ?? [""]);
    setDiscussionDevices(d.discussionDevices ?? [{ primary: "", secondary: "", tertiary: "" }]);
    setTopicVocab(d.topicVocab ?? lbInitial.topicVocab);
    setUsefulVocab(d.usefulVocab ?? lbInitial.usefulVocab);
    setAdvancedVocab(d.advancedVocab ?? lbInitial.advancedVocab);
    setIdioms(d.idioms ?? lbInitial.idioms);
    setCollocations(d.collocations ?? lbInitial.collocations);
    setLinkingWords(d.linkingWords ?? lbInitial.linkingWords);
    setSynonyms(d.synonyms ?? lbInitial.synonyms);
    setReferencing(d.referencing ?? lbInitial.referencing);
    setPatterns(d.patterns ?? lbInitial.patterns);
    setGrammar(d.grammar ?? lbInitial.grammar);
    draftAutosave.consumeDraft();
  }

  function changeFunction(next: Part3AnswerFunction) {
    const previousDefault = DEFAULT_ANSWER_STRUCTURE[answerFunction];
    const isUncustomized =
      structure.length === previousDefault.length &&
      structure.every((step, index) => step === previousDefault[index]);
    setAnswerFunction(next);
    // Re-seed the structure only when the user hasn't customised it.
    if (isUncustomized) setStructure(DEFAULT_ANSWER_STRUCTURE[next]);
  }

  function buildDraft(): Part3QuestionDraft {
    return {
      id: initialDraft?.id ?? crypto.randomUUID(),
      topicId: initialQuestion?.topic_id ?? initialDraft?.topicId ?? null,
      question: questionText.trim(),
      topic: topic.trim() || "",
      answer_function: answerFunction,
      answer_structure: cleanStrings(structure),
      main_idea: mainIdea.trim(),
      supporting_ideas: supportingIdeas.filter((row) => row.idea.trim() !== ""),
      alternative_view: alternativeView.trim() || "",
      answer: answerText.trim(),
      follow_up_ideas: cleanStrings(followUps),
      discussion_devices: cleanTriples(discussionDevices).map(tripleToDiscussion),
      language_bank: languageBankFromTriples(lbValue),
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
          if (!entryId || !initialQuestion?.id) throw new Error("Speaking record is required");
          await savePart3Question({
            entryId,
            id: initialQuestion.id,
            topicId: draft.topicId,
            question: draft.question,
            topic: draft.topic,
            answer_function: draft.answer_function,
            answer_structure: draft.answer_structure,
            main_idea: draft.main_idea,
            supporting_ideas: draft.supporting_ideas,
            alternative_view: draft.alternative_view,
            answer: draft.answer,
            follow_up_ideas: draft.follow_up_ideas,
            discussion_devices: draft.discussion_devices,
            language_bank: draft.language_bank,
          });
        }
        draftAutosave.clearDraft();
        onSaved();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to save discussion question");
      }
    });
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-[var(--color-ink)]">{initialQuestion || initialDraft ? "Edit" : "Add"} Question {position}</h4>
        <span className="flex items-center gap-3">
          <DraftSavedIndicator status={draftAutosave.status} savedAt={draftAutosave.savedAt} />
          <button type="button" onClick={onClose} aria-label="Close question editor" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
            <X className="h-4 w-4" />
          </button>
        </span>
      </div>

      {draftAutosave.showRestore && (
        <DraftRestoreBanner savedAt={draftAutosave.savedAt} onRestore={restoreDraft} onDismiss={draftAutosave.clearDraft} />
      )}

      {error ? <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[var(--color-critical)]">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">Question</span>
          <textarea
            value={questionText}
            onChange={(event) => setQuestionText(event.target.value)}
            placeholder="e.g. Why do you think many cities are becoming so crowded?"
            rows={2}
            required
            className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--color-ink)]">Answer Function</span>
          <select
            value={answerFunction}
            onChange={(event) => changeFunction(event.target.value as Part3AnswerFunction)}
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          >
            {PART3_ANSWER_FUNCTIONS.map((fn) => <option key={fn} value={fn}>{fn}</option>)}
          </select>
          <p className="text-xs text-[var(--color-ink-muted)]">{PART3_ANSWER_FUNCTION_LABELS[answerFunction]}</p>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--color-ink)]">Topic</span>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. Urbanisation, Technology, Education"
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </label>
      </div>

      <div className="space-y-5 border-t border-[var(--color-line)] pt-5">
        <p className="section-label">Reasoning Framework</p>
        <StringListEditor label="Answer Structure" placeholder="e.g. Opinion, Reason, Explanation, Example, Qualification" values={structure} onChange={setStructure} />
        <RequiredTextarea label="Main Idea" value={mainIdea} onChange={setMainIdea} placeholder="State the central argument in one or two sentences…" />
        <SupportingIdeasEditor values={supportingIdeas} onChange={setSupportingIdeas} />
      </div>

      <div className="space-y-5 border-t border-[var(--color-line)] pt-5">
        <p className="section-label">Answer</p>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--color-ink)]">Alternative View</span>
          <textarea
            value={alternativeView}
            onChange={(event) => setAlternativeView(event.target.value)}
            placeholder="A perspective, exception, qualification or counterargument… (optional)"
            rows={2}
            className="w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </label>
        <RequiredTextarea label="Answer" value={answerText} onChange={setAnswerText} placeholder="Write the full sample Part 3 answer…" />
        <StringListEditor label="Follow-up / Expansion Ideas" placeholder="Ideas to extend or vary the answer for similar questions…" values={followUps} onChange={setFollowUps} />
        <OptionalTripleRows
          label="Discussion Devices"
          primaryLabel="Expression"
          secondaryLabel="Nghĩa tiếng Việt"
          tertiaryLabel="Example (optional)"
          values={discussionDevices}
          onChange={setDiscussionDevices}
        />
        <p className="text-xs text-[var(--color-ink-muted)]">e.g. &ldquo;That&rsquo;s an interesting point&rdquo; → Đó là một quan điểm thú vị</p>
      </div>

      <LanguageBankEditor
        value={lbValue}
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
          {pending ? "Saving..." : "Save Question"}
        </button>
      </div>
    </form>
  );
}
