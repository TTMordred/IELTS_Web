"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { addMistake, markReviewed, deleteMistake } from "@/app/(app)/mistakes/actions";
import type { MistakeEntry } from "@/app/(app)/mistakes/actions";
import {
  Plus,
  Trash2,
  Search,
  X,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";

const MODULE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "listening", label: "Listening" },
  { value: "reading", label: "Reading" },
  { value: "speaking", label: "Speaking" },
  { value: "writing", label: "Writing" },
];

const REASON_OPTIONS = [
  { value: "carelessness", label: "Carelessness" },
  { value: "knowledge_gap", label: "Knowledge Gap" },
  { value: "time_pressure", label: "Time Pressure" },
  { value: "vocab_gap", label: "Vocab Gap" },
  { value: "paraphrasing", label: "Paraphrasing" },
  { value: "other", label: "Other" },
];

const MODULE_COLORS: Record<string, string> = {
  listening: "#378ADD",
  reading: "#D85A30",
  speaking: "#1D9E75",
  writing: "#993556",
};

const REASON_BADGE: Record<string, "error" | "warning" | "info" | "purple" | "default"> = {
  carelessness: "warning",
  knowledge_gap: "error",
  time_pressure: "purple",
  vocab_gap: "info",
  paraphrasing: "default",
  other: "default",
};

function moduleBadgeVariant(module: string): "info" | "warning" | "success" | "purple" {
  if (module === "listening") return "info";
  if (module === "reading") return "warning";
  if (module === "speaking") return "success";
  return "purple";
}

export function MistakeBoard({ initialMistakes }: { initialMistakes: MistakeEntry[] }) {
  const [mistakes, setMistakes] = useState(initialMistakes);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [unreviewedOnly, setUnreviewedOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [fModule, setFModule] = useState<"listening" | "reading" | "speaking" | "writing">("listening");
  const [fQuestionType, setFQuestionType] = useState("");
  const [fDescription, setFDescription] = useState("");
  const [fReason, setFReason] = useState("");
  const [fCorrectApproach, setFCorrectApproach] = useState("");
  const [fTags, setFTags] = useState("");

  const filtered = mistakes.filter((m) => {
    if (moduleFilter !== "all" && m.module !== moduleFilter) return false;
    if (unreviewedOnly && m.reviewed) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !m.description.toLowerCase().includes(q) &&
        !(m.question_type || "").toLowerCase().includes(q) &&
        !(m.correct_approach || "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const unreviewedList = mistakes.filter((m) => !m.reviewed);

  async function handleAdd() {
    if (!fDescription.replace(/<[^>]*>/g, "").trim()) return;
    setLoading(true);
    try {
      await addMistake({
        module: fModule,
        question_type: fQuestionType.trim() || undefined,
        description: fDescription.trim(),
        reason: fReason || undefined,
        correct_approach: fCorrectApproach.trim() || undefined,
        tags: fTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      const newEntry: MistakeEntry = {
        id: crypto.randomUUID(),
        user_id: "",
        module: fModule,
        question_type: fQuestionType.trim() || null,
        description: fDescription.trim(),
        reason: fReason || null,
        correct_approach: fCorrectApproach.trim() || null,
        source_record_id: null,
        tags: fTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        reviewed: false,
        review_count: 0,
        next_review: null,
        created_at: new Date().toISOString(),
      };
      setMistakes((prev) => [newEntry, ...prev]);
      setFModule("listening");
      setFQuestionType("");
      setFDescription("");
      setFReason("");
      setFCorrectApproach("");
      setFTags("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkReviewed(id: string) {
    setMistakes((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, reviewed: true, review_count: m.review_count + 1 } : m
      )
    );
    try {
      await markReviewed(id);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    setMistakes((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteMistake(id);
    } catch (err) {
      console.error(err);
    }
  }

  const reviewCard = unreviewedList[reviewIndex];

  if (reviewMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setReviewMode(false); setReviewIndex(0); }}>
            <X className="w-3.5 h-3.5" /> Exit Review
          </Button>
          <span className="text-sm text-[var(--color-ink-muted)]">
            {unreviewedList.length === 0
              ? "All reviewed!"
              : `${reviewIndex + 1} / ${unreviewedList.length} unreviewed`}
          </span>
        </div>

        {unreviewedList.length === 0 ? (
          <div className="card-base p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-[var(--color-ink-secondary)]">All mistakes reviewed. Great work!</p>
          </div>
        ) : (
          <div className="card-base p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={moduleBadgeVariant(reviewCard.module)}>{reviewCard.module}</Badge>
                {reviewCard.question_type && (
                  <Badge variant="default">{reviewCard.question_type}</Badge>
                )}
                {reviewCard.reason && (
                  <Badge variant={REASON_BADGE[reviewCard.reason] || "default"}>
                    {REASON_OPTIONS.find((r) => r.value === reviewCard.reason)?.label || reviewCard.reason}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-[var(--color-ink-muted)] shrink-0">
                Reviewed {reviewCard.review_count}×
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">Mistake</p>
              <RichTextDisplay html={reviewCard.description} />
            </div>

            {reviewCard.correct_approach && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                  Correct Approach
                </p>
                <RichTextDisplay html={reviewCard.correct_approach} className="text-emerald-900 dark:text-emerald-200" />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
                  disabled={reviewIndex === 0}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReviewIndex((i) => Math.min(unreviewedList.length - 1, i + 1))}
                  disabled={reviewIndex >= unreviewedList.length - 1}
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleMarkReviewed(reviewCard.id);
                  if (reviewIndex >= unreviewedList.length - 1) {
                    setReviewIndex(Math.max(0, unreviewedList.length - 2));
                  }
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Reviewed
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mistakes..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
        <div className="flex gap-1.5">
          {MODULE_OPTIONS.map((m) => (
            <button
              key={m.value}
              onClick={() => setModuleFilter(m.value)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors cursor-pointer ${
                moduleFilter === m.value
                  ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                  : "border-[var(--color-line)] text-[var(--color-ink-secondary)]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setUnreviewedOnly(!unreviewedOnly)}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors cursor-pointer ${
            unreviewedOnly
              ? "bg-amber-500 text-white border-amber-500"
              : "border-[var(--color-line)] text-[var(--color-ink-secondary)]"
          }`}
        >
          Unreviewed only
        </button>
        <div className="flex gap-2">
          {unreviewedList.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => { setReviewMode(true); setReviewIndex(0); }}>
              Review ({unreviewedList.length})
            </Button>
          )}
          <Button
            variant={showForm ? "secondary" : "primary"}
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? "Cancel" : "Add Mistake"}
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card-base p-5 space-y-3 animate-fade-in-up">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-secondary)] mb-1">
                Module <span className="text-red-500">*</span>
              </label>
              <select
                value={fModule}
                onChange={(e) => setFModule(e.target.value as typeof fModule)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              >
                {MODULE_OPTIONS.filter((m) => m.value !== "all").map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-secondary)] mb-1">
                Question Type (optional)
              </label>
              <input
                type="text"
                value={fQuestionType}
                onChange={(e) => setFQuestionType(e.target.value)}
                placeholder="e.g. Multiple Choice"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-secondary)] mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={fDescription}
              onChange={setFDescription}
              placeholder="What went wrong? Be specific."
              minHeight="72px"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-secondary)] mb-1">
                Reason (optional)
              </label>
              <select
                value={fReason}
                onChange={(e) => setFReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              >
                <option value="">— select —</option>
                {REASON_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-secondary)] mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={fTags}
                onChange={(e) => setFTags(e.target.value)}
                placeholder="e.g. band7, cambridge"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-secondary)] mb-1">
              Correct Approach (optional)
            </label>
            <RichTextEditor
              value={fCorrectApproach}
              onChange={setFCorrectApproach}
              placeholder="How should you handle this next time?"
              minHeight="72px"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleAdd} variant="primary" loading={loading}>
              Save Mistake
            </Button>
          </div>
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-[var(--color-ink-muted)]">{filtered.length} entries</p>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="card-base p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-[var(--color-ink-muted)] mx-auto mb-3" />
          <p className="text-[var(--color-ink-muted)]">
            {search || unreviewedOnly || moduleFilter !== "all"
              ? "No mistakes match your filters."
              : "No mistakes logged yet. Add your first one!"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="card-base p-4 group flex gap-4"
              style={{ borderLeft: `3px solid ${MODULE_COLORS[m.module] || "var(--color-line)"}` }}
            >
              {/* Reviewed toggle */}
              <button
                onClick={() => !m.reviewed && handleMarkReviewed(m.id)}
                className={`shrink-0 mt-0.5 cursor-pointer transition-colors ${
                  m.reviewed
                    ? "text-emerald-500"
                    : "text-[var(--color-ink-muted)] hover:text-emerald-500"
                }`}
                title={m.reviewed ? "Reviewed" : "Mark as reviewed"}
              >
                {m.reviewed ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={moduleBadgeVariant(m.module)}>{m.module}</Badge>
                  {m.question_type && <Badge variant="default">{m.question_type}</Badge>}
                  {m.reason && (
                    <Badge variant={REASON_BADGE[m.reason] || "default"}>
                      {REASON_OPTIONS.find((r) => r.value === m.reason)?.label || m.reason}
                    </Badge>
                  )}
                  {m.reviewed && (
                    <span className="text-[10px] text-emerald-600 font-medium">
                      reviewed {m.review_count}×
                    </span>
                  )}
                </div>
                <RichTextDisplay html={m.description} />
                {m.correct_approach && (
                  <div className="text-xs text-[var(--color-ink-secondary)] italic line-clamp-2">
                    <RichTextDisplay html={m.correct_approach} />
                  </div>
                )}
                {m.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {m.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(m.id)}
                className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 rounded-md hover:bg-red-500/10 text-[var(--color-ink-muted)] hover:text-red-500 transition-all cursor-pointer self-start"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
