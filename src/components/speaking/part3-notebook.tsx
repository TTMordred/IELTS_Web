"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, ChevronDown, ChevronRight, Edit3, Plus, Trash2 } from "lucide-react";
import { deletePart3Question } from "@/app/(app)/speaking/part3-actions";
import {
  DEFAULT_ANSWER_STRUCTURE,
  PART3_ANSWER_FUNCTION_LABELS,
  PART3_ANSWER_FUNCTIONS,
} from "@/lib/constants/speaking-part3";
import { emptyLanguageBank } from "@/lib/speaking/language-bank";
import type { Part3QuestionDraft } from "@/lib/speaking/part3-validation";
import type { Part3AnswerFunction, SpeakingPart3Question } from "@/lib/types";
import type { TopicBankItem } from "./part1-notebook";
import { SpeakingPart3QuestionEditor } from "./speaking-part3-editor";
import { LanguageBankDisplay } from "./language-bank-display";

type DisplayQuestion = Part3QuestionDraft | SpeakingPart3Question;

type EditorState =
  | { mode: "draft"; targetId: string; draft: Part3QuestionDraft; position: number }
  | { mode: "edit"; targetId: string; question: SpeakingPart3Question }
  | { mode: "new"; targetId: string; draft: Part3QuestionDraft; position: number };

export function Part3Notebook({
  entryId,
  initialQuestions = [],
  initialDraft = [],
  topics,
  onDraftChange,
}: {
  entryId?: string;
  initialQuestions?: SpeakingPart3Question[];
  /** Restored saved-draft questions for the new-record flow; seeds the internal draft once. */
  initialDraft?: Part3QuestionDraft[];
  topics: TopicBankItem[];
  onDraftChange?: (questions: Part3QuestionDraft[]) => void;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(topics[0]?.id ?? "");
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);
  const [selectedFunction, setSelectedFunction] = useState<Part3AnswerFunction>("Opinion");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(initialQuestions.map((question) => question.id)));
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) ?? topics[0];
  const selectedQuestion = (selectedTopic?.sample_questions ?? [])[selectedQuestionIdx] ?? null;
  // Draft mode is fully controlled: the parent owns the questions and passes
  // them back via `initialDraft`, so a restored saved draft arrives via the prop.
  const displayedQuestions = onDraftChange ? initialDraft : initialQuestions;

  const groupedByFunction = useMemo(() => {
    const groups = new Map<Part3AnswerFunction, DisplayQuestion[]>();
    for (const question of displayedQuestions) {
      const existing = groups.get(question.answer_function) ?? [];
      existing.push(question);
      groups.set(question.answer_function, existing);
    }
    return [...groups.entries()];
  }, [displayedQuestions]);

  function updateDraft(questions: Part3QuestionDraft[]) {
    onDraftChange?.(questions);
  }

  function refreshAndCloseEditor() {
    setEditor(null);
    if (!onDraftChange) router.refresh();
  }

  function saveDraftQuestion(question: Part3QuestionDraft) {
    updateDraft(initialDraft.map((current) => (current.id === question.id ? question : current)));
  }

  function openDraftEditor(question: Part3QuestionDraft, position: number) {
    setEditor({ mode: "draft", targetId: question.id, draft: question, position });
  }

  function openEditEditor(question: SpeakingPart3Question) {
    setEditor({ mode: "edit", targetId: question.id, question });
  }

  function prefillFromTopic(questionText: string): Part3QuestionDraft {
    return {
      id: crypto.randomUUID(),
      topicId: selectedTopic?.id ?? null,
      question: questionText,
      topic: selectedTopic?.category ?? selectedTopic?.name ?? "",
      answer_function: selectedFunction,
      answer_structure: DEFAULT_ANSWER_STRUCTURE[selectedFunction],
      main_idea: "",
      supporting_ideas: [{ idea: "", importance: "essential" }],
      alternative_view: "",
      answer: "",
      follow_up_ideas: [""],
      discussion_devices: [],
      language_bank: emptyLanguageBank(),
    };
  }

  function addQuestion() {
    if (!selectedTopic) {
      setError("Select a topic from the Part 2 cue cards");
      return;
    }
    if (!selectedQuestion) {
      setError("This cue card has no discussion questions to add");
      return;
    }
    setError(null);
    setShowAdd(false);
    const prefill = prefillFromTopic(selectedQuestion);

    if (onDraftChange) {
      // Draft mode: append the question to the draft list and open its editor.
      updateDraft([...initialDraft, prefill]);
      setExpanded((current) => new Set([...current, prefill.id]));
      setEditor({ mode: "draft", targetId: prefill.id, draft: prefill, position: initialDraft.length + 1 });
      return;
    }

    if (!entryId) {
      setError("Speaking record is required");
      return;
    }
    // Saved mode: open a fresh editor prefilled from the Topic Bank; the question
    // is inserted on Save (answer + main idea are required at that point).
    setEditor({ mode: "new", targetId: prefill.id, draft: prefill, position: displayedQuestions.length + 1 });
  }

  function removeQuestion(id: string) {
    if (!window.confirm("Remove this discussion question and its answer from the record?")) return;
    if (onDraftChange) {
      updateDraft(initialDraft.filter((question) => question.id !== id));
      return;
    }
    startTransition(async () => {
      try {
        await deletePart3Question(id);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to remove discussion question");
      }
    });
  }

  return (
    <section id="part-3-answer-sheet" className="card-base p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading-md flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--color-accent)]" />
            Part 3 Answer Sheet
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Add up to 20 Discussion Questions — each with a reasoning framework, main idea and a full answer.
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
              <span className="text-sm font-medium text-[var(--color-ink)]">Topic (Part 2 cue card)</span>
              <select
                value={selectedTopicId}
                onChange={(event) => {
                  setSelectedTopicId(event.target.value);
                  setSelectedQuestionIdx(0);
                }}
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm"
              >
                {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-ink)]">Discussion Question</span>
              <select
                value={selectedQuestionIdx}
                onChange={(event) => setSelectedQuestionIdx(Number(event.target.value))}
                disabled={(selectedTopic?.sample_questions?.length ?? 0) === 0}
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm disabled:opacity-50"
              >
                {(selectedTopic?.sample_questions ?? []).map((question, index) => <option key={index} value={index}>{question}</option>)}
              </select>
              {(selectedTopic?.sample_questions?.length ?? 0) === 0 ? (
                <p className="text-xs text-[var(--color-ink-muted)]">This cue card has no discussion questions.</p>
              ) : null}
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-ink)]">Answer Function</span>
              <select
                value={selectedFunction}
                onChange={(event) => setSelectedFunction(event.target.value as Part3AnswerFunction)}
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm"
              >
                {PART3_ANSWER_FUNCTIONS.map((fn) => <option key={fn} value={fn}>{fn}</option>)}
              </select>
              <p className="text-xs text-[var(--color-ink-muted)]">{PART3_ANSWER_FUNCTION_LABELS[selectedFunction]}</p>
            </label>
            <div className="rounded-lg bg-[var(--color-accent-light)] px-3 py-2">
              <p className="section-label text-[var(--color-accent)]">Topic</p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">{selectedTopic?.category || "—"}</p>
            </div>
          </div>
          {selectedQuestion ? (
            <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2">
              <p className="section-label">Selected Question</p>
              <p className="mt-1 text-sm text-[var(--color-ink-secondary)]">{selectedQuestion}</p>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm">Cancel</button>
            <button type="button" onClick={addQuestion} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]">
              <Plus className="h-4 w-4" /> Add Question
            </button>
          </div>
        </div>
      ) : null}

      {editor?.mode === "new" ? (
        <SpeakingPart3QuestionEditor
          key={editor.targetId}
          entryId={entryId}
          initialDraft={editor.draft}
          position={editor.position}
          onClose={() => setEditor(null)}
          onSaved={refreshAndCloseEditor}
        />
      ) : null}

      {displayedQuestions.length === 0 && editor?.mode !== "new" ? (
        <div className="mt-5 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center text-sm text-[var(--color-ink-muted)]">
          {topics.length === 0
            ? "Add a Part 2 cue card first — Part 3 discussion questions build on the topics you cover."
            : "No Part 3 questions yet. Select a Part 2 cue card to add its discussion questions."}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {groupedByFunction.map(([answerFunction, questions]) => (
            <div key={answerFunction} className="space-y-2">
              <p className="section-label text-[var(--color-accent)]">{answerFunction}</p>
              {questions.map((question, index) => {
                const isExpanded = expanded.has(question.id);
                const questionPosition = "position" in question ? question.position : index + 1;
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
                        <p className="font-medium text-[var(--color-ink)]">{question.question}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-[var(--color-accent-light)] px-2.5 py-1 text-[var(--color-accent)]">{question.answer_function}</span>
                          {question.topic ? <span className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[var(--color-ink-muted)]">{question.topic}</span> : null}
                          {question.answer ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-[var(--color-success)]">
                              <Check className="h-3 w-3" /> Answer added
                            </span>
                          ) : (
                            <span className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[var(--color-ink-muted)]">No answer yet</span>
                          )}
                        </div>
                      </div>
                      <button type="button" onClick={() => removeQuestion(question.id)} aria-label="Remove question" className="text-[var(--color-ink-muted)] hover:text-[var(--color-critical)]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {isExpanded ? (
                      <div className="border-t border-[var(--color-line)] p-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">
                            <p className="section-label text-[var(--color-accent)]">Answer Structure</p>
                            <ol className="mt-2 list-decimal space-y-1 pl-4 text-[var(--color-ink-secondary)]">
                              {(question.answer_structure.length ? question.answer_structure : ["—"]).map((step) => <li key={step}>{step}</li>)}
                            </ol>
                          </div>
                          <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">
                            <p className="section-label text-[var(--color-accent)]">Main Idea</p>
                            <p className="mt-2 whitespace-pre-wrap text-[var(--color-ink-secondary)]">{question.main_idea || "—"}</p>
                          </div>
                        </div>

                        {question.supporting_ideas.length > 0 ? (
                          <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">
                            <p className="section-label text-[var(--color-accent)]">Supporting Ideas</p>
                            <ul className="mt-2 space-y-1.5 text-[var(--color-ink-secondary)]">
                              {question.supporting_ideas.map((idea, ideaIndex) => (
                                <li key={ideaIndex} className="flex items-start gap-2">
                                  <span className="flex-1">{idea.idea}</span>
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${idea.importance === "essential" ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]" : "bg-[var(--color-surface)] text-[var(--color-ink-muted)]"}`}>
                                    {idea.importance === "essential" ? "Essential" : "Optional"}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {question.alternative_view ? (
                          <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">
                            <p className="section-label text-[var(--color-accent)]">Alternative View</p>
                            <p className="mt-2 whitespace-pre-wrap text-[var(--color-ink-secondary)]">{question.alternative_view}</p>
                          </div>
                        ) : null}

                        <div>
                          <p className="section-label text-[var(--color-accent)]">Answer</p>
                          {question.answer ? (
                            <div className="mt-2 flex items-start gap-3 rounded-lg border border-[var(--color-line)] p-3">
                              <p className="flex-1 whitespace-pre-wrap text-sm text-[var(--color-ink-secondary)]">{question.answer}</p>
                              <button
                                type="button"
                                onClick={() => (onDraftChange ? openDraftEditor(question as Part3QuestionDraft, questionPosition) : openEditEditor(question as SpeakingPart3Question))}
                                aria-label={`Edit answer ${questionPosition}`}
                                className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)]"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => (onDraftChange ? openDraftEditor(question as Part3QuestionDraft, questionPosition) : openEditEditor(question as SpeakingPart3Question))}
                              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline"
                            >
                              <Plus className="h-4 w-4" /> Write Answer
                            </button>
                          )}
                        </div>

                        {question.follow_up_ideas.length > 0 ? (
                          <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">
                            <p className="section-label text-[var(--color-accent)]">Follow-up / Expansion Ideas</p>
                            <ul className="mt-2 list-disc space-y-1 pl-4 text-[var(--color-ink-secondary)]">
                              {question.follow_up_ideas.map((idea) => <li key={idea}>{idea}</li>)}
                            </ul>
                          </div>
                        ) : null}

                        {question.discussion_devices.length > 0 ? (
                          <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">
                            <p className="section-label text-[var(--color-accent)]">Discussion Devices</p>
                            <ul className="mt-2 space-y-1 text-[var(--color-ink-secondary)]">
                              {question.discussion_devices.map((device) => (
                                <li key={device.expression}>“{device.expression}” — {device.meaningVi}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <LanguageBankDisplay bank={question.language_bank} />

                        {editor !== null && editor.mode !== "new" && editor.targetId === question.id ? (
                          <SpeakingPart3QuestionEditor
                            key={editor.mode === "edit" ? editor.question.id : editor.draft.id}
                            entryId={entryId}
                            initialQuestion={editor.mode === "edit" ? editor.question : undefined}
                            initialDraft={editor.mode === "edit" ? undefined : editor.draft}
                            position={questionPosition}
                            onClose={() => setEditor(null)}
                            onSaved={refreshAndCloseEditor}
                            onDraftSave={onDraftChange ? saveDraftQuestion : undefined}
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
