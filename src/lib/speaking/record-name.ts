const TYPE_LABELS: Record<string, string> = {
  practice: "Practice",
  mock_test: "Mock Test",
  real_test: "Real Test",
};

export function parseSpeakingRecordName(value: unknown): string | null {
  if (typeof value !== "string") throw new Error("Record name must be text");
  const name = value.trim();
  if (name.length > 120) throw new Error("Record name must be at most 120 characters");
  return name || null;
}

export function speakingRecordLabel(name: string | null | undefined, type: string, date: string): string {
  return name?.trim() || `${TYPE_LABELS[type] ?? "Speaking"} · ${date}`;
}
