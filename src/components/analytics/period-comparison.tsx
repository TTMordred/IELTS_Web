"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getPeriodComparison, type PeriodComparisonData, type PeriodStats } from "@/app/(app)/analytics/actions";

type DeltaProps = {
  current: number | null;
  previous: number | null;
  format?: (v: number) => string;
};

function Delta({ current, previous, format }: DeltaProps) {
  if (current === null || previous === null) {
    return <span className="text-xs text-[var(--color-ink-muted)]">—</span>;
  }
  const diff = current - previous;
  const fmt = format ?? ((v: number) => (v > 0 ? `+${v}` : `${v}`));

  if (Math.abs(diff) < 0.01) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-[var(--color-ink-muted)]">
        <Minus className="w-3 h-3" />
        No change
      </span>
    );
  }

  const isUp = diff > 0;
  return (
    <span
      className={[
        "inline-flex items-center gap-0.5 text-xs font-medium",
        isUp ? "text-green-500" : "text-red-500",
      ].join(" ")}
    >
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {fmt(Math.abs(diff))}
    </span>
  );
}

type StatCardProps = {
  label: string;
  thisValue: number | null;
  lastValue: number | null;
  format?: (v: number) => string;
  deltaFormat?: (v: number) => string;
};

function StatCard({ label, thisValue, lastValue, format, deltaFormat }: StatCardProps) {
  const fmt = format ?? ((v: number) => String(v));

  return (
    <div className="card-base p-4 flex flex-col gap-2">
      <span className="section-label">{label}</span>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold font-mono text-[var(--color-ink)]">
            {thisValue !== null ? fmt(thisValue) : "—"}
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Last month: {lastValue !== null ? fmt(lastValue) : "—"}
          </p>
        </div>
        <Delta current={thisValue} previous={lastValue} format={deltaFormat} />
      </div>
    </div>
  );
}

export function PeriodComparison() {
  const [data, setData] = useState<PeriodComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPeriodComparison()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-[var(--color-surface)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { thisMonth, lastMonth } = data;

  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });
  const prevMonthName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-[var(--color-ink-muted)]">
        <span className="font-medium text-[var(--color-ink)]">{monthName}</span>
        <span>vs</span>
        <span>{prevMonthName}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Records logged"
          thisValue={thisMonth.records}
          lastValue={lastMonth.records}
          deltaFormat={(v) => `+${v}`}
        />
        <StatCard
          label="Avg band"
          thisValue={thisMonth.avgBand}
          lastValue={lastMonth.avgBand}
          format={(v) => v.toFixed(1)}
          deltaFormat={(v) => `+${v.toFixed(1)}`}
        />
        <StatCard
          label="Best band"
          thisValue={thisMonth.bestBand}
          lastValue={lastMonth.bestBand}
          format={(v) => v.toFixed(1)}
          deltaFormat={(v) => `+${v.toFixed(1)}`}
        />
      </div>
    </div>
  );
}
