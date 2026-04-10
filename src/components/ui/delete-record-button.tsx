"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

interface DeleteRecordButtonProps {
  id: string;
  deleteAction: (id: string) => Promise<void>;
  label?: string;
}

export function DeleteRecordButton({ id, deleteAction, label = "record" }: DeleteRecordButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete this ${label}?`)) return;
    startTransition(async () => {
      await deleteAction(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      title={`Delete ${label}`}
      className="p-1.5 rounded-md text-[var(--color-ink-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
    >
      {isPending ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
