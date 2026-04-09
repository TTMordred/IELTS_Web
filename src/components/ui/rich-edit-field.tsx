"use client";

import { useState } from "react";
import { RichTextEditor } from "./rich-text-editor";
import { RichTextDisplay } from "./rich-text-display";
import { createClient } from "@/lib/supabase/client";

type Props = {
  table: string;
  id: string;
  field: string;
  value: string | null;
  placeholder?: string;
  minHeight?: string;
};

export function RichEditField({
  table,
  id,
  field,
  value: initial,
  placeholder,
  minHeight = "100px",
}: Props) {
  const [editing, setEditing] = useState(false);
  const [html, setHtml] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from(table).update({ [field]: html }).eq("id", id);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <RichTextEditor
          value={html}
          onChange={setHtml}
          placeholder={placeholder}
          minHeight={minHeight}
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setEditing(false)}
            className="text-xs px-2 py-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="text-xs px-3 py-1 rounded bg-[var(--color-accent)] text-white disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="cursor-text group min-h-[2rem] rounded px-1 -mx-1 hover:bg-[var(--color-surface-hover)] transition-colors"
    >
      {html ? (
        <RichTextDisplay html={html} />
      ) : (
        <p className="text-sm text-[var(--color-ink-muted)]">
          {placeholder ?? "Click to edit…"}
        </p>
      )}
    </div>
  );
}
