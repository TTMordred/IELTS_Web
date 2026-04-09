"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  getTypeTrends,
  type TypeTrend,
} from "@/app/(app)/analytics/trend-actions";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";

function trendColor(trend: TypeTrend["trend"]): string {
  if (trend === "improving") return "#22C55E";
  if (trend === "declining") return "#EF4444";
  return "#EAB308";
}

function TrendArrow({ trend }: { trend: TypeTrend["trend"] }) {
  if (trend === "improving")
    return <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />;
  if (trend === "declining")
    return <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />;
  return <Minus className="w-4 h-4 text-yellow-500 shrink-0" />;
}

function Sparkline({ trend }: { trend: TypeTrend }) {
  const color = trendColor(trend.trend);
  return (
    <ResponsiveContainer width={100} height={40}>
      <AreaChart
        data={trend.dataPoints}
        margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
      >
        <defs>
          <linearGradient id={`spark-${trend.typeId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="accuracy"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${trend.typeId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function FullTrendChart({ trend }: { trend: TypeTrend }) {
  const color = trendColor(trend.trend);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={trend.dataPoints}
        margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
      >
        <defs>
          <linearGradient id={`full-${trend.typeId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--color-ink-muted)" }}
          tickFormatter={(v) => {
            const d = new Date(v);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }}
        />
        <YAxis
          domain={[0, 1]}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          tick={{ fontSize: 10, fill: "var(--color-ink-muted)" }}
          tickFormatter={(v) => `${Math.round(v * 100)}%`}
          width={36}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-line)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value) => [
            `${Math.round(Number(value ?? 0) * 100)}%`,
            "",
          ]}
          labelFormatter={(v) => `Date: ${v}`}
        />
        <Line
          type="monotone"
          dataKey="accuracy"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color }}
          name="accuracy"
        />
        <Line
          type="monotone"
          dataKey="movingAvg"
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          dot={false}
          connectNulls
          name="movingAvg"
          strokeOpacity={0.6}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ConfidenceTrends() {
  const [trends, setTrends] = useState<TypeTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showOnlyDeclining, setShowOnlyDeclining] = useState(false);

  useEffect(() => {
    getTypeTrends()
      .then(setTrends)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 rounded-lg bg-[var(--color-surface)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)] text-center py-8">
        Complete at least 3 practice sessions per question type to see confidence trends
      </p>
    );
  }

  const filtered = showOnlyDeclining
    ? trends.filter((t) => t.trend === "declining")
    : trends;

  return (
    <div className="space-y-4">
      {/* Legend + filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-xs">
          {[
            { color: "#22C55E", label: "Improving" },
            { color: "#EAB308", label: "Stagnating" },
            { color: "#EF4444", label: "Declining" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[var(--color-ink-secondary)]">
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowOnlyDeclining((prev) => !prev)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            showOnlyDeclining
              ? "border-red-500 text-red-500 bg-red-500/10"
              : "border-[var(--color-line)] text-[var(--color-ink-secondary)] hover:border-[var(--color-ink-muted)]"
          }`}
        >
          {showOnlyDeclining ? "Show all" : "Show only declining"}
        </button>
      </div>

      {/* Trend rows */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-muted)] text-center py-4">
            No declining question types — keep it up!
          </p>
        ) : (
          filtered.map((trend) => {
            const isExpanded = expanded === trend.typeId;
            const color = trendColor(trend.trend);
            return (
              <div key={trend.typeId} className="card-base overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-[var(--color-surface)] transition-colors"
                  onClick={() =>
                    setExpanded(isExpanded ? null : trend.typeId)
                  }
                >
                  <TrendArrow trend={trend.trend} />

                  {/* Type info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[var(--color-ink-primary)] truncate">
                        {trend.typeName}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-ink-muted)] uppercase tracking-wide shrink-0">
                        {trend.module}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs font-mono font-semibold"
                        style={{ color }}
                      >
                        {Math.round(trend.currentAccuracy * 100)}%
                      </span>
                      <span className="text-xs text-[var(--color-ink-muted)]">
                        {trend.dataPoints.length} sessions
                      </span>
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="shrink-0">
                    <Sparkline trend={trend} />
                  </div>

                  {/* Expand icon */}
                  <div className="shrink-0 text-[var(--color-ink-muted)]">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Expanded full chart */}
                {isExpanded && (
                  <div className="px-3 pb-4 border-t border-[var(--color-line)]">
                    <p className="text-xs text-[var(--color-ink-muted)] mt-3 mb-2">
                      Accuracy over time — dashed line is 5-point moving average
                    </p>
                    <FullTrendChart trend={trend} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
