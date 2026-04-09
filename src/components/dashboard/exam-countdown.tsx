"use client";

import { Calendar, Clock, AlertTriangle, Sparkles } from "lucide-react";

type Phase = "normal" | "intensive" | "consolidation" | "revision" | "confidence" | "passed";

function getPhase(daysLeft: number): { phase: Phase; label: string; color: string; message: string } {
  if (daysLeft <= 0) return { phase: "passed", label: "Exam Day!", color: "#EF4444", message: "Good luck! You've prepared well." };
  if (daysLeft <= 3) return { phase: "confidence", label: "Confidence Mode", color: "#22C55E", message: "Review strengths. You're ready!" };
  if (daysLeft <= 7) return { phase: "revision", label: "Revision Mode", color: "#3B82F6", message: "Only review — no new material. Re-read notes." };
  if (daysLeft <= 14) return { phase: "consolidation", label: "Consolidation", color: "#F59E0B", message: "Solidify knowledge. Full mock tests. Review vocab." };
  if (daysLeft <= 30) return { phase: "intensive", label: "Intensive Mode", color: "#EF4444", message: "Focus on weak areas. Practice high-frequency types." };
  return { phase: "normal", label: "On Track", color: "var(--color-accent)", message: "Keep your study rhythm going." };
}

export function ExamCountdown({ examDate, daysLeft }: { examDate: string; daysLeft: number }) {
  const { phase, label, color, message } = getPhase(daysLeft);

  // Progress bar: 90 days → 0
  const totalDays = 90;
  const elapsed = Math.max(0, totalDays - daysLeft);
  const progress = Math.min(100, (elapsed / totalDays) * 100);

  return (
    <div className="card-base p-5 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {daysLeft <= 7 ? (
              <AlertTriangle className="w-4 h-4" style={{ color }} />
            ) : daysLeft <= 30 ? (
              <Clock className="w-4 h-4" style={{ color }} />
            ) : (
              <Calendar className="w-4 h-4" style={{ color }} />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
              {label}
            </span>
          </div>
          <p className="text-sm text-[var(--color-ink-secondary)]">{message}</p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Exam: {examDate}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold font-mono" style={{ color }}>
            {daysLeft}
          </p>
          <p className="text-xs text-[var(--color-ink-muted)]">days left</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 w-full h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>

      {/* Phase tips */}
      {phase === "intensive" && (
        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5">
          <Sparkles className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--color-ink-secondary)]">
            Focus on high-frequency question types (cao). Practice weak areas identified in your heatmap.
          </p>
        </div>
      )}
      {phase === "revision" && (
        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--color-ink-secondary)]">
            Re-read all your notes. Review vocab flashcards. Do 1-2 light practice sessions.
          </p>
        </div>
      )}
      {phase === "confidence" && (
        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--color-ink-secondary)]">
            You&apos;ve done the work. Review your best scores and strengths. Rest well before exam day.
          </p>
        </div>
      )}
    </div>
  );
}
