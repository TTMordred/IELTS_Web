"use client";

import { Check, History, Loader2, RotateCcw, X } from "lucide-react";
import type { DraftStatus } from "@/hooks/use-draft-autosave";

export function DraftSavedIndicator({
  status,
  savedAt,
}: {
  status: DraftStatus;
  savedAt: Date | null;
}) {
  if (status === "idle") return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
      {status === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "saved" && <Check className="h-3 w-3 text-[var(--color-accent)]" />}
      {status === "error" && <X className="h-3 w-3 text-[var(--color-critical)]" />}
      {status === "saving" && "Saving draft..."}
      {status === "saved" &&
        (savedAt
          ? `All changes saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : "Draft saved")}
      {status === "error" && "Couldn't save draft"}
    </span>
  );
}

export function DraftRestoreBanner({
  savedAt,
  onRestore,
  onDismiss,
}: {
  savedAt: Date | null;
  onRestore: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-accent-light)] px-3 py-2 text-sm">
      <span className="flex items-center gap-2 text-[var(--color-ink)]">
        <History className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
        <span>
          {savedAt
            ? `A draft from ${savedAt.toLocaleString()} was found.`
            : "A saved draft was found."}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRestore}
          className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)] cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Restore draft
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
        >
          Dismiss
        </button>
      </span>
    </div>
  );
}