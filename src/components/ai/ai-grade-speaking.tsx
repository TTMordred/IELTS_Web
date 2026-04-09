"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface EvalResult {
  fluency: number;
  lexical: number;
  grammar: number;
  pronunciation: number;
  overallBand: number;
  feedback: string;
  tips: string[];
}

function bandColor(score: number): string {
  if (score >= 8) return "#22c55e";
  if (score >= 7) return "#84cc16";
  if (score >= 6) return "#eab308";
  if (score >= 5) return "#f97316";
  return "#ef4444";
}

const MODULE_COLOR = "#1D9E75";

const CRITERIA: { key: "fluency" | "lexical" | "grammar" | "pronunciation"; label: string; name: string }[] = [
  { key: "fluency", label: "FC", name: "Fluency & Coherence" },
  { key: "lexical", label: "LR", name: "Lexical Resource" },
  { key: "grammar", label: "GRA", name: "Grammatical Range" },
  { key: "pronunciation", label: "PR", name: "Pronunciation" },
];

export function AiGradeSpeaking({ entryId }: { entryId: string }) {
  const [result, setResult] = useState<EvalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(`ai-grade-speaking-${entryId}`);
    if (cached) {
      try {
        setResult(JSON.parse(cached) as EvalResult);
      } catch {
        // ignore malformed cache
      }
    }
  }, [entryId]);

  async function handleEvaluate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/grade-speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
      const data = await res.json() as EvalResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Evaluation failed");
      }
      setResult(data);
      localStorage.setItem(`ai-grade-speaking-${entryId}`, JSON.stringify(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-base p-5 border-l-4" style={{ borderLeftColor: MODULE_COLOR }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="heading-md flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: MODULE_COLOR }} />
          AI Evaluate
        </h2>
        <button
          onClick={handleEvaluate}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60 cursor-pointer"
          style={{ backgroundColor: MODULE_COLOR }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Evaluating…" : result ? "Re-evaluate" : "Evaluate with AI"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {result ? (
        <div className="space-y-4">
          {/* Overall band + feedback */}
          <div className="flex items-start gap-3">
            <div
              className="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white shrink-0"
              style={{ backgroundColor: bandColor(result.overallBand) }}
            >
              <span className="text-lg font-bold font-mono">
                {result.overallBand.toFixed(1)}
              </span>
              <span className="text-[0.6rem] uppercase opacity-80">Band</span>
            </div>
            <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
              {result.feedback}
            </p>
          </div>

          {/* Criteria scores */}
          <div className="grid grid-cols-4 gap-2">
            {CRITERIA.map(({ key, label, name }) => (
              <div
                key={key}
                className="text-center p-2 rounded-lg bg-[var(--color-surface)]"
              >
                <p className="text-xs text-[var(--color-ink-muted)] mb-0.5">{label}</p>
                <p
                  className="text-xl font-bold font-mono"
                  style={{ color: bandColor(result[key]) }}
                >
                  {result[key]}
                </p>
                <p className="text-[0.6rem] text-[var(--color-ink-muted)] leading-tight">
                  {name}
                </p>
              </div>
            ))}
          </div>

          {/* Tips */}
          {result.tips.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
                Tips to Improve
              </p>
              <ul className="space-y-1">
                {result.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-sm text-[var(--color-ink-secondary)] flex items-start gap-2"
                  >
                    <span className="shrink-0 mt-0.5" style={{ color: MODULE_COLOR }}>
                      →
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        !loading &&
        !error && (
          <p className="text-sm text-[var(--color-ink-muted)]">
            Click &ldquo;Evaluate with AI&rdquo; to get an instant IELTS speaking assessment.
          </p>
        )
      )}
    </div>
  );
}
