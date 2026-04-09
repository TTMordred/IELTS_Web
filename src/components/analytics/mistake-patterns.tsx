"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isAIEnabled } from "@/lib/ai/check-ai-enabled";
import { Sparkles, Brain, AlertTriangle } from "lucide-react";

type MistakeEntry = {
  questionType: string;
  mistakesNote: string;
  correct: number;
  total: number;
};

// Client-side pattern detection (no AI needed)
const ERROR_TAGS = [
  { tag: "spelling", keywords: ["spell", "spelling", "viết sai", "chính tả"] },
  { tag: "number_confusion", keywords: ["number", "số", "phone", "date", "ngày"] },
  { tag: "distractor", keywords: ["distract", "trap", "bẫy", "nhầm", "similar"] },
  { tag: "time_pressure", keywords: ["time", "thời gian", "nhanh", "không kịp", "rushed"] },
  { tag: "vocab_gap", keywords: ["vocab", "từ", "không hiểu", "new word", "từ mới"] },
  { tag: "paraphrasing", keywords: ["paraphras", "đổi từ", "synonym", "rephrase"] },
  { tag: "not_given", keywords: ["not given", "NG", "không có", "không đề cập"] },
  { tag: "reading_speed", keywords: ["slow", "chậm", "reading speed", "scan"] },
];

function detectPatterns(mistakes: MistakeEntry[]) {
  const tagCounts: Record<string, number> = {};
  const typeCounts: Record<string, { errors: number; total: number }> = {};

  for (const m of mistakes) {
    const note = m.mistakesNote.toLowerCase();

    // Count error tags
    for (const { tag, keywords } of ERROR_TAGS) {
      if (keywords.some((kw) => note.includes(kw))) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    // Count per question type
    if (!typeCounts[m.questionType]) {
      typeCounts[m.questionType] = { errors: 0, total: 0 };
    }
    typeCounts[m.questionType].errors += m.total - m.correct;
    typeCounts[m.questionType].total += m.total;
  }

  // Sort by frequency
  const patterns = Object.entries(tagCounts)
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: Math.round((count / mistakes.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const weakTypes = Object.entries(typeCounts)
    .map(([type, { errors, total }]) => ({
      type,
      errors,
      total,
      errorRate: total > 0 ? Math.round((errors / total) * 100) : 0,
    }))
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 5);

  return { patterns, weakTypes };
}

const TAG_LABELS: Record<string, { label: string; color: string }> = {
  spelling: { label: "Spelling Errors", color: "#EF4444" },
  number_confusion: { label: "Number Confusion", color: "#F59E0B" },
  distractor: { label: "Distractor Traps", color: "#8B5CF6" },
  time_pressure: { label: "Time Pressure", color: "#EC4899" },
  vocab_gap: { label: "Vocabulary Gap", color: "#3B82F6" },
  paraphrasing: { label: "Paraphrasing Miss", color: "#14B8A6" },
  not_given: { label: "Not Given Confusion", color: "#F97316" },
  reading_speed: { label: "Reading Speed", color: "#6366F1" },
};

export function MistakePatterns({
  listeningMistakes,
  readingMistakes,
}: {
  listeningMistakes: MistakeEntry[];
  readingMistakes: MistakeEntry[];
}) {
  const [tab, setTab] = useState<"all" | "listening" | "reading">("all");

  const mistakes = tab === "listening" ? listeningMistakes
    : tab === "reading" ? readingMistakes
    : [...listeningMistakes, ...readingMistakes];

  const { patterns, weakTypes } = detectPatterns(mistakes);

  if (mistakes.length === 0) {
    return (
      <div className="card-base p-12 text-center">
        <AlertTriangle className="w-10 h-10 text-[var(--color-ink-muted)] mx-auto mb-4" />
        <h2 className="heading-md mb-2">No mistake data yet</h2>
        <p className="text-[var(--color-ink-muted)]">
          Add mistake notes when logging tests to see your error patterns here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Filter */}
      <div className="flex gap-2">
        {(["all", "listening", "reading"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors cursor-pointer ${
              tab === t
                ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                : "border-[var(--color-line)] text-[var(--color-ink-secondary)]"
            }`}
          >
            {t === "all" ? "All" : t === "listening" ? "Listening" : "Reading"}
          </button>
        ))}
        <span className="text-xs text-[var(--color-ink-muted)] self-center ml-2">
          {mistakes.length} mistakes analyzed
        </span>
      </div>

      {/* Error Pattern DNA */}
      <div className="card-base p-5">
        <h2 className="heading-md flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-500" />
          Your Mistake DNA
        </h2>
        {patterns.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-muted)]">
            Add more detailed mistake notes to detect patterns
          </p>
        ) : (
          <div className="space-y-3">
            {patterns.map((p) => {
              const info = TAG_LABELS[p.tag] || { label: p.tag, color: "#888" };
              return (
                <div key={p.tag} className="flex items-center gap-3">
                  <div className="w-24 text-right">
                    <span className="text-xs font-mono font-semibold" style={{ color: info.color }}>
                      {p.percentage}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="h-6 rounded-full bg-[var(--color-line)] overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center pl-3"
                        style={{ width: `${Math.max(p.percentage, 15)}%`, backgroundColor: info.color }}
                      >
                        <span className="text-xs text-white font-medium truncate">
                          {info.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--color-ink-muted)] w-12 text-right">
                    {p.count}x
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weakest Question Types */}
      <div className="card-base p-5">
        <h2 className="heading-md mb-4">Weakest Question Types</h2>
        <div className="space-y-2">
          {weakTypes.map((wt) => (
            <div key={wt.type} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)]">
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-ink)]">{wt.type.replace(/_/g, " ")}</p>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  {wt.errors} errors / {wt.total} questions
                </p>
              </div>
              <Badge variant={wt.errorRate > 50 ? "error" : wt.errorRate > 30 ? "warning" : "success"}>
                {wt.errorRate}% error rate
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
