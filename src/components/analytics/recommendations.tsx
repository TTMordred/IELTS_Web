"use client";

import { useEffect, useState } from "react";
import { getRecommendations, type Recommendation } from "@/app/(app)/analytics/actions";
import { Target, TrendingUp, AlertTriangle, HelpCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

function statusIcon(status: Recommendation["status"]) {
  switch (status) {
    case "weak":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case "improving":
      return <TrendingUp className="w-4 h-4 text-yellow-500" />;
    case "no_data":
      return <HelpCircle className="w-4 h-4 text-[var(--color-ink-muted)]" />;
    default:
      return <Target className="w-4 h-4 text-green-500" />;
  }
}

function priorityBadge(priority: number) {
  const pct = Math.round(priority * 100);
  let color = "var(--color-ink-muted)";
  if (pct >= 70) color = "#EF4444";
  else if (pct >= 50) color = "#F97316";
  else if (pct >= 30) color = "#EAB308";

  return (
    <span
      className="text-xs font-mono px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}20`, color }}
    >
      P{pct}
    </span>
  );
}

export function Recommendations() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendations()
      .then(setRecs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-[var(--color-surface)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)] text-center py-8">
        Log more test records to get personalized recommendations
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {recs.map((rec) => (
        <div key={rec.typeId} className="card-base p-4 flex items-start gap-3">
          <div className="mt-0.5">{statusIcon(rec.status)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
                {rec.module}
              </span>
              {priorityBadge(rec.priority)}
            </div>
            <p className="text-sm text-[var(--color-ink-primary)]">{rec.message}</p>
          </div>
          <Link
            href={`/${rec.module}/new`}
            className="shrink-0 flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline mt-1"
          >
            Practice <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ))}
    </div>
  );
}
