"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown, ChevronRight, Edit3, Loader2, Plus, Trash2 } from "lucide-react";
import {
  addEntryQuestion,
  deleteEntryQuestion,
  deleteSpeakingAnswer,
} from "@/app/(app)/speaking/notebook-actions";
import {
  ANSWER_FUNCTION_TEMPLATES,
  answerStructureFor,
  type AnswerFunction,
} from "@/lib/constants/speaking-answer-templates";
import type { SpeakingAnswer, SpeakingEntryQuestion } from "@/lib/types";
import type { AnswerInput, NewRecordNotebookQuestion } from "@/lib/speaking/notebook-validation";
import { SpeakingAnswerEditor } from "./speaking-answer-editor";
import { LanguageBankDisplay, answerLanguageBank } from "./language-bank-display";

export type TopicBankItem = {
  id: string;
  name: string;
  sample_questions: string[] | null;
  is_forecast?: boolean;
  forecast_quarter?: string | null;
  category?: string | null;
};
type NotebookQuestion = SpeakingEntryQuestion & { answers: SpeakingAnswer[] };
type EditorState = { questionId: string; answer?: SpeakingAnswer; position: number } | null;

export function Part1Notebook({
  part,
  entryId,
  initialQuestions = [],
  initialDraft = [],
  topics,
  onDraftChange,
}: {
  part: 1 | 2 | 3;
  entryId?: string;
  initialQuestions?: NotebookQuestion[];
  /** Restored saved-draft questions for the new-record flow; seeds the internal draft once. */
  initialDraft?: NewRecordNotebookQuestion[];
  topics: TopicBankItem[];
  onDraftChange?: (questions: NewRecordNotebookQuestion[]) => void;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [questionText, setQuestionText] = useState("");
  const [answerFunction, setAnswerFunction] = useState<AnswerFunction>("Habit");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(initialQuestions.map((item) => item.id)));
  const [editor, setEditor] = useState<EditorState>(null);
  const [draftQuestions, setDraftQuestions] = useState<NotebookQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // When restoring a saved draft in the new-record flow, seed the internal
  // draft exactly once (guarded so later draft edits flowing back up through
  // onDraftChange never reset the local list).
  const appliedDraftRef = useRef(false);
  useEffect(() => {
    if (!onDraftChange || initialDraft.length === 0 || appliedDraftRef.current) return;
    appliedDraftRef.current = true;
    const now = new Date().toISOString();
    setDraftQuestions(initialDraft.map((question, qi) => ({
      id: `draft-${question.topicId}-${qi}`,
      entry_id: "draft",
      part,
      topic_id: question.topicId,
      topic_name: topics.find((topic) => topic.id === question.topicId)?.name,
      question_text: question.questionText,
      answer_function: question.answerFunction,
      answers: question.answers.map((answer, ai) => ({
        ...answer,
        id: `draft-answer-${question.topicId}-${qi}-${ai}`,
        entry_question_id: "draft",
        created_at: now,
        updated_at: now,
      })),
      created_at: now,
      updated_at: now,
    })));
  }, [onDraftChange, initialDraft, part, topics]);

  const selectedTopic = topics.find((topic) => topic.id === topicId) ?? topics[0];
  const selectedTopicId = selectedTopic?.id ?? "";
  const displayedQuestions = onDraftChange ? draftQuestions : initialQuestions;
  const groupedQuestions = useMemo(() => {
    const groups = new Map<string, NotebookQuestion[]>();
    for (const question of displayedQuestions) {
      const existing = groups.get(question.topic_name ?? "Archived Topic") ?? [];
      existing.push(question);
      groups.set(question.topic_name ?? "Archived Topic", existing);
    }
    return [...groups.entries()];
  }, [displayedQuestions]);

  function updateDraft(questions: NotebookQuestion[]) {
    setDraftQuestions(questions);
    onDraftChange?.(questions.map((question) => ({
      topicId: question.topic_id ?? "",
      part,
      questionText: question.question_text,
      answerFunction: question.answer_function as AnswerFunction,
      answers: question.answers.map(({ position, answer_text, follow_up_ideas, topic_specific_vocabulary, useful_vocabulary, advanced_adjectives_adverbs, idioms_phrasal_verbs, collocations, linking_words, synonyms_paraphrasing, referencing_devices, sentence_patterns, grammar_focus }) => ({
        position,
        answer_text,
        follow_up_ideas,
        topic_specific_vocabulary,
        useful_vocabulary,
        advanced_adjectives_adverbs,
        idioms_phrasal_verbs,
        collocations,
        linking_words,
        synonyms_paraphrasing,
        referencing_devices,
        sentence_patterns,
        grammar_focus,
      })),
    })));
  }

  function refreshAndCloseEditor() {
    setEditor(null);
    if (!onDraftChange) router.refresh();
  }

  function addQuestion() {
    const selectedQuestion = part === 2 ? selectedTopic?.name ?? "" : questionText;
    if (!selectedTopicId || !selectedQuestion) {
      setError("Select a topic and question");
      return;
    }
    setError(null);
    if (onDraftChange) {
      if (displayedQuestions.some((question) => question.topic_id === selectedTopicId && question.question_text === selectedQuestion)) {
        setError("This question is already in the record");
        return;
      }
      const now = new Date().toISOString();
      updateDraft([...displayedQuestions, {
        id: crypto.randomUUID(),
        entry_id: "draft",
        part,
        topic_id: selectedTopicId,
        topic_name: selectedTopic?.name,
        question_text: selectedQuestion,
        answer_function: answerFunction,
        answers: [],
        created_at: now,
        updated_at: now,
      }]);
      setQuestionText("");
      setShowAdd(false);
      return;
    }
    startTransition(async () => {
      try {
        if (!entryId) throw new Error("Speaking record is required");
        await addEntryQuestion({ entryId, part, topicId: selectedTopicId, questionText: selectedQuestion, answerFunction });
        setQuestionText("");
        setShowAdd(false);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to add question");
      }
    });
  }

  function removeQuestion(id: string) {
    if (!window.confirm("Remove this question and its answers from the record?")) return;
    if (onDraftChange) {
      updateDraft(displayedQuestions.filter((question) => question.id !== id));
      return;
    }
    startTransition(async () => {
      try {
        await deleteEntryQuestion(id);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to remove question");
      }
    });
  }

  function removeAnswer(id: string) {
    if (!window.confirm("Remove this answer? Bank items created from it will be kept.")) return;
    if (onDraftChange) {
      updateDraft(displayedQuestions.map((question) => ({
        ...question,
        answers: question.answers.filter((answer) => answer.id !== id),
      })));
      return;
    }
    startTransition(async () => {
      try {
        await deleteSpeakingAnswer(id);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to remove answer");
      }
    });
  }

  function nextPosition(answers: SpeakingAnswer[]): number {
    const used = new Set(answers.map((answer) => answer.position));
    return [1, 2, 3, 4, 5].find((position) => !used.has(position)) ?? 5;
  }

  function saveDraftAnswer(questionId: string, answer: AnswerInput, existingId?: string) {
    const now = new Date().toISOString();
    updateDraft(displayedQuestions.map((question) => question.id !== questionId ? question : {
      ...question,
      answers: existingId
        ? question.answers.map((current) => current.id === existingId ? { ...current, ...answer, updated_at: now } : current)
        : [...question.answers, { ...answer, id: crypto.randomUUID(), entry_question_id: questionId, created_at: now, updated_at: now }],
    }));
  }

  return (
    <section id={`part-${part}-answer-sheet`} className="card-base p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading-md flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--color-accent)]" />
            Part {part} Answer Sheet
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {part === 2
              ? "Build 1–5 complete answers for each Cue Card."
              : `Build 1–5 complete answers for each Part ${part} question.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((value) => !value)}
          disabled={topics.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          <Plus className="h-4 w-4" /> Add Question
        </button>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[var(--color-critical)]">{error}</p> : null}

      {showAdd ? (
        <div className="mt-4 space-y-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-ink)]">Topic</span>
              <select
                value={selectedTopicId}
                onChange={(event) => {
                  setTopicId(event.target.value);
                  setQuestionText("");
                }}
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm"
              >
                {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            </label>
            {part === 2 ? (
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-[var(--color-ink)]">Cue Card</span>
                <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm">{selectedTopic?.name}</p>
              </div>
            ) : (
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-[var(--color-ink)]">Question</span>
                <select
                  value={questionText}
                  onChange={(event) => setQuestionText(event.target.value)}
                  className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm"
                >
                  <option value="">Select a question...</option>
                  {(selectedTopic?.sample_questions ?? []).map((question) => <option key={question} value={question}>{question}</option>)}
                </select>
              </label>
            )}
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--color-ink)]">Answer Function</span>
            <select
              value={answerFunction}
              onChange={(event) => setAnswerFunction(event.target.value as AnswerFunction)}
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm"
            >
              {ANSWER_FUNCTION_TEMPLATES.map((item) => <option key={item.function} value={item.function}>{item.function}</option>)}
            </select>
          </label>
          <div className="rounded-lg bg-[var(--color-accent-light)] px-3 py-2">
            <p className="section-label text-[var(--color-accent)]">Answer Structure</p>
            <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">{answerStructureFor(answerFunction)}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm">Cancel</button>
            <button type="button" onClick={addQuestion} disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Question
            </button>
          </div>
        </div>
      ) : null}

      {groupedQuestions.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center text-sm text-[var(--color-ink-muted)]">
          {topics.length === 0
            ? part === 3 ? "Add a Part 2 Cue Card first to unlock its follow-up questions." : "No Topic Bank items are available."
            : `No Part ${part} questions yet. Select one from Topic Bank to begin.`}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {groupedQuestions.map(([topicName, questions]) => (
            <div key={topicName} className="space-y-2">
              <p className="section-label text-[var(--color-accent)]">{topicName}</p>
              {questions.map((question) => {
                const isExpanded = expanded.has(question.id);
                return (
                  <div key={question.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-card)]">
                    <div className="flex items-start gap-3 p-4">
                      <button
                        type="button"
                        onClick={() => setExpanded((current) => {
                          const next = new Set(current);
                          if (next.has(question.id)) next.delete(question.id); else next.add(question.id);
                          return next;
                        })}
                        aria-label={isExpanded ? "Collapse question" : "Expand question"}
                        className="mt-0.5 text-[var(--color-ink-muted)]"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--color-ink)]">{question.question_text}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-[var(--color-accent-light)] px-2.5 py-1 text-[var(--color-accent)]">{question.answer_function}</span>
                          <span className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[var(--color-ink-muted)]">{question.answers.length}/5 answers</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeQuestion(question.id)} aria-label="Remove question" className="text-[var(--color-ink-muted)] hover:text-[var(--color-critical)]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {isExpanded ? (
                      <div className="border-t border-[var(--color-line)] p-4">
                        <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink-secondary)]">
                          <span className="font-medium text-[var(--color-ink)]">Structure:</span> {answerStructureFor(question.answer_function)}
                        </div>
                        <div className="mt-3 space-y-2">
                          {question.answers.map((answer) => (
                            <div key={answer.id} className="rounded-lg border border-[var(--color-line)] p-3">
                              <div className="flex items-start gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-accent-light)] text-xs font-bold text-[var(--color-accent)]">{answer.position}</span>
                                <p className="flex-1 whitespace-pre-wrap text-sm text-[var(--color-ink-secondary)]">{answer.answer_text}</p>
                                <button type="button" onClick={() => setEditor({ questionId: question.id, answer, position: answer.position })} aria-label={`Edit answer ${answer.position}`} className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)]"><Edit3 className="h-4 w-4" /></button>
                                <button type="button" onClick={() => removeAnswer(answer.id)} aria-label={`Delete answer ${answer.position}`} className="text-[var(--color-ink-muted)] hover:text-[var(--color-critical)]"><Trash2 className="h-4 w-4" /></button>
                              </div>
                              {answer.follow_up_ideas ? (
                                <div className="mt-3 rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">
                                  <p className="section-label text-[var(--color-accent)]">Follow-up / Expansion Ideas</p>
                                  <p className="mt-2 whitespace-pre-wrap text-[var(--color-ink-secondary)]">{answer.follow_up_ideas}</p>
                                </div>
                              ) : null}
                              <LanguageBankDisplay bank={answerLanguageBank(answer)} className="mt-3" />
                            </div>
                          ))}
                        </div>
                        {question.answers.length < 5 && editor?.questionId !== question.id ? (
                          <button type="button" onClick={() => setEditor({ questionId: question.id, position: nextPosition(question.answers) })} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline">
                            <Plus className="h-4 w-4" /> Add Answer
                          </button>
                        ) : null}
                        {editor?.questionId === question.id ? (
                          <SpeakingAnswerEditor
                            key={editor.answer?.id ?? `${question.id}-${editor.position}`}
                            entryQuestionId={question.id}
                            position={editor.position}
                            initialAnswer={editor.answer}
                            onClose={() => setEditor(null)}
                            onSaved={refreshAndCloseEditor}
                            onDraftSave={onDraftChange ? (answer) => saveDraftAnswer(question.id, answer, editor.answer?.id) : undefined}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
