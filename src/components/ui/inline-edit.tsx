"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Check, X } from "lucide-react";

type InlineEditProps = {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  type?: "text" | "number" | "textarea";
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  min?: number;
  max?: number;
};

export function InlineEdit({
  value,
  onSave,
  type = "text",
  placeholder = "Click to edit",
  className = "",
  displayClassName = "",
  min,
  max,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (type !== "number") {
        inputRef.current.select();
      }
    }
  }, [editing, type]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = useCallback(async () => {
    if (editValue === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(editValue);
      setEditing(false);
    } catch (err) {
      console.error(err);
      setEditValue(value); // revert
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && type !== "textarea") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel, type]
  );

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className={`cursor-pointer hover:bg-[var(--color-surface-hover)] rounded px-1 -mx-1 transition-colors inline-block min-w-[2ch] ${displayClassName}`}
        title="Click to edit"
      >
        {value || <span className="text-[var(--color-ink-muted)] italic">{placeholder}</span>}
      </span>
    );
  }

  const inputClasses = `px-2 py-1 rounded border border-[var(--color-accent)] bg-[var(--color-card)] text-[var(--color-ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${className}`;

  return (
    <span className="inline-flex items-center gap-1">
      {type === "textarea" ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          rows={3}
          className={`${inputClasses} resize-y min-w-[200px]`}
          disabled={saving}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={editValue}
          onChange={(e) => {
            let val = e.target.value;
            if (type === "number" && min !== undefined && max !== undefined) {
              const num = parseInt(val);
              if (!isNaN(num)) {
                val = String(Math.min(max, Math.max(min, num)));
              }
            }
            setEditValue(val);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`${inputClasses} w-auto min-w-[3ch]`}
          style={{ width: `${Math.max(3, editValue.length + 1)}ch` }}
          disabled={saving}
          min={min}
          max={max}
        />
      )}
      <button
        onClick={handleSave}
        className="p-0.5 rounded hover:bg-emerald-500/10 text-emerald-500 cursor-pointer"
        title="Save (Enter)"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleCancel}
        className="p-0.5 rounded hover:bg-red-500/10 text-red-500 cursor-pointer"
        title="Cancel (Esc)"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}
