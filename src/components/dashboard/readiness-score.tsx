"use client";

import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, TrendingUp } from "lucide-react";

type ReadinessData = {
  readinessScore: number;
  confidence: "high" | "medium" | "low";
  gapPenalty: number;
  volatilityPenalty: number;
  unattemptedTypes: string[];
  weakTypes: string[];
  dataPoints: number;
};

const confidenceColors = {
  high: "var(--color-accent)",
  medium: "#EAB308",
  low: "#EF4444",
};

const confidenceLabels = {
  high: "High Confidence",
  medium: "Medium Confidence",
  low: "Low Confidence",
};

export function ReadinessScore({ data }: { data: ReadinessData }) {
  const color = confidenceColors[data.confidence];

  return (
    <div className="card-base p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="heading-md flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color }} />
            Readiness Score
          </h2>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            True band estimate factoring all 41 question types
          </p>
        </div>
        <Badge variant={data.confidence === "high" ? "success" : data.confidence === "medium" ? "warning" : "error"}>
          {confidenceLabels[data.confidence]}
        </Badge>
      </div>

      {/* Main Score */}
      <div className="flex items-center gap-6 mb-4">
        <div className="text-center">
          <p className="text-4xl font-bold font-mono" style={{ color }}>
            {data.readinessScore.toFixed(1)}
          </p>
          <p className="text-xs text-[var(--color-ink-muted)]">Readiness Band</p>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-2 text-sm">
          {data.gapPenalty > 0 && (
            <div className="flex items-center gap-2 text-[var(--color-ink-secondary)]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>-{data.gapPenalty}% gap penalty ({data.unattemptedTypes.length} untested types)</span>
            </div>
          )}
          {data.volatilityPenalty > 0 && (
            <div className="flex items-center gap-2 text-[var(--color-ink-secondary)]">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <span>-{data.volatilityPenalty}% volatility penalty</span>
            </div>
          )}
          <div className="text-xs text-[var(--color-ink-muted)]">
            Based on {data.dataPoints} data points across {41 - data.unattemptedTypes.length}/41 question types
          </div>
        </div>
      </div>

      {/* Weak Types Alert */}
      {data.weakTypes.length > 0 && (
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-xs font-medium text-red-500 mb-1">
            {data.weakTypes.length} weak question types (&lt;50% accuracy)
          </p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            {data.weakTypes.slice(0, 3).map((t) => t.replace(/_/g, " ")).join(", ")}
            {data.weakTypes.length > 3 && ` +${data.weakTypes.length - 3} more`}
          </p>
        </div>
      )}
    </div>
  );
}
