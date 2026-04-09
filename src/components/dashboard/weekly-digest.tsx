"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, X, BarChart3 } from "lucide-react";

type WeekData = {
  xp: number;
  sessions: number;
  vocabReviewed: number;
  activeDays: number;
};

function Delta({ current, previous, suffix = "" }: { current: number; previous: number; suffix?: string }) {
  const diff = current - previous;
  if (diff > 0) return <span className="text-xs text-emerald-500 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+{diff}{suffix}</span>;
  if (diff < 0) return <span className="text-xs text-red-500 flex items-center gap-0.5"><TrendingDown className="w-3 h-3" />{diff}{suffix}</span>;
  return <span className="text-xs text-[var(--color-ink-muted)] flex items-center gap-0.5"><Minus className="w-3 h-3" />same</span>;
}

export function WeeklyDigest({
  thisWeek,
  lastWeek,
  weekLabel,
}: {
  thisWeek: WeekData;
  lastWeek: WeekData;
  weekLabel: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (thisWeek.sessions === 0 && lastWeek.sessions === 0) return null;

  return (
    <div className="card-base p-5 border-l-4 border-l-[var(--color-accent)] relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)] cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-[var(--color-accent)]" />
        <div>
          <h3 className="heading-sm">Weekly Digest</h3>
          <p className="text-xs text-[var(--color-ink-muted)]">{weekLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="section-label mb-1">Sessions</p>
          <p className="text-lg font-bold font-mono text-[var(--color-ink)]">{thisWeek.sessions}</p>
          <Delta current={thisWeek.sessions} previous={lastWeek.sessions} />
        </div>
        <div>
          <p className="section-label mb-1">XP Earned</p>
          <p className="text-lg font-bold font-mono text-[var(--color-ink)]">{thisWeek.xp}</p>
          <Delta current={thisWeek.xp} previous={lastWeek.xp} />
        </div>
        <div>
          <p className="section-label mb-1">Active Days</p>
          <p className="text-lg font-bold font-mono text-[var(--color-ink)]">{thisWeek.activeDays}/7</p>
          <Delta current={thisWeek.activeDays} previous={lastWeek.activeDays} suffix="d" />
        </div>
        <div>
          <p className="section-label mb-1">Vocab Reviewed</p>
          <p className="text-lg font-bold font-mono text-[var(--color-ink)]">{thisWeek.vocabReviewed}</p>
          <Delta current={thisWeek.vocabReviewed} previous={lastWeek.vocabReviewed} />
        </div>
      </div>
    </div>
  );
}
