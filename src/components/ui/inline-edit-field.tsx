"use client";

import { useCallback } from "react";
import { InlineEdit } from "./inline-edit";
import { inlineUpdateField } from "@/app/(app)/inline-actions";

type Props = {
  table: string;
  id: string;
  field: string;
  value: string | number | null;
  type?: "text" | "number" | "textarea";
  placeholder?: string;
  displayClassName?: string;
  min?: number;
  max?: number;
};

export function InlineEditField({
  table,
  id,
  field,
  value,
  type = "text",
  placeholder,
  displayClassName,
  min,
  max,
}: Props) {
  const stringValue = value != null ? String(value) : "";

  const handleSave = useCallback(
    async (newValue: string) => {
      await inlineUpdateField(table, id, field, newValue);
    },
    [table, id, field]
  );

  return (
    <InlineEdit
      value={stringValue}
      onSave={handleSave}
      type={type}
      placeholder={placeholder}
      displayClassName={displayClassName}
      min={min}
      max={max}
    />
  );
}
