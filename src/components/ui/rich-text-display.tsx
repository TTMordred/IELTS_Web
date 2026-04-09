"use client";

type Props = {
  html: string | null;
  className?: string;
};

export function RichTextDisplay({ html, className }: Props) {
  if (!html || html === "<p></p>" || html.trim() === "") return null;

  return (
    <div
      className={`rte-display text-sm text-[var(--color-ink)] ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
