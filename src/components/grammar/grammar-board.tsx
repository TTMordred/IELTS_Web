"use client";

import { useState } from "react";
import { GRAMMAR_CATEGORIES } from "@/lib/constants/grammar-categories";
import { addGrammarNote, deleteGrammarNote } from "@/app/(app)/grammar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import type { GrammarNote } from "@/lib/types";
import { Plus, Trash2, ChevronDown, ChevronRight, X } from "lucide-react";
import { useDraftAutosave } from "@/hooks/use-draft-autosave";
import { DraftRestoreBanner, DraftSavedIndicator } from "@/components/ui/draft-status";

export function GrammarBoard({ initialNotes }: { initialNotes: GrammarNote[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [rule, setRule] = useState("");
  const [examples, setExamples] = useState(["", "", ""]);
  const [mistakes, setMistakes] = useState(["", ""]);
  const [source, setSource] = useState("");

  // Google-Forms-style draft autosave for the Add Grammar Note form
  const draftAutosave = useDraftAutosave({
    key: "grammar-board:add",
    value: { category: showForm, rule, examples, mistakes, source },
    enabled: showForm !== null,
  });

  function restoreDraft() {
    const d = draftAutosave.draft;
    if (!d) return;
    if (d.category) setShowForm(d.category);
    setRule(d.rule ?? "");
    setExamples(Array.isArray(d.examples) && d.examples.length ? d.examples : ["", "", ""]);
    setMistakes(Array.isArray(d.mistakes) && d.mistakes.length ? d.mistakes : ["", ""]);
    setSource(d.source ?? "");
    draftAutosave.consumeDraft();
  }

  function closeForm() {
    resetForm();
    draftAutosave.clearDraft();
  }

  function resetForm() {
    setRule("");
    setExamples(["", "", ""]);
    setMistakes(["", ""]);
    setSource("");
    setShowForm(null);
  }

  async function handleAdd(category: string) {
    const ruleText = rule.replace(/<[^>]*>/g, "").trim();
    if (!ruleText) return;
    setLoading(true);
    setAddError(null);
    try {
      await addGrammarNote({
        category,
        rule: rule.trim(),
        correct_examples: examples.filter(Boolean),
        common_mistakes: mistakes.filter(Boolean),
        source: source.trim(),
      });
      draftAutosave.clearDraft();
      setNotes((prev) => [
        {
          id: crypto.randomUUID(),
          user_id: "",
          category,
          rule: rule.trim(),
          correct_examples: examples.filter(Boolean),
          common_mistakes: mistakes.filter(Boolean),
          source: source.trim(),
          mastery_level: 0,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      resetForm();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteGrammarNote(id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-3">
      {draftAutosave.showRestore && (
        <DraftRestoreBanner
          savedAt={draftAutosave.savedAt}
          onRestore={restoreDraft}
          onDismiss={draftAutosave.clearDraft}
        />
      )}

      {GRAMMAR_CATEGORIES.map((cat) => {
        const catNotes = notes.filter((n) => n.category === cat.id);
        const isExpanded = expandedCat === cat.id;

        return (
          <div key={cat.id} className="card-base overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[var(--color-ink-muted)] shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[var(--color-ink-muted)] shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-ink)]">{cat.name}</p>
                <p className="text-xs text-[var(--color-ink-muted)] truncate">{cat.topics}</p>
              </div>
              <Badge variant={cat.bandImpact === "high" ? "success" : cat.bandImpact === "medium" ? "warning" : "info"}>
                {cat.bandImpact}
              </Badge>
              <span className="text-xs text-[var(--color-ink-muted)] font-mono">
                {catNotes.length}
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-[var(--color-line)] p-4 space-y-3">
                {catNotes.length === 0 && showForm !== cat.id && (
                  <p className="text-sm text-[var(--color-ink-muted)] text-center py-4">
                    No notes yet for this category
                  </p>
                )}

                {catNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg bg-[var(--color-surface-hover)] group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium"><RichTextDisplay html={note.rule} /></div>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-[var(--color-ink-muted)] hover:text-red-500 transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {note.correct_examples.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-[var(--color-accent)] font-medium mb-1">Correct:</p>
                        {note.correct_examples.map((ex, i) => (
                          <p key={i} className="text-xs text-[var(--color-ink-secondary)] italic ml-2">
                            &ldquo;{ex}&rdquo;
                          </p>
                        ))}
                      </div>
                    )}
                    {note.common_mistakes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-[var(--color-critical)] font-medium mb-1">Common mistakes:</p>
                        {note.common_mistakes.map((m, i) => (
                          <p key={i} className="text-xs text-[var(--color-ink-secondary)] ml-2">
                            &mdash; {m}
                          </p>
                        ))}
                      </div>
                    )}
                    {note.source && (
                      <p className="text-xs text-[var(--color-ink-muted)] mt-2">Source: {note.source}</p>
                    )}
                  </div>
                ))}

                {showForm === cat.id ? (
                  <div className="p-4 rounded-lg border border-[var(--color-line)] space-y-3 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--color-ink)]">Add Grammar Note</p>
                        <DraftSavedIndicator status={draftAutosave.status} savedAt={draftAutosave.savedAt} />
                      </div>
                      <button onClick={closeForm} className="p-1 rounded hover:bg-[var(--color-surface-hover)] cursor-pointer">
                        <X className="w-4 h-4 text-[var(--color-ink-muted)]" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
                        Rule / Pattern <span className="text-red-500">*</span>
                      </label>
                      <RichTextEditor
                        value={rule}
                        onChange={setRule}
                        placeholder="e.g. Use passive voice when the agent is unknown"
                        minHeight="80px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
                        Correct Examples
                      </label>
                      {examples.map((ex, i) => (
                        <input
                          key={i}
                          type="text"
                          value={ex}
                          onChange={(e) => {
                            const next = [...examples];
                            next[i] = e.target.value;
                            setExamples(next);
                          }}
                          placeholder={`Example ${i + 1}`}
                          className="w-full mb-1.5 px-3 py-1.5 text-sm rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
                        />
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
                        Common Mistakes
                      </label>
                      {mistakes.map((m, i) => (
                        <input
                          key={i}
                          type="text"
                          value={m}
                          onChange={(e) => {
                            const next = [...mistakes];
                            next[i] = e.target.value;
                            setMistakes(next);
                          }}
                          placeholder={`Mistake ${i + 1}`}
                          className="w-full mb-1.5 px-3 py-1.5 text-sm rounded border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
                        />
                      ))}
                    </div>
                    <Input
                      label="Source (optional)"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="e.g. Cambridge 18, Writing T2"
                    />
                    {addError && (
                      <p className="text-sm text-red-500 bg-red-500/10 rounded-md px-3 py-2">{addError}</p>
                    )}
                    <div className="flex justify-end">
                      <Button onClick={() => handleAdd(cat.id)} variant="primary" loading={loading}>
                        Save Note
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowForm(cat.id); resetForm(); }}
                    className="flex items-center gap-2 text-sm text-[var(--color-accent)] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add note to {cat.name}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
