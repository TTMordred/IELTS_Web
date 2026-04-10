"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { saveAiGrading } from "@/app/(app)/writing/actions";
import type { RichTeacherFeedback } from "@/lib/types";

interface GradeResult {
  ta: number;
  cc: number;
  lr: number;
  gra: number;
  overallBand: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  teacherFeedback?: RichTeacherFeedback;
}

function bandColor(score: number): string {
  if (score >= 8) return "#22c55e";
  if (score >= 7) return "#84cc16";
  if (score >= 6) return "#eab308";
  if (score >= 5) return "#f97316";
  return "#ef4444";
}

const CRITERIA: { key: "ta" | "cc" | "lr" | "gra"; label: string; name: string }[] = [
  { key: "ta", label: "TA", name: "Task Achievement" },
  { key: "cc", label: "CC", name: "Coherence & Cohesion" },
  { key: "lr", label: "LR", name: "Lexical Resource" },
  { key: "gra", label: "GRA", name: "Grammatical Range & Accuracy" },
];

export function AiGradeWriting({ entryId }: { entryId: string }) {
  const [result, setResult] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(`ai-grade-writing-${entryId}`);
    if (cached) {
      try {
        setResult(JSON.parse(cached) as GradeResult);
      } catch {
        // ignore malformed cache
      }
    }
  }, [entryId]);

  async function handleGrade() {
    setLoading(true);
    setError(null);
    setSaved(false);
    setSaveError(null);
    try {
      const res = await fetch("/api/ai/grade-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
      const data = await res.json() as GradeResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Grading failed");
      }
      setResult(data);
      localStorage.setItem(`ai-grade-writing-${entryId}`, JSON.stringify(data));

      // Auto-save rich feedback to DB
      if (data.teacherFeedback) {
        setSaving(true);
        try {
          await saveAiGrading(
            entryId,
            { ta: data.ta, cc: data.cc, lr: data.lr, gra: data.gra, estimated_band: data.overallBand },
            data.teacherFeedback
          );
          setSaved(true);
          // Reload to show updated TeacherFeedbackPanel
          window.location.reload();
        } catch {
          // Non-critical — grading display still works from local state
          setSaveError("Could not save to database");
        } finally {
          setSaving(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grading failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-base p-5 border-l-4" style={{ borderLeftColor: "#993556" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="heading-md flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "#993556" }} />
          AI Grade
        </h2>
        <button
          onClick={handleGrade}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60 cursor-pointer"
          style={{ backgroundColor: "#993556" }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Grading…" : result ? "Re-grade" : "Grade with AI"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      {saving && <p className="text-sm text-[var(--color-ink-muted)] mb-3">Saving…</p>}
      {saved && <p className="text-sm text-green-500 mb-3">Saved ✓</p>}
      {saveError && <p className="text-sm text-amber-500 mb-3">{saveError}</p>}

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

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
                Strengths
              </p>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm text-[var(--color-ink-secondary)] flex items-start gap-2"
                  >
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {result.improvements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
                Areas to Improve
              </p>
              <ul className="space-y-1">
                {result.improvements.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm text-[var(--color-ink-secondary)] flex items-start gap-2"
                  >
                    <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                    {s}
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
            Click &ldquo;Grade with AI&rdquo; to get an instant IELTS band score with detailed
            feedback.
          </p>
        )
      )}
    </div>
  );
}
