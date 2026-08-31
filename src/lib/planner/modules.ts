export const MODULES = [
  { key: "listening", label: "Listening", color: "#378ADD" },
  { key: "reading", label: "Reading", color: "#D85A30" },
  { key: "speaking", label: "Speaking", color: "#1D9E75" },
  { key: "writing", label: "Writing", color: "#1B4D3E" },
  { key: "vocab", label: "Vocab", color: "#0F766E" },
  { key: "grammar", label: "Grammar", color: "#B45309" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];

export const MODULE_LABELS = Object.fromEntries(
  MODULES.map((m) => [m.key, m.label])
) as Record<ModuleKey, string>;

export const MODULE_COLORS = Object.fromEntries(
  MODULES.map((m) => [m.key, m.color])
) as Record<ModuleKey, string>;
