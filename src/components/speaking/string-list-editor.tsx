"use client";

import { Plus, Trash2 } from "lucide-react";

/** Editable list of short text items (answer structure steps, key ideas, …). */
export function StringListEditor({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  function update(index: number, value: string) {
    onChange(values.map((current, rowIndex) => (rowIndex === index ? value : current)));
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-[var(--color-ink)]">{label}</legend>
      {values.map((value, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={value}
            onChange={(event) => update(index, event.target.value)}
            placeholder={placeholder}
            aria-label={`${label} ${index + 1}`}
            required
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <button
            type="button"
            onClick={() => onChange(values.filter((_, rowIndex) => rowIndex !== index))}
            disabled={values.length === 1}
            aria-label={`Remove ${label} item ${index + 1}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-ink-muted)] hover:text-[var(--color-critical)] disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </fieldset>
  );
}
