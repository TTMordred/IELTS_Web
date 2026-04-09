"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { InlineEdit } from "@/components/ui/inline-edit";
import { upsertQuestionTypeNote, type QtNote } from "@/app/(app)/wiki/actions";

type Props = {
  module: "listening" | "reading";
  typeId: string;
  typeName: string;
  description: string;
  frequency: "high" | "medium" | "low";
  accentColor: string;
  initialNote: QtNote | null;
};

const FREQUENCY_BADGE: Record<
  "high" | "medium" | "low",
  { label: string; className: string }
> = {
  high: { label: "HIGH", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  medium: { label: "MED", className: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" },
  low: { label: "LOW", className: "bg-[var(--color-line-light)] text-[var(--color-ink-muted)]" },
};

export function QuestionTypeCard({
  module,
  typeId,
  typeName,
  description,
  frequency,
  accentColor,
  initialNote,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState<QtNote>(
    initialNote ?? { strategy: null, traps: null },
  );
  const [, startTransition] = useTransition();

  const badge = FREQUENCY_BADGE[frequency];

  const handleSaveStrategy = async (value: string) => {
    const next = { ...note, strategy: value || null };
    setNote(next);
    startTransition(async () => {
      await upsertQuestionTypeNote({
        module,
        question_type: typeId,
        strategy: value || null,
        traps: note.traps,
      });
    });
  };

  const handleSaveTraps = async (value: string) => {
    const next = { ...note, traps: value || null };
    setNote(next);
    startTransition(async () => {
      await upsertQuestionTypeNote({
        module,
        question_type: typeId,
        strategy: note.strategy,
        traps: value || null,
      });
    });
  };

  return (
    <div className="rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-line-light)] transition-colors">
      {/* Header — always visible */}
      <button
        className="w-full text-left p-3 flex items-center gap-2"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-[var(--color-ink)]">{typeName}</p>
            <span
              className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-[var(--color-ink-secondary)] truncate">{description}</p>
        </div>
        <span className="shrink-0 text-[var(--color-ink-muted)]">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-[var(--color-line-light)] pt-3">
          <p className="text-xs text-[var(--color-ink-secondary)]">{description}</p>

          {/* My Strategy */}
          <div>
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: accentColor }}
            >
              My Strategy
            </p>
            <div className="text-sm text-[var(--color-ink)]">
              <InlineEdit
                value={note.strategy ?? ""}
                onSave={handleSaveStrategy}
                type="textarea"
                placeholder="Click to add strategy notes..."
                className="w-full"
                displayClassName="text-sm text-[var(--color-ink)] whitespace-pre-wrap"
              />
            </div>
          </div>

          {/* Common Traps */}
          <div>
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: accentColor }}
            >
              Common Traps
            </p>
            <div className="text-sm text-[var(--color-ink)]">
              <InlineEdit
                value={note.traps ?? ""}
                onSave={handleSaveTraps}
                type="textarea"
                placeholder="Click to add common traps..."
                className="w-full"
                displayClassName="text-sm text-[var(--color-ink)] whitespace-pre-wrap"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
