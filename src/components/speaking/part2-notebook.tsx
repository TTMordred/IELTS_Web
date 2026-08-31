"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, ChevronDown, ChevronRight, Edit3, Plus, Trash2 } from "lucide-react";
import { deletePart2Card } from "@/app/(app)/speaking/part2-actions";
import {
  DEFAULT_ANSWER_STRUCTURE,
  inferCueCardType,
} from "@/lib/constants/speaking-cue-card";
import { emptyLanguageBank } from "@/lib/speaking/language-bank";
import type { Part2CardDraft } from "@/lib/speaking/part2-validation";
import type { CueCardType, SpeakingPart2Card } from "@/lib/types";
import type { TopicBankItem } from "./part1-notebook";
import { SpeakingPart2CardEditor } from "./speaking-part2-editor";
import { LanguageBankDisplay } from "./language-bank-display";

type DisplayCard = Part2CardDraft | SpeakingPart2Card;

type EditorState =
  | { mode: "draft"; targetId: string; draft: Part2CardDraft; position: number }
  | { mode: "edit"; targetId: string; card: SpeakingPart2Card }
  | { mode: "new"; targetId: string; draft: Part2CardDraft; position: number };

export function Part2Notebook({
  entryId,
  initialCards = [],
  initialDraft = [],
  topics,
  onDraftChange,
}: {
  entryId?: string;
  initialCards?: SpeakingPart2Card[];
  /** Restored saved-draft cards for the new-record flow; seeds the internal draft once. */
  initialDraft?: Part2CardDraft[];
  topics: TopicBankItem[];
  onDraftChange?: (cards: Part2CardDraft[]) => void;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(topics[0]?.id ?? "");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(initialCards.map((card) => card.id)));
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) ?? topics[0];
  // Draft mode is fully controlled: the parent owns the cards and passes them
  // back via `initialDraft`, so a restored saved draft arrives through the prop.
  const displayedCards = onDraftChange ? initialDraft : initialCards;

  const groupedByType = useMemo(() => {
    const groups = new Map<CueCardType, DisplayCard[]>();
    for (const card of displayedCards) {
      const existing = groups.get(card.cue_card_type) ?? [];
      existing.push(card);
      groups.set(card.cue_card_type, existing);
    }
    return [...groups.entries()];
  }, [displayedCards]);

  function updateDraft(cards: Part2CardDraft[]) {
    onDraftChange?.(cards);
  }

  function refreshAndCloseEditor() {
    setEditor(null);
    if (!onDraftChange) router.refresh();
  }

  function saveDraftCard(card: Part2CardDraft) {
    updateDraft(initialDraft.map((current) => (current.id === card.id ? card : current)));
  }

  function openDraftEditor(card: Part2CardDraft, position: number) {
    setEditor({ mode: "draft", targetId: card.id, draft: card, position });
  }

  function openEditEditor(card: SpeakingPart2Card) {
    setEditor({ mode: "edit", targetId: card.id, card });
  }

  function prefillFromTopic(): Part2CardDraft {
    const cueCardType = inferCueCardType(selectedTopic?.category);
    return {
      id: crypto.randomUUID(),
      topicId: selectedTopic?.id ?? null,
      cue_card: selectedTopic?.name ?? "",
      cue_card_type: cueCardType,
      topic: selectedTopic?.category ?? "",
      answer_structure: DEFAULT_ANSWER_STRUCTURE[cueCardType],
      key_ideas: [""],
      answer: "",
      follow_up_ideas: [""],
      storytelling_devices: [],
      language_bank: emptyLanguageBank(),
    };
  }

  function addCard() {
    if (!selectedTopic) {
      setError("Select a cue card from the Topic Bank");
      return;
    }
    setError(null);
    setShowAdd(false);
    const prefill = prefillFromTopic();

    if (onDraftChange) {
      // Draft mode: append the card to the draft list and open its editor.
      updateDraft([...initialDraft, prefill]);
      setExpanded((current) => new Set([...current, prefill.id]));
      setEditor({ mode: "draft", targetId: prefill.id, draft: prefill, position: initialDraft.length + 1 });
      return;
    }

    if (!entryId) {
      setError("Speaking record is required");
      return;
    }
    // Saved mode: open a fresh editor prefilled from the Topic Bank; the card is
    // inserted on Save (answer + structure are required at that point).
    setEditor({ mode: "new", targetId: prefill.id, draft: prefill, position: displayedCards.length + 1 });
  }

  function removeCard(id: string) {
    if (!window.confirm("Remove this cue card and its answer from the record?")) return;
    if (onDraftChange) {
      updateDraft(initialDraft.filter((card) => card.id !== id));
      return;
    }
    startTransition(async () => {
      try {
        await deletePart2Card(id);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to remove cue card");
      }
    });
  }

  return (
    <section id="part-2-answer-sheet" className="card-base p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading-md flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--color-accent)]" />
            Part 2 Answer Sheet
          </h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Add up to 8 Cue Cards — each with a structure, key ideas and a full answer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((value) => !value)}
          disabled={topics.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          <Plus className="h-4 w-4" /> Add Cue Card
        </button>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[var(--color-critical)]">{error}</p> : null}

      {showAdd ? (
        <div className="mt-4 space-y-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-ink)]">Cue Card</span>
              <select
                value={selectedTopicId}
                onChange={(event) => setSelectedTopicId(event.target.value)}
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm"
              >
                {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            </label>
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-[var(--color-ink)]">Cue Card Type</span>
              <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm">
                {inferCueCardType(selectedTopic?.category)}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-[var(--color-accent-light)] px-3 py-2">
            <p className="section-label text-[var(--color-accent)]">Topic</p>
            <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">{selectedTopic?.category || "—"}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm">Cancel</button>
            <button type="button" onClick={addCard} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]">
              <Plus className="h-4 w-4" /> Add Cue Card
            </button>
          </div>
        </div>
      ) : null}

      {editor?.mode === "new" ? (
        <SpeakingPart2CardEditor
          key={editor.targetId}
          entryId={entryId}
          initialDraft={editor.draft}
          position={editor.position}
          onClose={() => setEditor(null)}
          onSaved={refreshAndCloseEditor}
        />
      ) : null}

      {displayedCards.length === 0 && editor?.mode !== "new" ? (
        <div className="mt-5 rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center text-sm text-[var(--color-ink-muted)]">
          {topics.length === 0
            ? "No Topic Bank cue cards are available."
            : "No Part 2 cue cards yet. Select one from the Topic Bank to begin."}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {groupedByType.map(([type, cards]) => (
            <div key={type} className="space-y-2">
              <p className="section-label text-[var(--color-accent)]">{type}</p>
              {cards.map((card, index) => {
                const isExpanded = expanded.has(card.id);
                const cardPosition = "position" in card ? card.position : index + 1;
                return (
                  <div key={card.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-card)]">
                    <div className="flex items-start gap-3 p-4">
                      <button
                        type="button"
                        onClick={() => setExpanded((current) => {
                          const next = new Set(current);
                          if (next.has(card.id)) next.delete(card.id); else next.add(card.id);
                          return next;
                        })}
                        aria-label={isExpanded ? "Collapse cue card" : "Expand cue card"}
                        className="mt-0.5 text-[var(--color-ink-muted)]"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--color-ink)]">{card.cue_card}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-[var(--color-accent-light)] px-2.5 py-1 text-[var(--color-accent)]">{card.cue_card_type}</span>
                          {card.topic ? <span className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[var(--color-ink-muted)]">{card.topic}</span> : null}
                          {card.answer ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-[var(--color-success)]">
                              <Check className="h-3 w-3" /> Answer added
                            </span>
                          ) : (
                            <span className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[var(--color-ink-muted)]">No answer yet</span>
                          )}
                        </div>
                      </div>
                      <button type="button" onClick={() => removeCard(card.id)} aria-label="Remove cue card" className="text-[var(--color-ink-muted)] hover:text-[var(--color-critical)]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {isExpanded ? (
                      <div className="border-t border-[var(--color-line)] p-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">
                            <p className="section-label text-[var(--color-accent)]">Answer Structure</p>
                            <ol className="mt-2 list-decimal space-y-1 pl-4 text-[var(--color-ink-secondary)]">
                              {(card.answer_structure.length ? card.answer_structure : ["—"]).map((step) => <li key={step}>{step}</li>)}
                            </ol>
                          </div>
                          <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">
                            <p className="section-label text-[var(--color-accent)]">Key Ideas / Outline</p>
                            <ul className="mt-2 list-disc space-y-1 pl-4 text-[var(--color-ink-secondary)]">
                              {(card.key_ideas.length ? card.key_ideas : ["—"]).map((idea) => <li key={idea}>{idea}</li>)}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <p className="section-label text-[var(--color-accent)]">Answer</p>
                          {card.answer ? (
                            <div className="mt-2 flex items-start gap-3 rounded-lg border border-[var(--color-line)] p-3">
                              <p className="flex-1 whitespace-pre-wrap text-sm text-[var(--color-ink-secondary)]">{card.answer}</p>
                              <button
                                type="button"
                                onClick={() => (onDraftChange ? openDraftEditor(card as Part2CardDraft, cardPosition) : openEditEditor(card as SpeakingPart2Card))}
                                aria-label={`Edit answer ${cardPosition}`}
                                className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)]"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => (onDraftChange ? openDraftEditor(card as Part2CardDraft, cardPosition) : openEditEditor(card as SpeakingPart2Card))}
                              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline"
                            >
                              <Plus className="h-4 w-4" /> Write Answer
                            </button>
                          )}
                        </div>

                        {card.storytelling_devices.length > 0 ? (
                          <div className="rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">
                            <p className="section-label text-[var(--color-accent)]">Storytelling Devices</p>
                            <ul className="mt-2 space-y-1 text-[var(--color-ink-secondary)]">
                              {card.storytelling_devices.map((device) => (
                                <li key={device.expression}>“{device.expression}” — {device.meaningVi}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <LanguageBankDisplay bank={card.language_bank} />

                        {editor !== null && editor.mode !== "new" && editor.targetId === card.id ? (
                          <SpeakingPart2CardEditor
                            key={editor.mode === "edit" ? editor.card.id : editor.draft.id}
                            entryId={entryId}
                            initialCard={editor.mode === "edit" ? editor.card : undefined}
                            initialDraft={editor.mode === "edit" ? undefined : editor.draft}
                            position={cardPosition}
                            onClose={() => setEditor(null)}
                            onSaved={refreshAndCloseEditor}
                            onDraftSave={onDraftChange ? saveDraftCard : undefined}
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
